import { apiUrl } from "./api";

export interface AIMessage {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: string;
}

export const callAIAPI = async (
  message: string
): Promise<{ response: string }> => {
  const response = await fetch(apiUrl("/ai/ask"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role: localStorage.getItem("userRole") || "student",
      question: message,
      user_id: Number(localStorage.getItem("studentId") || 1),
    }),
  });

  if (!response.ok) {
    throw new Error("AI request failed");
  }

  const data = await response.json();

  const answer = data.result?.answer || "No answer returned from backend.";
  const warning = data.result?.warning ? `\n\n${data.result.warning}` : "";

  return {
    response: `${answer}${warning}`,
  };
};