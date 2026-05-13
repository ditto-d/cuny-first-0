from itertools import product


class ScheduleService:

    @staticmethod
    def has_time_conflict(schedule):
        seen_times = set()

        for section in schedule:
            time_slot = section.get("schedule")

            if time_slot in seen_times:
                return True

            seen_times.add(time_slot)

        return False

    @staticmethod
    def generate_possible_schedules(sections_by_course):
        if not sections_by_course:
            return []

        valid_schedules = []

        for combination in product(*sections_by_course):
            schedule = list(combination)

            if not ScheduleService.has_time_conflict(schedule):
                valid_schedules.append(schedule)

        return valid_schedules

    @staticmethod
    def schedules_to_dict(valid_schedules):
        return valid_schedules
