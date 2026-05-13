# CUNYfirst Course Registration System - Complete Code Reference

## 🎯 **Project Overview**
A modern, full-stack university course registration system with multi-role support (Students, Instructors, Registrars, Guests) featuring AI-powered academic advising.

## 🛠️ **Tech Stack**
- **Frontend**: React + TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Notifications**: Sonner (toast)
- **Icons**: Lucide React

---

## 📁 **Project Structure**

```
src/app/
├── App.tsx                      # Main app component
├── routes.ts                    # Route configuration
├── utils/
│   ├── auth.ts                  # Authentication utilities
│   └── aiAdvisor.ts             # AI response generation (NEW!)
└── components/
    ├── Login.tsx                # Login page with guest access
    ├── CreateAccount.tsx        # Multi-role account creation
    ├── PendingApproval.tsx      # Instructor approval status
    ├── Layout.tsx               # Sidebar layout wrapper
    ├── StudentDashboard.tsx     # Student main dashboard
    ├── CourseRegistration.tsx   # Course search & registration
    ├── MySchedule.tsx           # Visual schedule view
    ├── Waitlist.tsx             # Waitlist management
    ├── AIAdvisor.tsx            # AI chatbot advisor (NEW!)
    ├── InstructorDashboard.tsx  # Instructor portal
    ├── AdminPanel.tsx           # Registrar admin panel
    ├── GuestDashboard.tsx       # Guest mode landing
    └── Profile.tsx              # User profile & settings
```

---

## 🔑 **Key Features**

### **1. Multi-Role Authentication**
- Student accounts - full registration access
- Instructor accounts - requires admin approval
- Registrar/Admin accounts - manual creation only
- Guest accounts - view-only demo access

### **2. Course Registration System**
- Real-time seat availability
- Course search and filtering
- Add/Drop courses with confirmation
- Waitlist management with queue positions
- Schedule conflict detection

### **3. AI Academic Advisor** 🤖
- Intelligent course recommendations
- Degree progress tracking
- Prerequisite verification
- GPA improvement suggestions
- Natural language chat interface

### **4. Instructor Portal**
- Course roster management
- Grade submission interface
- Student attendance tracking
- Announcements system

### **5. Registrar/Admin Dashboard**
- Course management (CRUD operations)
- Student account management
- Instructor access request approvals
- System settings configuration

---

## 🎨 **Design System**

