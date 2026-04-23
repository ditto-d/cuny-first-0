class Semester:
    def __init__(self, name, current_period):
        self.name = name
        self.current_period = current_period

    def to_dict(self):
        return {
            "name": self.name,
            "current_period": self.current_period
        }