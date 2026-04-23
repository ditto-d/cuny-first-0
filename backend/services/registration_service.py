from models.enrollment import Enrollment


class RegistrationService:
    @staticmethod
    def check_registration_period(semester):
        return semester.current_period == "registration"

    @staticmethod
    def check_course_load(section_ids):
        return 2 <= len(section_ids) <= 4

    @staticmethod
    def has_duplicate_courses(sections):
        seen_courses = set()

        for section in sections:
            if section.course_id in seen_courses:
                return True
            seen_courses.add(section.course_id)

        return False

    @staticmethod
    def has_time_conflict(sections):
        seen_slots = set()

        for section in sections:
            if section.time_slot in seen_slots:
                return True
            seen_slots.add(section.time_slot)

        return False

    @staticmethod
    def check_capacity(section):
        return len(section.enrolled_students) < section.capacity

    @staticmethod
    def add_to_waitlist(student_id, section):
        if student_id in section.waitlist:
            return {
                "success": False,
                "message": "Student is already on the waitlist."
            }

        section.waitlist.append(student_id)
        return {
            "success": True,
            "message": f"Student added to waitlist at position {len(section.waitlist)}."
        }

    @staticmethod
    def register_student(student_id, sections, semester, enrollments):
        if not RegistrationService.check_registration_period(semester):
            return {
                "success": False,
                "message": "Registration is currently closed."
            }

        if not RegistrationService.check_course_load([section.section_id for section in sections]):
            return {
                "success": False,
                "message": "Student must register for 2 to 4 courses."
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

        for section in sections:
            already_enrolled = any(
                enrollment.student_id == student_id and enrollment.section_id == section.section_id
                for enrollment in enrollments
            )

            if already_enrolled:
                continue

            if RegistrationService.check_capacity(section):
                section.enrolled_students.append(student_id)
                enrollments.append(Enrollment(student_id, section.section_id, "enrolled"))
                enrolled_sections.append(section.section_id)
            else:
                waitlist_result = RegistrationService.add_to_waitlist(student_id, section)
                if waitlist_result["success"]:
                    enrollments.append(Enrollment(student_id, section.section_id, "waitlisted"))
                    waitlisted_sections.append(section.section_id)

        return {
            "success": True,
            "message": "Registration processed.",
            "enrolled_sections": enrolled_sections,
            "waitlisted_sections": waitlisted_sections
        }

    @staticmethod
    def drop_student(student_id, section, enrollments):
        removed = False

        for enrollment in list(enrollments):
            if enrollment.student_id == student_id and enrollment.section_id == section.section_id:
                enrollments.remove(enrollment)
                removed = True

        if student_id in section.enrolled_students:
            section.enrolled_students.remove(student_id)
            removed = True

        if student_id in section.waitlist:
            section.waitlist.remove(student_id)
            removed = True

        promoted_student = None

        if not section.is_full() and section.waitlist:
            next_student = section.waitlist.pop(0)
            section.enrolled_students.append(next_student)

            for enrollment in enrollments:
                if enrollment.student_id == next_student and enrollment.section_id == section.section_id:
                    enrollment.status = "enrolled"
                    break
            else:
                enrollments.append(Enrollment(next_student, section.section_id, "enrolled"))

            promoted_student = next_student

        return {
            "success": removed,
            "message": "Drop processed." if removed else "Student was not found in this section.",
            "promoted_student": promoted_student
        }