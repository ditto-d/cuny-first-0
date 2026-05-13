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