### **Color Palette**
- **Primary**: Blue (#3B82F6) - Main actions, student theme
- **Secondary**: Indigo (#6366F1) - Accents
- **Success**: Green (#10B981) - Confirmations
- **Warning**: Orange (#F59E0B) - Waitlist, alerts
- **Danger**: Red (#EF4444) - Drops, errors
- **Info**: Purple (#A855F7) - AI Advisor, admin

### **Typography**
- Headers: Inter font (system default)
- Body: Inter font
- Monospace: Code snippets (demo credentials)

### **Spacing System**
- Base unit: 4px (0.25rem)
- Standard gaps: 4, 6, 8 (1rem, 1.5rem, 2rem)
- Card padding: p-6 (1.5rem)

---

## 🚀 **Getting Started**

### **Demo Credentials**
```
Student:     username: student    password: (any)
Instructor:  username: instructor password: (any)
Registrar:   username: registrar  password: (any)
```

### **Guest Access**
Click "Continue as Guest" and select:
- Student Portal (view courses, schedules)
- Instructor Portal (view rosters, grading)
- Registrar Portal (view admin tools)

---

## 📊 **Component Breakdown**

### **App.tsx** (12 lines)
- Router provider setup
- Toast notification provider
- Global app wrapper

### **routes.ts** (78 lines)
- 7 main routes (/, /create-account, /pending-approval, /student, /instructor, /registrar, guest routes)
- Nested routing for student portal (register, schedule, waitlist, ai-advisor, profile)
- Layout wrapper for authenticated routes

### **Login.tsx** (177 lines)
- Username/password authentication
- Role-based routing (student/instructor/registrar detection)
- Guest mode selection modal
- LocalStorage for username persistence

### **CreateAccount.tsx** (436 lines)
- Three account types: Student, Guest, Instructor Request
- Dynamic form fields based on account type
- Form validation (email, password, student ID, university email)
- Security controls (no self-service admin accounts)

### **PendingApproval.tsx** (Instructor Request Status)
- Status display for pending instructor requests
- Timeline of approval process
- Contact information for support
- Return to login or explore as guest

### **Layout.tsx** (155 lines)
- Responsive sidebar navigation
- Role-based navigation items
- Guest mode badge
- Active route highlighting
- Profile & logout buttons

### **StudentDashboard.tsx** (209 lines)
- 5 quick action cards (Register, Schedule, Waitlist, AI Advisor, Profile)
- Academic stats (GPA, Credits, Enrolled Courses)
- Today's schedule with class details
- Important dates calendar
- Personalized greeting with username

### **AIAdvisor.tsx** (NEW - 280+ lines)
- Intelligent chat interface with natural language processing
- Context-aware AI responses using student data (GPA, credits, courses)
- 10+ topic categories (courses, GPA, schedule, prerequisites, degree, waitlist, etc.)
- Follow-up suggestion buttons (clickable)
- Typing indicator with loading animation
- Auto-scroll to newest messages
- Student profile sidebar (GPA, credits, major, progress bar)
- Suggested question prompts
- Enter key support for message sending
- Error handling for empty prompts
- Backend-ready architecture (Flask API integration prepared)

### **utils/aiAdvisor.ts** (NEW - 260+ lines)
**Purpose:** Intelligent AI response generation engine for academic advising

**Interfaces:**
- `StudentContext` - Student profile data (GPA, credits, major, courses, semester)
- `AIMessage` - Message structure with optional follow-up suggestions

**Key Functions:**
- `getStudentContext()` - Retrieves student data from localStorage + mock academic data
- `analyzeQuestion(question)` - NLP-style topic and intent detection
  - Topics: course, gpa, schedule, prerequisite, degree, waitlist, registration, instructor, career, credits
  - Intents: information, explanation, recommendation, eligibility
  - Returns: { topic, intent, keywords[] }
- `generateAIResponse(question, context)` - Main intelligence engine
  - **Course Recommendations:** Based on major, completed courses, prerequisites
  - **GPA Advice:** Study strategies, tutoring resources, course load balancing
  - **Prerequisites:** Verification with eligibility checking (✓ or ✗)
  - **Degree Progress:** Credits calculation, graduation timeline, requirements
  - **Schedule Analysis:** Time conflict detection, course distribution tips
  - **Waitlist Guidance:** Queue position strategies, acceptance tips
  - **Registration Help:** Timeline, credit limits, approval requirements
  - **Instructor Info:** Teaching styles, office hours, student reviews
  - **Career Pathways:** Software engineering, data science, cybersecurity tracks
  - **Credit Planning:** Course load recommendations, financial aid thresholds
  - **Default Response:** Helpful fallback with capability showcase
- `callAIAPI(message, context)` - Async wrapper for backend integration
  - Simulates 1-2.5s network delay for realistic typing effect
  - Contains commented Flask API integration template
  - Returns: { response, followUpSuggestions[] }

**Response Format:**
- Personalized with student's name, GPA, credits, courses
- Markdown formatting (bold, bullet points, sections)
- 3 follow-up question suggestions per response
- Context-aware (uses student's actual completed courses)
- Professional academic advisor tone

**Backend Integration (Prepared):**
```typescript
// Future API call structure (currently commented out):
// const response = await fetch('/api/ai-advisor', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({ message, context })
// });
// Will integrate with: Flask backend + Gemini API + RAG retrieval
```

### **CourseRegistration.tsx**
- Course search with filters
- Real-time seat availability
- Register/Drop/Waitlist actions
- Sortable course table
- Toast notifications for actions

### **GuestDashboard.tsx** (184 lines)
- Role-specific feature cards
- "Explore" buttons with toast feedback
- System features showcase
- Getting started guide
- Create Account CTA

---

## 🔐 **Security Features**

1. **Role-Based Access Control**
   - Students: Course registration, schedules
   - Instructors: Rosters, grades (requires approval)
   - Registrars: Full admin access
   - Guests: View-only mode

2. **Instructor Account Approval Workflow**
   - Request form with employee verification
   - University email validation (@cuny.edu)
   - Admin approval required
   - Pending status page

3. **Input Validation**
   - Email format checking
   - Password strength (min 8 characters)
   - Student ID validation
   - University email domain verification

---

## ✨ **UX Enhancements**

### **Hover Effects**
- All clickable elements have cursor-pointer
- Cards lift on hover (transform: translateY(-4px))
- Buttons scale subtly (scale: 1.02)
- Icons animate (scale: 1.1)
- Smooth transitions (duration-300)

### **Animations**
- Page transitions: fade-in
- Modal entrance: zoom-in + fade-in
- Card hover: lift + shadow increase
- Button hover: scale + shadow increase
- Navigation active state: background color

### **Feedback**
- Toast notifications for all actions
- Loading states for async operations
- Success/Error messages
- Inline form validation
- Disabled states for unavailable actions

---

## 📱 **Responsive Design**

### **Breakpoints**
- Mobile: < 768px (single column)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (3-5 columns)

### **Grid Layouts**
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-5
- Course table: Overflow-x-auto on mobile
- Sidebar: Fixed width on desktop, drawer on mobile (future)

---

## 🎯 **Future Enhancements**

1. **Backend Integration**
   - Database persistence (PostgreSQL/MySQL)
   - REST API or GraphQL
   - Real user authentication (JWT/OAuth)
   - Email notifications
   - **AI Advisor Backend:** Flask API + Google Gemini + RAG-based retrieval
     - Replace `callAIAPI()` mock with real API endpoint
     - Course catalog vectorization for semantic search
     - Student data retrieval from database
     - Conversation history persistence

2. **Advanced Features**
   - **AI Advisor Enhancements:**
     - Multi-turn conversation memory
     - Course recommendation ML model
     - Personalized study plan generation
     - Integration with course catalog and instructor data
   - Payment integration for tuition
   - Document uploads (transcripts, IDs)
   - Real-time notifications (WebSocket)

3. **Mobile App**
   - React Native version
   - Push notifications
   - Offline mode support

---

## 📄 **License**
Educational project for Software Engineering course demonstration.

---

## 👥 **Credits**
Built with Claude Code (Anthropic)
UI Components: shadcn/ui
Icons: Lucide React
Styling: Tailwind CSS v4

---

## 📞 **Support**
For demo purposes and course project presentation.

Last Updated: May 10, 2026
