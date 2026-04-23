from itertools import product


class ScheduleService:
    @staticmethod
    def has_time_conflict(schedule):
        seen_slots = set()

        for section in schedule:
            if section.time_slot in seen_slots:
                return True
            seen_slots.add(section.time_slot)

        return False

    @staticmethod
    def generate_possible_schedules(sections_by_course):
        if not sections_by_course:
            return []

        all_combinations = product(*sections_by_course)
        valid_schedules = []

        for combo in all_combinations:
            combo_list = list(combo)
            if not ScheduleService.has_time_conflict(combo_list):
                valid_schedules.append(combo_list)

        return valid_schedules

    @staticmethod
    def schedules_to_dict(valid_schedules):
        result = []

        for schedule in valid_schedules:
            result.append([section.to_dict() for section in schedule])

        return result