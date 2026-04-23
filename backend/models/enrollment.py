class Enrollment:
    def __init__(self, student_id, section_id, status="enrolled"):
        self.student_id = student_id
        self.section_id = section_id
        self.status = status

    def to_dict(self):
        return {
            "student_id": self.student_id,
            "section_id": self.section_id,
            "status": self.status
        }