import { apiUrl } from "./api";

export interface AIMessage {
  id: number;
  type: "user" | "ai";
  content: string;
  timestamp: string;
}

export const callAIAPI = async (
  message: string,
  role: string,
  userId: string | null
): Promise<{ response: string }> => {
  const response = await fetch(apiUrl("/ai/ask"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role,
      question: message,
      user_id: userId ? Number(userId) : null,
    }),
  });

  if (!response.ok) {
    throw new Error("AI request failed");
  }

  const data = await response.json();

  const answer =
    data.result?.answer ||
    data.response ||
    "No answer returned from backend.";

  const warning = data.result?.warning || data.warning;

  return {
    response: warning ? `${answer}\n\n${warning}` : answer,
  };
};