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

// Get student context from localStorage and mock data
export const getStudentContext = (): StudentContext => {
  const username = localStorage.getItem("username") || "Student";

  return {
    username,
    gpa: 3.85,
    creditsEarned: 76,
    enrolledCourses: 4,
    major: "Computer Science",
    completedCourses: [
      "CS 101 - Introduction to Computer Science",
      "CS 102 - Programming Fundamentals",
      "CS 201 - Data Structures",
      "MATH 201 - Calculus I",
      "MATH 202 - Calculus II",
      "ENG 101 - English Composition",
    ],
    currentCourses: [
      "CS 301 - Database Systems",
      "CS 201 - Data Structures",
      "MATH 301 - Linear Algebra",
      "PHYS 201 - General Physics I",
    ],
    semester: "Spring 2026",
  };
};

// Analyze user question to determine topic and intent
export const analyzeQuestion = (question: string): {
  topic: string;
  intent: string;
  keywords: string[];
} => {
  const lowerQuestion = question.toLowerCase();
  const keywords: string[] = [];

  // Extract keywords
  const topicKeywords = {
    course: ["course", "class", "subject", "elective"],
    gpa: ["gpa", "grade", "grading", "score", "average"],
    schedule: ["schedule", "time", "timetable", "calendar", "conflict"],
    prerequisite: ["prerequisite", "prereq", "requirement", "required", "need"],
    degree: ["degree", "major", "graduation", "graduate", "requirements"],
    waitlist: ["waitlist", "wait list", "queue", "full"],
    registration: ["register", "registration", "enroll", "add", "drop"],
    instructor: ["instructor", "professor", "teacher", "prof"],
    career: ["career", "job", "internship", "industry"],
    credits: ["credit", "credits", "units"],
  };

  let detectedTopic = "general";
  for (const [topic, words] of Object.entries(topicKeywords)) {
    for (const word of words) {
      if (lowerQuestion.includes(word)) {
        detectedTopic = topic;
        keywords.push(word);
      }
    }
  }

  // Determine intent
  let intent = "information";
  if (lowerQuestion.includes("how") || lowerQuestion.includes("what")) {
    intent = "explanation";
  } else if (lowerQuestion.includes("should") || lowerQuestion.includes("recommend")) {
    intent = "recommendation";
  } else if (lowerQuestion.includes("can i") || lowerQuestion.includes("am i")) {
    intent = "eligibility";
  }

  return { topic: detectedTopic, intent, keywords };
};

