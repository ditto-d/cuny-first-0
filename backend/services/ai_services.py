from google import genai


class AIService:
    """
    AI Assistant service layer.

    Current flow:
    1. Check role permissions
    2. Search local knowledge/database
    3. If no reliable answer exists:
       fallback to Gemini
    4. Return hallucination warning when Gemini is used
    """

    @staticmethod
    def answer_question(role, question, user_id=None):

        role = role.lower()
        question = question.lower()

        # Visitor questions
        if role == "visitor":
            local_answer = AIService.handle_visitor_question(question)

        # Student questions
        elif role == "student":
            local_answer = AIService.handle_student_question(question, user_id)

        # Instructor questions
        elif role == "instructor":
            local_answer = AIService.handle_instructor_question(question, user_id)

        else:
            return {
                "source": "error",
                "answer": "Invalid role.",
                "warning": None
            }

        # Local answer found
        if local_answer:
            return {
                "source": "local_database",
                "answer": local_answer,
                "warning": None
            }

        # No local answer → Gemini fallback
        return AIService.llm_fallback(question)

    # -----------------------------------------
    # VISITOR
    # -----------------------------------------

    @staticmethod
    def handle_visitor_question(question):

        if "requirement" in question:
            return (
                "Visitors can ask general questions about "
                "classes and program requirements."
            )

        if "course" in question or "class" in question:
            return (
                "General course information is available "
                "to visitors."
            )

        if "admission" in question:
            return (
                "Visitors may ask general questions about "
                "the admissions process."
            )

        return None

    # -----------------------------------------
    # STUDENT
    # -----------------------------------------

    @staticmethod
    def handle_student_question(question, user_id):

        if "my classes" in question:
            return (
                "Students can ask questions about "
                "classes they are currently taking."
            )

        if "gpa" in question:
            return (
                "Students may view their GPA "
                "and academic performance records."
            )

        if "schedule" in question:
            return (
                "Students may generate schedules "
                "without time conflicts."
            )

        # Students also inherit visitor/general info
        return AIService.handle_visitor_question(question)

    # -----------------------------------------
    # INSTRUCTOR
    # -----------------------------------------

    @staticmethod
    def handle_instructor_question(question, user_id):

        if "student" in question:
            return (
                "Instructors may ask questions about "
                "students in their assigned classes only."
            )

        if "assigned classes" in question:
            return (
                "Instructors may access information "
                "about their assigned sections."
            )

        return None

    # -----------------------------------------
    # GEMINI FALLBACK
    # -----------------------------------------

    @staticmethod
    def llm_fallback(question):

        try:
            client = genai.Client()

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=question
            )

            return {
                "source": "gemini_fallback",
                "answer": response.text,
                "warning": (
                    "Warning: This response was generated "
                    "by Gemini because no reliable local "
                    "answer was found. The response may "
                    "contain inaccuracies or hallucinations."
                )
            }

        except Exception as error:

            return {
                "source": "gemini_error",
                "answer": (
                    "No local answer was found and the "
                    "Gemini fallback failed."
                ),
                "warning": str(error)
            }