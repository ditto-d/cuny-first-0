from services.supabase_client import supabase


class RegistrationService:

    @staticmethod
    def check_course_load(section_ids):
        return 2 <= len(section_ids) <= 4

    @staticmethod
    def has_duplicate_courses(sections):
        seen_courses = set()

        for section in sections:
            course_id = section["course_id"]

            if course_id in seen_courses:
                return True

            seen_courses.add(course_id)

        return False

    @staticmethod
    def get_current_period():
        response = (
            supabase.table("system_settings")
            .select("value")
            .eq("key", "current_period")
            .single()
            .execute()
        )
        return response.data["value"] if response.data else None

    @staticmethod
    def has_time_conflict(sections):
        seen_schedules = set()

        for section in sections:
            schedule = section["schedule"]

            if schedule in seen_schedules:
                return True

            seen_schedules.add(schedule)

        return False

    @staticmethod
    def get_sections_by_ids(section_ids):
        response = (
            supabase.table("section")
            .select("*")
            .in_("section_id", section_ids)
            .execute()
        )

        return response.data

    @staticmethod
    def get_enrollment_count(section_id):
        response = (
            supabase.table("enrollment")
            .select("*")
            .eq("section_id", section_id)
            .eq("status", "enrolled")
            .execute()
        )

        return len(response.data)

    @staticmethod
    def check_capacity(section):
        enrolled_count = RegistrationService.get_enrollment_count(section["section_id"])
        return enrolled_count < section["seats"]

    @staticmethod
    def is_already_registered(student_id, section_id):
        response = (
            supabase.table("enrollment")
            .select("*")
            .eq("student_id", student_id)
            .eq("section_id", section_id)
            .execute()
        )

        return len(response.data) > 0

    @staticmethod
    def enroll_student(student_id, section_id, status="enrolled"):
        return (
            supabase.table("enrollment")
            .insert({
                "student_id": student_id,
                "section_id": section_id,
                "status": status
            })
            .execute()
        )

    @staticmethod
    def register_student(student_id, section_ids):
        current_period = RegistrationService.get_current_period()

        if current_period== "registration":
            pass
        elif current_period=="special_registration":

            if not RegistrationService.can_register_during_special_period(student_id):
                return {
                    "success" : False,
                    "message": "Student is not eligible for special re-registration."
                }
        else:
            return {
            "success" : False,
            "message": "Registration is not currently open."
             }


        if not RegistrationService.check_course_load(section_ids):
            return {
                "success": False,
                "message": "Student must register for 2 to 4 courses."
            }

        sections = RegistrationService.get_sections_by_ids(section_ids)

        if len(sections) != len(section_ids):
            return {
                "success": False,
                "message": "One or more section IDs were not found."
            }

        if RegistrationService.has_duplicate_courses(sections):
            return {
                "success": False,
                "message": "Student cannot register for multiple sections of the same course."
            }

        if RegistrationService.has_time_conflict(sections):
            return {
                "success": False,
                "message": "Selected sections contain time conflicts."
            }

        for section in sections:
            course_id=section["course_id"]

            if RegistrationService.is_currently_enrolled_in_course(student_id, course_id):
               if not RegistrationService.has_failed_course_before(student_id, course_id):
                   return {"success": False,
                           "message": "Student can only retake a course if they previously received an F."
                           }

        enrolled_sections = []
        waitlisted_sections = []
        skipped_sections = []

        for section in sections:
            section_id = section["section_id"]

            if RegistrationService.is_already_registered(student_id, section_id):
                skipped_sections.append(section_id)
                continue

            if RegistrationService.check_capacity(section):
                RegistrationService.enroll_student(
                    student_id,
                    section_id,
                    "enrolled"
                )
                enrolled_sections.append(section_id)

            else:
                RegistrationService.enroll_student(
                    student_id,
                    section_id,
                    "waitlisted"
                )
                waitlisted_sections.append(section_id)

                if current_period == "special_registration" and enrolled_sections:
                    supabase.table("enrollment") \
                        .update({"needs_reregistration": False}) \
                        .eq("student_id", student_id) \
                        .eq("needs_reregistration", True) \
                        .execute()

        return {
            "success": True,
            "message": "Registration processed.",
            "enrolled_sections": enrolled_sections,
            "waitlisted_sections": waitlisted_sections,
            "skipped_sections": skipped_sections
        }

    @staticmethod
    def drop_student(student_id, section_id):
        existing = (
            supabase.table("enrollment")
            .select("*")
            .eq("student_id", student_id)
            .eq("section_id", section_id)
            .execute()
        )

        if not existing.data:
            return {
                "success": False,
                "message": "Student is not enrolled or waitlisted in this section."
            }

        supabase.table("enrollment") \
            .delete() \
            .eq("student_id", student_id) \
            .eq("section_id", section_id) \
            .execute()

        return {
            "success": True,
            "message": "Student removed from section or waitlist."
        }

    @staticmethod
    def admit_from_waitlist(instructor_id, section_id, student_id):
        section_res = (
            supabase.table("section")
            .select("*")
            .eq("section_id", section_id)
            .single()
            .execute()
        )

        if not section_res.data:
            return {"success": False, "message": "Section not found."}

        if section_res.data["instructor_id"] != instructor_id:
            return {"success": False, "message": "Only the assigned instructor can admit waitlisted students."}

        if not RegistrationService.check_capacity(section_res.data):
            return {"success": False, "message": "Section is still full."}

        existing = (
            supabase.table("enrollment")
            .select("*")
            .eq("student_id", student_id)
            .eq("section_id", section_id)
            .eq("status", "waitlisted")
            .execute()
        )

        if not existing.data:
            return {"success": False, "message": "Student is not waitlisted for this section."}

        supabase.table("enrollment") \
            .update({"status": "enrolled"}) \
            .eq("student_id", student_id) \
            .eq("section_id", section_id) \
            .execute()

        return {"success": True, "message": "Student admitted from waitlist."}

    @staticmethod
    def cancel_low_enrollment_sections():
        sections = supabase.table("section").select("*").eq("status", "active").execute().data or []
        cancelled = []

        for section in sections:
            section_id = section["section_id"]
            enrolled_count = RegistrationService.get_enrollment_count(section_id)

            if enrolled_count < 3:
                supabase.table("section").update({"status": "cancelled"}).eq("section_id", section_id).execute()

                supabase.table("warning").insert({
                    "target_type": "instructor",
                    "target_id": section["instructor_id"],
                    "reason": f"Section {section_id} was cancelled due to fewer than 3 students."
                }).execute()

                supabase.table("enrollment").update({
                    "needs_reregistration": True
                }).eq("section_id", section_id).eq("status", "enrolled").execute()

                cancelled.append(section_id)

        suspension_result = RegistrationService.suspend_instructors_with_all_courses_cancelled()

        return {
            "success": True,
            "cancelled_sections": cancelled,
            "suspended_instructors": suspension_result["suspended_instructors"]
        }

    @staticmethod
    def warn_students_with_low_course_load():
        students = supabase.table("student").select("student_id").execute().data or []
        warned = []

        for student in students:
            student_id = student["student_id"]

            enrollments = (
                    supabase.table("enrollment")
                    .select("*")
                    .eq("student_id", student_id)
                    .eq("status", "enrolled")
                    .execute()
                    .data or []
            )

            if len(enrollments) < 2:
                supabase.table("warning").insert({
                    "target_type": "student",
                    "target_id": student_id,
                    "reason": "Student has fewer than 2 enrolled courses."
                }).execute()

                warned.append(student_id)

        return {
            "success": True,
            "warned_students": warned
        }

    @staticmethod
    def set_current_period(period):
        allowed_periods = [
            "class_setup",
            "registration",
            "class_running",
            "grading",
            "special_registration"
        ]

        if period not in allowed_periods:
            return {
                "success": False,
                "message": "Invalid semester period."
            }

        supabase.table("system_settings") \
            .upsert({"key": "current_period", "value": period}) \
            .execute()

        return {
            "success": True,
            "message": f"Current period updated to {period}."
        }

    @staticmethod
    def has_failed_course_before(student_id, course_id):
        response = (
            supabase.table("enrollment")
            .select("*, section(course_id)")
            .eq("student_id", student_id)
            .eq("status", "enrolled")
            .execute()
        )

        for enrollment in response.data or []:
            section = enrollment.get("section")

            if not section:
                continue

            if section.get("course_id") != course_id:
                continue

            grade_response = (
                supabase.table("grade")
                .select("letter_grade")
                .eq("enrollment_id", enrollment["enrollment_id"])
                .execute()
            )

            for grade in grade_response.data or []:
                if grade.get("letter_grade") == "F":
                    return True

        return False

    @staticmethod
    def is_currently_enrolled_in_course(student_id, course_id):
        response = (
            supabase.table("enrollment")
            .select("*, section(course_id)")
            .eq("student_id", student_id)
            .eq("status", "enrolled")
            .execute()
        )

        for enrollment in response.data or []:
            section = enrollment.get("section")

            if section and section.get("course_id") == course_id:
                return True

        return False

    @staticmethod
    def can_register_during_special_period(student_id):
        response = (
            supabase.table("enrollment")
            .select("*")
            .eq("student_id", student_id)
            .eq("needs_reregistration", True)
            .execute()
        )

        return len(response.data or []) > 0

    @staticmethod
    def suspend_instructors_with_all_courses_cancelled():
        instructors = (
            supabase.table("instructor")
            .select("instructor_id")
            .execute()
            .data or []
        )

        suspended = []

        for instructor in instructors:
            instructor_id = instructor["instructor_id"]

            sections = (
                supabase.table("section")
                .select("status")
                .eq("instructor_id", instructor_id)
                .execute()
                .data or []
            )

            if sections and all(section.get("status") == "cancelled" for section in sections):
                supabase.table("instructor") \
                    .update({"is_suspended": True}) \
                    .eq("instructor_id", instructor_id) \
                    .execute()

                supabase.table("warning").insert({
                    "target_type": "instructor",
                    "target_id": instructor_id,
                    "reason": "Instructor suspended because all assigned courses were cancelled."
                }).execute()

                suspended.append(instructor_id)

        return {
            "success": True,
            "message": "Instructor suspension check completed.",
            "suspended_instructors": suspended
        }