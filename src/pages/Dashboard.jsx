import { Navigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions.js";
import StudentDashboard from "./StudentDashboard.jsx";
import MentorDashboard from "./MentorDashboard.jsx";
import InstructorDashboard from "./InstructorDashboard.jsx";
import ContentReviewerDashboard from "./ContentReviewerDashboard.jsx";

/** Routes `/dashboard` to the right dashboard for the signed-in role — mirrors how
 *  staff already get their own dashboard at `/admin`. */
export default function Dashboard() {
  const { isStaff, can } = usePermissions();

  if (isStaff) {
    return <Navigate to="/admin" replace />;
  }

  // Precedence order:
  // 1. Content Reviewer (can approve courses, but does not author courses) -> ContentReviewerDashboard
  // 2. Instructor / Author (can create courses) -> InstructorDashboard
  // 3. Mentor (can claim mentorship tickets) -> MentorDashboard
  // 4. Student / Learner -> StudentDashboard
  if (can("courses", "approve") && !can("courses", "create")) {
    return <ContentReviewerDashboard />;
  }
  if (can("courses", "create")) return <InstructorDashboard />;
  if (can("mentorship", "claim")) return <MentorDashboard />;
  return <StudentDashboard />;
}
