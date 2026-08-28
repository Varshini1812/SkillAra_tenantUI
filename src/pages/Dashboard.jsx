import { Navigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions.js";
import StudentDashboard from "./StudentDashboard.jsx";
import MentorDashboard from "./MentorDashboard.jsx";
import InstructorDashboard from "./InstructorDashboard.jsx";

/** Routes `/dashboard` to the right dashboard for the signed-in role — mirrors how
 *  staff already get their own dashboard at `/admin`. */
export default function Dashboard() {
  const { isStaff, can } = usePermissions();

  if (isStaff) {
    return <Navigate to="/admin" replace />;
  }

  // Keyed on capability, not on the role bucket: Instructor, Mentor, Content Reviewer,
  // Support and Teaching Assistant all report TUTOR but need very different landing pages.
  if (can("courses", "create")) return <InstructorDashboard />;
  if (can("mentorship", "claim")) return <MentorDashboard />;
  return <StudentDashboard />;
}
