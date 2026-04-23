class Course:
    def __init__(self, course_id, name, credits, description=""):
        self.course_id = course_id
        self.name = name
        self.credits = credits
        self.description = description

    def to_dict(self):
        return {
            "course_id": self.course_id,
            "name": self.name,
            "credits": self.credits,
            "description": self.description
        }