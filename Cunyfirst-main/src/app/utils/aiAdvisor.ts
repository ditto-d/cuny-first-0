import { apiUrl } from "./api";

// AI Academic Advisor Utility Functions

export interface StudentContext {
  username: string;
  gpa: number;
  creditsEarned: number;
  enrolledCourses: number;
  major: string;
  completedCourses: string[];
  currentCourses: string[];
  semester: string;
}

export interface AIMessage {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: string;
  followUpSuggestions?: string[];
}

export const getStudentContext = (): StudentContext => {
  return {
    username: localStorage.getItem("username") || "Student",
    gpa: 0,
    creditsEarned: 0,
    enrolledCourses: 0,
    major: "Unknown",
    completedCourses: [],
    currentCourses: [],
    semester: "Current Semester",
  };
};

export interface AIResponse {
  response: string;
  followUpSuggestions: string[];
}

export const callAIAPI = async (
  message: string,
  context: StudentContext
): Promise<AIResponse> => {
  const response = await fetch(apiUrl("/ai/ask"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role: "student",
      question: message,
      user_id: Number(localStorage.getItem("studentId") || 1),
    }),
  });

  if (!response.ok) {
    throw new Error("AI request failed");
  }

  const data = await response.json();

  const warning = data.result?.warning
    ? `\n\n${data.result.warning}`
    : "";

  return {
    response: `${data.result?.answer || "No answer returned."}${warning}`,
    followUpSuggestions: [
      "What are the graduation requirements?",
      "How does registration work?",
      "What courses should I take next semester?",
    ],
  };
};