import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { callAIAPI, type AIMessage as AIMessageType } from "../utils/aiAdvisor";
import { useLocation } from "react-router";

export function AIAdvisor() {
  const location = useLocation();

const role = location.pathname.includes("/student")
  ? "student"
  : location.pathname.includes("/instructor")
  ? "instructor"
  : location.pathname.includes("/registrar")
  ? "registrar"
  : "visitor";

const userId =
  role === "registrar"
    ? localStorage.getItem("registrarId")
    : role === "instructor"
    ? localStorage.getItem("instructorId")
    : role === "student"
    ? localStorage.getItem("studentId")
    : null;

const idLabel =
  role === "registrar"
    ? "Registrar ID"
    : role === "instructor"
    ? "Instructor ID"
    : role === "student"
    ? "Student ID"
    : "Guest";
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<AIMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const username = localStorage.getItem("username") || "Student";

  useEffect(() => {
    setMessages([
      {
        id: 1,
        type: "ai",
        content:
          "Hello. I am connected to the backend AI service. Ask a question and I will search the local College0 knowledge base first, then use the LLM fallback if needed.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendQuestion = async (text: string) => {
    if (!text.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const userMessage: AIMessageType = {
      id: Date.now(),
      type: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsTyping(true);

    try {
     const aiResult = await callAIAPI(text, role, userId);

      const aiResponse: AIMessageType = {
        id: Date.now() + 1,
        type: "ai",
        content: aiResult.response,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("AI API error:", error);
      toast.error("Failed to get AI response from backend.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl text-gray-900 font-semibold">
                AI Academic Advisor
              </h1>
              <p className="text-gray-600">
                Backend-connected College0 AI assistant
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                        msg.type === "user"
                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      {msg.type === "ai" && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-600">
                            Backend AI
                          </span>
                        </div>
                      )}

                      <p className="text-sm leading-relaxed whitespace-pre-line">
                        {msg.content}
                      </p>

                      <p
                        className={`text-xs mt-2 ${
                          msg.type === "user" ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-5 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600">
                          Backend AI
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                        <span className="text-sm text-gray-500">
                          Searching backend knowledge base...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendQuestion(message);
                    }}
                    placeholder="Ask about College0 requirements, registration, classes, or policies..."
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300"
                  />

                  <button
                    onClick={() => sendQuestion(message)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-gray-900 font-semibold mb-4">
                Logged-in Context
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">User</span>
                  <span className="font-medium text-gray-900">{username}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Role</span>
                  <span className="font-medium text-gray-900">{role}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">{idLabel}</span>
                  <span className="font-medium text-gray-900">{userId || "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-sm p-6 text-white">
              <h3 className="font-semibold mb-4">Backend AI Flow</h3>
              <ul className="space-y-3 text-sm">
                <li>• Frontend sends your question to the Flask backend</li>
                <li>• Backend searches the local College0 vector database</li>
                <li>• If no local answer is found, backend uses LLM fallback</li>
                <li>• Any fallback answer returns with a hallucination warning</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Backend AI Connected
                  </p>
                  <p className="text-xs text-gray-500">
                    Uses /ai/ask endpoint
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}