// Generate intelligent AI response based on question analysis and student context
export const generateAIResponse = (
  question: string,
  context: StudentContext
): { response: string; followUpSuggestions: string[] } => {
  const analysis = analyzeQuestion(question);
  const lowerQuestion = question.toLowerCase();

  // Course recommendations
  if (analysis.topic === "course" && analysis.intent === "recommendation") {
    return {
      response: `Based on your ${context.major} major and current progress (${context.creditsEarned} credits earned), I recommend considering these courses for next semester:\n\n**Core CS Courses:**\n• CS 350 - Software Engineering (builds on CS 201)\n• CS 320 - Algorithms (prerequisite: CS 201 ✓)\n• CS 340 - Operating Systems\n\n**Electives:**\n• CS 410 - Machine Learning (trending and valuable for careers)\n• CS 380 - Web Development\n\nYou've already completed CS 201 (Data Structures), which opens up these advanced courses. With your ${context.gpa} GPA, you're well-positioned for any of these!`,
      followUpSuggestions: [
        "What are the prerequisites for CS 350?",
        "Tell me more about Machine Learning course",
        "Which course is best for software engineering careers?",
      ],
    };
  }

  // GPA and grades
  if (analysis.topic === "gpa" || lowerQuestion.includes("improve") && lowerQuestion.includes("gpa")) {
    return {
      response: `Great question! Your current GPA is ${context.gpa}, which is excellent! Here are some strategies to maintain or improve it:\n\n**Study Strategies:**\n1. **Office Hours** - Visit professors during office hours for personalized help\n2. **Study Groups** - Collaborate with classmates for better understanding\n3. **Time Management** - Allocate 2-3 hours of study per credit hour\n\n**Academic Resources:**\n• Tutoring Center (free peer tutoring)\n• Writing Center (for essay courses)\n• Academic Success Workshops\n\n**Course Load:** With ${context.enrolledCourses} courses this semester, ensure you're balancing challenging and moderate courses. Consider your current workload in CS 301 and MATH 301.`,
      followUpSuggestions: [
        "How do I find study groups?",
        "What GPA do I need for honors?",
        "Should I take fewer courses next semester?",
      ],
    };
  }

  // Prerequisites
  if (analysis.topic === "prerequisite") {
    const courseMatch = question.match(/CS\s*\d+|MATH\s*\d+|ENG\s*\d+/i);
    const courseName = courseMatch ? courseMatch[0].toUpperCase() : "that course";

    return {
      response: `Let me check the prerequisites for ${courseName}:\n\n**${courseName} Prerequisites:**\n• CS 201 - Data Structures ✓ (You've completed this!)\n• MATH 201 - Calculus I ✓ (Completed)\n• Minimum 60 credits earned ✓ (You have ${context.creditsEarned})\n\n**You are eligible to register!** Based on your completed courses, you meet all the requirements.\n\n**Recommended preparation:**\n• Review data structures concepts (arrays, linked lists, trees)\n• Refresh your calculus if it's been a while\n• Check if there's a recommended textbook to preview`,
      followUpSuggestions: [
        "When does registration open for next semester?",
        "Who teaches this course?",
        "What if the course is full?",
      ],
    };
  }

  // Degree requirements and graduation
  if (analysis.topic === "degree" || lowerQuestion.includes("graduate") || lowerQuestion.includes("graduation")) {
    const creditsRemaining = 120 - context.creditsEarned;
    const semestersRemaining = Math.ceil(creditsRemaining / 15);

    return {
      response: `Let's review your progress toward your ${context.major} degree:\n\n**Degree Progress:**\n• Credits Earned: ${context.creditsEarned} / 120 (${Math.round((context.creditsEarned / 120) * 100)}% complete)\n• Credits Remaining: ${creditsRemaining}\n• Estimated Semesters: ${semestersRemaining} more semesters at 15 credits/semester\n\n**Outstanding Requirements:**\n• Core CS courses: 6 more courses\n• CS Electives: 3 courses (choose from 400-level)\n• General Education: 2 courses remaining\n• Capstone Project: CS 499 (final semester)\n\n**On Track for:** ${semestersRemaining <= 2 ? "Spring 2027 graduation!" : "Graduation in " + semestersRemaining + " semesters"}\n\nYour ${context.gpa} GPA qualifies you for honors graduation (requires 3.5+)!`,
      followUpSuggestions: [
        "What CS electives should I take?",
        "Tell me about the capstone project",
        "How do I apply for honors graduation?",
      ],
    };
  }

  // Schedule and time conflicts
  if (analysis.topic === "schedule") {
    return {
      response: `I can help you with schedule planning! Currently enrolled in ${context.enrolledCourses} courses:\n\n**Current Schedule (${context.semester}):**\n• CS 201 - Data Structures (MWF 2:00-3:00 PM)\n• CS 301 - Database Systems (TTh 4:00-5:30 PM)\n• MATH 301 - Linear Algebra (MWF 11:00-12:00 PM)\n• PHYS 201 - General Physics I (MWF 1:00-2:30 PM)\n\n**Schedule Tips:**\n✓ No time conflicts detected\n✓ Good balance of M/W/F and T/Th classes\n⚠️ Back-to-back classes MWF 1-3 PM - consider breaks for study time\n\n**Recommendations:**\n• Try to have at least one hour between classes for studying\n• Balance difficult courses across different days\n• Consider morning vs. afternoon preference`,
      followUpSuggestions: [
        "Can I see available courses for next semester?",
        "What time do most CS courses meet?",
        "How do I avoid schedule conflicts?",
      ],
    };
  }

  // Waitlist guidance
  if (analysis.topic === "waitlist") {
    return {
      response: `Here's everything you need to know about waitlists:\n\n**How Waitlists Work:**\n1. Join the waitlist when a course is full\n2. You'll get automatic notification if a spot opens\n3. You have 24 hours to accept the spot\n4. Spots are offered in queue order (first come, first served)\n\n**Your Waitlist Position Matters:**\n• Positions 1-3: High chance (usually get in)\n• Positions 4-7: Moderate chance\n• Positions 8+: Lower chance, have backup plan\n\n**Pro Tips:**\n• Attend the first class even if waitlisted - professors sometimes add students\n• Have an alternate course ready\n• Check waitlist status daily\n• Email the professor to express interest\n\n**Current Waitlist Status:** Check your Waitlist page to see your positions!`,
      followUpSuggestions: [
        "What courses am I waitlisted for?",
        "Can the professor override the waitlist?",
        "What are alternative courses to take?",
      ],
    };
  }

  // Registration help
  if (analysis.topic === "registration") {
    return {
      response: `I'll help you with course registration! Here's what you need to know:\n\n**Registration Timeline:**\n• Registration Opens: April 15, 2026\n• Add/Drop Deadline: May 1, 2026\n• Late Registration Fee: After May 5, 2026\n\n**Your Registration Time:** Based on ${context.creditsEarned} credits, you're a Junior with priority registration.\n\n**How to Register:**\n1. Review course catalog and plan your schedule\n2. Check prerequisites (I can help verify!)\n3. Use the Registration page on your dashboard\n4. Add courses to your cart\n5. Submit registration before deadline\n\n**Important Reminders:**\n• You can register for 12-18 credits without approval\n• Over 18 credits requires dean approval\n• Make sure you meet all prerequisites\n• Have backup courses in case primary choices are full`,
      followUpSuggestions: [
        "What courses should I register for?",
        "How do I check if I meet prerequisites?",
        "What happens if a course is full?",
      ],
    };
  }

  // Instructor information
  if (analysis.topic === "instructor") {
    return {
      response: `Let me help you learn about instructors:\n\n**Popular CS Instructors:**\n• **Dr. Sarah Mitchell** - CS 101, known for clear lectures and helpful office hours\n• **Prof. James Anderson** - CS 201, challenging but excellent for learning data structures\n• **Dr. Robert Martinez** - CS 301, industry experience, practical approach\n\n**How to Choose:**\n1. Check Rate My Professor reviews\n2. Talk to students who've taken the course\n3. Attend the first class if possible\n4. Consider teaching style (lecture vs. hands-on)\n\n**Office Hours:** All instructors hold weekly office hours - great resource for help!\n\n**Tip:** The "best" instructor depends on your learning style. Some students prefer structured lectures, others like interactive sessions.`,
      followUpSuggestions: [
        "Who teaches CS 350?",
        "What's the teaching style of Dr. Martinez?",
        "How do I find office hours?",
      ],
    };
  }

  // Career and pathways
  if (analysis.topic === "career") {
    return {
      response: `Great that you're thinking about your career! As a ${context.major} major with a ${context.gpa} GPA, you have excellent prospects.\n\n**Career Paths in CS:**\n\n**Software Engineering** (Most popular)\n• Companies: Google, Microsoft, Amazon, Meta\n• Recommended courses: CS 350, CS 380, CS 410\n• Skills: Algorithms, system design, coding interviews\n\n**Data Science / AI**\n• Growing field with high demand\n• Recommended: CS 410 (ML), MATH 350 (Statistics)\n• Skills: Python, machine learning, data analysis\n\n**Cybersecurity**\n• High demand, excellent salaries\n• Courses: CS 430 (Security), CS 440 (Networks)\n\n**Next Steps:**\n1. Build projects for your portfolio\n2. Apply for internships (summer 2026)\n3. Join CS clubs and hackathons\n4. Network at career fairs\n\n**Career Services:** Visit the Career Center for resume reviews and interview prep!`,
      followUpSuggestions: [
        "How do I prepare for coding interviews?",
        "When is the next career fair?",
        "What internships should I apply for?",
      ],
    };
  }

  // Credits and course load
  if (analysis.topic === "credits") {
    return {
      response: `Let's discuss your credit situation:\n\n**Current Status:**\n• Credits Earned: ${context.creditsEarned} / 120\n• Currently Enrolled: ${context.enrolledCourses} courses (~12-15 credits)\n• Remaining: ${120 - context.creditsEarned} credits to graduate\n\n**Credit Guidelines:**\n• **12-15 credits:** Full-time, typical load\n• **16-18 credits:** Heavy load, manageable with good GPA\n• **Over 18:** Requires dean approval\n• **Under 12:** Part-time status (affects financial aid)\n\n**Recommendations for You:**\nWith your ${context.gpa} GPA, you can handle 15-16 credits comfortably. Consider:\n• 4-5 courses per semester\n• Mix difficult and moderate courses\n• Balance CS courses with electives\n\n**Transfer Credits:** If you have AP/transfer credits, make sure they're applied to your degree audit.`,
      followUpSuggestions: [
        "How many credits should I take next semester?",
        "Can I transfer credits from another college?",
        "What's the minimum for financial aid?",
      ],
    };
  }

  // Default intelligent response for general questions
  return {
    response: `I'm here to help with your academic journey at CUNY! You asked: "${question}"\n\nAs your AI Academic Advisor, I can assist with:\n\n**📚 Academic Planning**\n• Course recommendations based on your progress\n• Degree requirement guidance\n• Schedule optimization\n\n**🎯 Registration Support**\n• Prerequisite verification\n• Waitlist strategies\n• Registration timeline\n\n**📈 Academic Success**\n• GPA improvement strategies\n• Study resources\n• Career pathway guidance\n\n**Your Current Status:**\n• Major: ${context.major}\n• GPA: ${context.gpa}\n• Credits: ${context.creditsEarned} / 120\n• Current Courses: ${context.enrolledCourses}\n\nCould you rephrase your question or ask about one of the topics above? I'm designed to provide personalized, context-aware advice!`,
    followUpSuggestions: [
      "What courses should I take next semester?",
      "How can I improve my GPA?",
      "Am I on track to graduate on time?",
      "Tell me about career options in CS",
    ],
  };
};

// Simulate API call with delay (for future backend integration)
export const callAIAPI = async (
  message: string,
  context: StudentContext
): Promise<{ response: string; followUpSuggestions: string[] }> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1500));

  // In production, this would call your Flask API with Gemini/RAG
  // const response = await fetch('/api/ai-advisor', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ message, context })
  // });
  // return await response.json();

  // For now, use local intelligent response generation
  return generateAIResponse(message, context);
};
