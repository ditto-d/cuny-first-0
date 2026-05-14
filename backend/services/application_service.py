from models.application import Application
from services.supabase_client import supabase


class ApplicationService:
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
