class Section:
    def __init__(self, section_id, course_id, instructor_id, time_slot, capacity, semester):
        self.section_id = section_id
        self.course_id = course_id
        self.instructor_id = instructor_id
        self.time_slot = time_slot
        self.capacity = capacity
        self.semester = semester
        self.enrolled_students = []
        self.waitlist = []

    def is_full(self):
        return len(self.enrolled_students) >= self.capacity

    def to_dict(self):
        return {
            "section_id": self.section_id,
            "course_id": self.course_id,
            "instructor_id": self.instructor_id,
            "time_slot": self.time_slot,
            "capacity": self.capacity,
            "semester": self.semester,
            "enrolled_students": self.enrolled_students,
            "waitlist": self.waitlist
        }