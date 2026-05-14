from models.application import Application
from services.supabase_client import supabase
from datetime import datetime, timezone
import secrets
import string


class ApplicationService:
    GPA_ACCEPTANCE_THRESHOLD = 3.0

    @staticmethod
    def email_exists(email: str) -> bool:
        account_response = (
            supabase.table("account")
            .select("email")
            .eq("email", email)
            .limit(1)
            .execute()
        )
        if account_response.data:
            return True

        admission_response = (
            supabase.table("admission")
            .select("email,status")
            .eq("email", email)
            .in_("status", ["Pending", "Accepted"])
            .limit(1)
            .execute()
        )

        return bool(admission_response.data)

    @staticmethod
    def submit_application(application: Application) -> tuple[dict, int]:
        if ApplicationService.email_exists(application.email):
            return {
                "success": False,
                "message": "An account or pending application already exists for this email.",
            }, 409

        try:
            response = (
                supabase.table("admission")
                .insert(application.to_admission_payload(include_optional_fields=True))
                .execute()
            )
        except Exception:
            response = (
                supabase.table("admission")
                .insert(application.to_admission_payload(include_optional_fields=False))
                .execute()
            )

        created_application = response.data[0] if response.data else None
        return {
            "success": True,
            "message": "Application submitted and is pending registrar review.",
            "application": created_application,
        }, 201

    @staticmethod
    def get_application(admission_id: int) -> dict | None:
        response = (
            supabase.table("admission")
            .select("*")
            .eq("admission_id", admission_id)
            .limit(1)
            .execute()
        )

        return response.data[0] if response.data else None

    @staticmethod
    def list_applications(status: str | None = None) -> tuple[dict, int]:
        query = supabase.table("admission").select("*").order("submitted_at", desc=True)
        if status:
            query = query.eq("status", status)

        response = query.execute()

        return {
            "success": True,
            "applications": response.data,
        }, 200

    @staticmethod
    def get_application_review(admission_id: int, review_data: dict) -> tuple[dict, int]:
        application = ApplicationService.get_application(admission_id)
        if not application:
            return {"success": False, "message": "Application not found."}, 404

        application_type = ApplicationService._application_type(application, review_data)
        if application_type == "student":
            eligibility = ApplicationService.evaluate_student_eligibility(application, review_data.get("program_id"))
        elif application_type == "instructor":
            eligibility = {"eligible": True, "reasons": ["Instructor approval is registrar discretionary."]}
        else:
            eligibility = {
                "eligible": False,
                "reasons": ["Application type is required to evaluate this application."],
            }

        return {
            "success": True,
            "application": application,
            "eligibility": eligibility,
        }, 200

    @staticmethod
    def approve_application(admission_id: int, review_data: dict) -> tuple[dict, int]:
        application = ApplicationService.get_application(admission_id)
        if not application:
            return {"success": False, "message": "Application not found."}, 404

        if application.get("status") != "Pending":
            return {
                "success": False,
                "message": f"Application has already been {application.get('status')}.",
            }, 409

        application_type = ApplicationService._application_type(application, review_data)
        if application_type not in {"student", "instructor"}:
            return {
                "success": False,
                "message": "Application type is required and must be student or instructor.",
            }, 400

        registrar_id = review_data.get("registrar_id")
        justification = (review_data.get("justification") or review_data.get("override_justification") or "").strip()
        program_id = review_data.get("program_id")
        department_id = review_data.get("department_id")

        if application_type == "student":
            eligibility = ApplicationService.evaluate_student_eligibility(application, program_id)
            if not eligibility["eligible"] and not justification:
                return {
                    "success": False,
                    "message": "Student does not meet automatic approval rules. Override justification is required.",
                    "eligibility": eligibility,
                }, 400
        else:
            if not department_id:
                return {
                    "success": False,
                    "message": "department_id is required to approve an instructor application.",
                }, 400
            eligibility = {"eligible": True, "reasons": ["Instructor approval is registrar discretionary."]}

        email = application["email"]
        temporary_password = review_data.get("temporary_password") or ApplicationService.generate_temporary_password()
        username = review_data.get("username") or ApplicationService.generate_username(application)

        existing_account = (
            supabase.table("account")
            .select("user_id,email")
            .eq("email", email)
            .limit(1)
            .execute()
        )
        if existing_account.data:
            return {
                "success": False,
                "message": "An account already exists for this email.",
            }, 409

        auth_user = ApplicationService.create_auth_user(
            email=email,
            password=temporary_password,
            application_type=application_type,
            username=username,
        )

        account = ApplicationService.create_account(
            application=application,
            application_type=application_type,
            username=username,
            auth_user_id=getattr(auth_user, "id", None),
        )
        user_id = account["user_id"]

        if application_type == "student":
            ApplicationService.create_student(user_id, application, program_id)
        else:
            ApplicationService.create_instructor(user_id, department_id)

        ApplicationService.update_application_status(
            admission_id=admission_id,
            status="Accepted",
            registrar_id=registrar_id,
            justification=justification,
        )

        return {
            "success": True,
            "message": "Application approved and account created.",
            "account": {
                "user_id": user_id,
                "username": username,
                "email": email,
                "role": application_type,
            },
            "temporary_password": temporary_password,
            "must_change_password": True,
            "eligibility": eligibility,
        }, 201

    @staticmethod
    def reject_application(admission_id: int, review_data: dict) -> tuple[dict, int]:
        application = ApplicationService.get_application(admission_id)
        if not application:
            return {"success": False, "message": "Application not found."}, 404

        if application.get("status") != "Pending":
            return {
                "success": False,
                "message": f"Application has already been {application.get('status')}.",
            }, 409

        application_type = ApplicationService._application_type(application, review_data)
        justification = (review_data.get("justification") or "").strip()
        registrar_id = review_data.get("registrar_id")

        if application_type == "student":
            eligibility = ApplicationService.evaluate_student_eligibility(application, review_data.get("program_id"))
            if eligibility["eligible"] and not justification:
                return {
                    "success": False,
                    "message": "Justification is required to reject a student who meets automatic acceptance rules.",
                    "eligibility": eligibility,
                }, 400
        else:
            eligibility = {"eligible": False, "reasons": ["Instructor approval is registrar discretionary."]}

        ApplicationService.update_application_status(
            admission_id=admission_id,
            status="Rejected",
            registrar_id=registrar_id,
            justification=justification,
        )

        return {
            "success": True,
            "message": "Application rejected.",
            "eligibility": eligibility,
        }, 200

    @staticmethod
    def evaluate_student_eligibility(application: dict, program_id: int | str | None = None) -> dict:
        reasons = []
        warnings = []
        gpa = ApplicationService._to_float(application.get("gpa"))
        gpa_ok = gpa is not None and gpa > ApplicationService.GPA_ACCEPTANCE_THRESHOLD

        if gpa_ok:
            reasons.append("GPA is greater than 3.0.")
        else:
            reasons.append("GPA is not greater than 3.0.")

        quota = ApplicationService.program_quota_available(program_id)
        reasons.extend(quota["reasons"])
        warnings.extend(quota["warnings"])

        return {
            "eligible": gpa_ok and quota["available"],
            "gpa": gpa,
            "gpa_required": f">{ApplicationService.GPA_ACCEPTANCE_THRESHOLD}",
            "program_id": program_id,
            "program_quota_available": quota["available"],
            "reasons": reasons,
            "warnings": warnings,
        }

    @staticmethod
    def program_quota_available(program_id: int | str | None) -> dict:
        if not program_id:
            return {
                "available": True,
                "reasons": ["No program_id was provided; program quota was treated as available."],
                "warnings": ["Pass program_id when approving students to enforce a specific program quota."],
            }

        program_response = (
            supabase.table("program")
            .select("*")
            .eq("program_id", program_id)
            .limit(1)
            .execute()
        )
        if not program_response.data:
            return {
                "available": False,
                "reasons": ["Program was not found."],
                "warnings": [],
            }

        program = program_response.data[0]
        quota = (
            program.get("student_quota")
            or program.get("quota")
            or program.get("capacity")
            or program.get("max_students")
        )

        if quota is None:
            return {
                "available": True,
                "reasons": ["Program quota column is not configured; quota was treated as available."],
                "warnings": ["Add program.student_quota to enforce quota automatically."],
            }

        students_response = (
            supabase.table("student")
            .select("student_id")
            .eq("program_id", program_id)
            .eq("is_active", True)
            .execute()
        )
        active_count = len(students_response.data)

        return {
            "available": active_count < int(quota),
            "reasons": [f"Program has {active_count} active students out of {quota} allowed."],
            "warnings": [],
        }

    @staticmethod
    def create_auth_user(email: str, password: str, application_type: str, username: str):
        try:
            response = supabase.auth.admin.create_user(
                {
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {
                        "role": application_type,
                        "username": username,
                        "must_change_password": True,
                    },
                }
            )
        except Exception as error:
            raise RuntimeError(
                "Supabase Auth user creation failed. Make sure SUPABASE_KEY is a service role key."
            ) from error

        return getattr(response, "user", response)

    @staticmethod
    def create_account(application: dict, application_type: str, username: str, auth_user_id: str | None) -> dict:
        payload = {
            "username": username,
            "account_type": application_type,
            "first_name": ApplicationService._first_name(application),
            "last_name": ApplicationService._last_name(application),
            "email": application["email"],
            "password_hash": "managed_by_supabase",
        }

        optional_payload = {
            **payload,
            "auth_user_id": auth_user_id,
            "must_change_password": True,
        }

        try:
            response = supabase.table("account").insert(optional_payload).execute()
        except Exception:
            try:
                optional_without_username = {
                    key: value
                    for key, value in optional_payload.items()
                    if key != "username"
                }
                response = supabase.table("account").insert(optional_without_username).execute()
            except Exception:
                legacy_payload = {key: value for key, value in payload.items() if key != "username"}
                response = supabase.table("account").insert(legacy_payload).execute()

        if not response.data:
            raise RuntimeError("Account insert failed.")

        return response.data[0]

    @staticmethod
    def create_student(user_id: int, application: dict, program_id: int | str | None):
        payload = {
            "student_id": user_id,
            "gpa": ApplicationService._to_float(application.get("gpa")) or 0,
            "is_active": True,
            "enrollment_date": datetime.now(timezone.utc).date().isoformat(),
            "academic_standing": "Good Standing",
            "program_id": program_id,
        }

        return supabase.table("student").insert(payload).execute()

    @staticmethod
    def create_instructor(user_id: int, department_id: int | str):
        payload = {
            "instructor_id": user_id,
            "department_id": department_id,
            "hire_date": datetime.now(timezone.utc).date().isoformat(),
        }

        return supabase.table("instructor").insert(payload).execute()

    @staticmethod
    def update_application_status(
        admission_id: int,
        status: str,
        registrar_id: int | str | None,
        justification: str,
    ):
        payload = {
            "status": status,
            "registrar_id": registrar_id,
        }
        optional_payload = {
            **payload,
            "review_justification": justification or None,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        }

        try:
            return (
                supabase.table("admission")
                .update(optional_payload)
                .eq("admission_id", admission_id)
                .execute()
            )
        except Exception:
            return (
                supabase.table("admission")
                .update(payload)
                .eq("admission_id", admission_id)
                .execute()
            )

    @staticmethod
    def generate_temporary_password() -> str:
        alphabet = string.ascii_letters + string.digits
        return f"{''.join(secrets.choice(alphabet) for _ in range(14))}A1!"

    @staticmethod
    def generate_username(application: dict) -> str:
        first = ApplicationService._first_name(application).lower()
        last = ApplicationService._last_name(application).lower()
        base = ".".join(part for part in [first, last] if part) or application["email"].split("@")[0]
        base = "".join(char if char.isalnum() or char == "." else "" for char in base).strip(".")
        username = base or f"user{application['admission_id']}"

        try:
            existing = (
                supabase.table("account")
                .select("username")
                .ilike("username", f"{username}%")
                .execute()
            )
        except Exception:
            return username

        existing_usernames = {row["username"] for row in existing.data if row.get("username")}
        if username not in existing_usernames:
            return username

        suffix = 2
        while f"{username}{suffix}" in existing_usernames:
            suffix += 1
        return f"{username}{suffix}"

    @staticmethod
    def _application_type(application: dict, review_data: dict) -> str | None:
        return application.get("application_type") or review_data.get("application_type")

    @staticmethod
    def _first_name(application: dict) -> str:
        if application.get("first_name"):
            return application["first_name"]
        return (application.get("applicant_name") or "").split(" ", 1)[0]

    @staticmethod
    def _last_name(application: dict) -> str:
        if application.get("last_name"):
            return application["last_name"]
        parts = (application.get("applicant_name") or "").split(" ", 1)
        return parts[1] if len(parts) > 1 else ""

    @staticmethod
    def _to_float(value) -> float | None:
        if value is None:
            return None
        try:
            return float(value)
        except (TypeError, ValueError):
            return None
