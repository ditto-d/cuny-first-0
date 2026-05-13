import { useState, useEffect, useRef } from "react";
import { Bot, Send, Sparkles, BookOpen, Calendar, Users, TrendingUp, GraduationCap, Award, BookMarked, Loader2 } from "lucide-react";
import { callAIAPI, getStudentContext, type AIMessage as AIMessageType } from "../utils/aiAdvisor";
import { toast } from "sonner";

export function AIAdvisor() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<AIMessageType[]>([
    {
      id: 1,
      type: "ai",
      content: "Hello! I'm your AI Academic Advisor. I can help you with course planning, registration guidance, degree requirements, and academic questions. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      followUpSuggestions: [
        "What courses should I take next semester?",
        "Am I on track to graduate on time?",
        "How can I improve my GPA?",
      ],
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const studentContext = getStudentContext();

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const suggestedQuestions = [
    { icon: BookOpen, text: "What courses should I take next semester?", category: "Course Planning" },
    { icon: Calendar, text: "Am I on track to graduate on time?", category: "Academic Progress" },
    { icon: Users, text: "What are the prerequisites for CS 350?", category: "Requirements" },
    { icon: TrendingUp, text: "How can I improve my GPA?", category: "Academic Advice" },
  ];

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    const userMessage: AIMessageType = {
      id: messages.length + 1,
      type: "user",
      content: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, userMessage]);
    setMessage("");
    setIsTyping(true);

    try {
      const aiResult = await callAIAPI(message, studentContext);

      const aiResponse: AIMessageType = {
        id: messages.length + 2,
        type: "ai",
        content: aiResult.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        followUpSuggestions: aiResult.followUpSuggestions,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      toast.error("Failed to get AI response. Please try again.");
      console.error("AI API error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setMessage(text);
  };

  const handleFollowUpClick = async (text: string) => {
    const userMessage: AIMessageType = {
      id: messages.length + 1,
      type: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, userMessage]);
    setIsTyping(true);

    try {
      const aiResult = await callAIAPI(text, studentContext);

      const aiResponse: AIMessageType = {
        id: messages.length + 2,
        type: "ai",
        content: aiResult.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        followUpSuggestions: aiResult.followUpSuggestions,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      toast.error("Failed to get AI response. Please try again.");
      console.error("AI API error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl text-gray-900 font-semibold">AI Academic Advisor</h1>
              <p className="text-gray-600">Your intelligent guide to academic success</p>
            </div>
          </div>
        </div>

        {/* Main Chat Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    <div
                      className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
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
                            <span className="text-xs font-medium text-purple-600">AI Advisor</span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                        <p
                          className={`text-xs mt-2 ${
                            msg.type === "user" ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>

                    {/* Follow-up Suggestions */}
                    {msg.type === "ai" && msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                      <div className="flex justify-start mt-3">
                        <div className="max-w-[80%] space-y-2">
                          <p className="text-xs text-gray-500 px-2">Suggested follow-ups:</p>
                          <div className="flex flex-wrap gap-2">
                            {msg.followUpSuggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleFollowUpClick(suggestion)}
                                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs rounded-lg border border-purple-200 transition-all cursor-pointer"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-5 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600">AI Advisor</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                        <span className="text-sm text-gray-500">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-scroll anchor */}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask me anything about your courses, requirements, or academic planning..."
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300"
                  />
                  <button
                    onClick={handleSend}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Student Context */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                Your Profile
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Student</span>
                  <span className="text-sm font-medium text-gray-900">{studentContext.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Major</span>
                  <span className="text-sm font-medium text-gray-900">{studentContext.major}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    GPA
                  </span>
                  <span className="text-sm font-medium text-green-600">{studentContext.gpa}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <BookMarked className="w-3.5 h-3.5" />
                    Credits
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {studentContext.creditsEarned} / 120
                  </span>
                </div>
                <div className="pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${(studentContext.creditsEarned / 120) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {Math.round((studentContext.creditsEarned / 120) * 100)}% Complete
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Questions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-gray-900 font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Suggested Questions
              </h3>
              <div className="space-y-3">
                {suggestedQuestions.map((q, index) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(q.text)}
                      className="w-full p-3 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 rounded-lg transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-purple-600 font-medium mb-1">{q.category}</p>
                          <p className="text-sm text-gray-900 group-hover:text-purple-900 transition-colors">
                            {q.text}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-sm p-6 text-white">
              <h3 className="font-semibold mb-4">What I Can Help With</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-200">•</span>
                  <span>Course recommendations and planning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-200">•</span>
                  <span>Degree requirements and progress tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-200">•</span>
                  <span>Prerequisite and scheduling guidance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-200">•</span>
                  <span>Academic performance insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-200">•</span>
                  <span>Registration tips and strategies</span>
                </li>
              </ul>
            </div>

            {/* Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">AI Advisor Online</p>
                  <p className="text-xs text-gray-500">Average response time: &lt;2s</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
