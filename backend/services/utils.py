"""
Shared constants and helpers for the Grades/GPA/Reviews/Complaints module.
 
Grade scale matches the letter_grade:
('A','A-','B+','B','B-','C+','C','C-','D+','D','F','W','I')

Excluded from GPA calculation but valid grades in database:
W - Withdrawal 
I -Incomplete

"""
 
# Maps every GPA-counting letter grade to its point value.
GRADE_SCALE: dict[str, float] = {
    'A':  4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B':  3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C':  2.0,
    'C-': 1.7,
    'D+': 1.3,
    'D':  1.0,
    'F':  0.0,
}
 
# Every grade the DB CHECK constraint allows
VALID_GRADES: list[str] = [
    'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'W', 'I'
]
 
# Subset that actually affects GPA (excludes W and I)
GPA_GRADES: set[str] = set(GRADE_SCALE.keys())
 
#Convert a letter grade to its GPA point value.
def letter_to_points(letter_grade: str) -> float:
    if letter_grade not in GRADE_SCALE:
        raise ValueError(
            f"Grade '{letter_grade}' does not carry a GPA value. "
            f"GPA-counting grades: {', '.join(GRADE_SCALE)}"
        )
    return GRADE_SCALE[letter_grade]