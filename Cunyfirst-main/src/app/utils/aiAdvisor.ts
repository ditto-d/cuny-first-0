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
  const role = localStorage.getItem("userRole") || "student";

  const userId =
    role === "registrar"
      ? Number(localStorage.getItem("registrarId") || 1)
      : role === "instructor"
      ? Number(localStorage.getItem("instructorId") || 1)
      : Number(localStorage.getItem("studentId") || 1);

  const response = await fetch(apiUrl("/ai/ask"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role,
      question: message,
      user_id: userId,
    }),
  });

  if (!response.ok) {
    throw new Error("AI request failed");
  }

  const data = await response.json();

  const answer =
    data.result?.answer ||
    data.response ||
    "No confident answer found in the College0 knowledge base. Please rephrase your question.";

  const warning = data.result?.warning || data.warning;

  return {
    response: warning ? `${answer}\n\n${warning}` : answer,
  };
};