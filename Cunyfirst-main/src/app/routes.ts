import { createBrowserRouter } from "react-router";
import { Login } from "./components/Login";
import { CreateAccount } from "./components/CreateAccount";
import { PendingApproval } from "./components/PendingApproval";
import { StudentDashboard } from "./components/StudentDashboard";
import { CourseRegistration } from "./components/CourseRegistration";
import { MySchedule } from "./components/MySchedule";
import { Waitlist } from "./components/Waitlist";
import { AIAdvisor } from "./components/AIAdvisor";
import { RegistrarDashboard } from "./components/AdminPanel";
import { InstructorDashboard } from "./components/InstructorDashboard";
import { GuestDashboard } from "./components/GuestDashboard";
import { Profile } from "./components/Profile";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/create-account",
    Component: CreateAccount,
  },
  {
    path: "/pending-approval",
    Component: PendingApproval,
  },
  {
    path: "/student",
    Component: Layout,
    children: [
      { index: true, Component: StudentDashboard },
      { path: "register", Component: CourseRegistration },
      { path: "schedule", Component: MySchedule },
      { path: "waitlist", Component: Waitlist },
      { path: "ai-advisor", Component: AIAdvisor },
      { path: "profile", Component: Profile },
    ],
  },
  {
    path: "/instructor",
    Component: Layout,
    children: [
      { index: true, Component: InstructorDashboard },
      { path: "profile", Component: Profile },
    ],
  },
  {
    path: "/registrar",
    Component: Layout,
    children: [
      { index: true, Component: RegistrarDashboard },
      { path: "profile", Component: Profile },
    ],
  },
  {
    path: "/guest-student",
    Component: Layout,
    children: [
      { index: true, Component: GuestDashboard },
    ],
  },
  {
    path: "/guest-instructor",
    Component: Layout,
    children: [
      { index: true, Component: GuestDashboard },
    ],
  },
  {
    path: "/guest-registrar",
    Component: Layout,
    children: [
      { index: true, Component: GuestDashboard },
    ],
  },
]);