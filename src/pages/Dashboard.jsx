import { Navigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions.js";
import StudentDashboard from "./StudentDashboard.jsx";
import MentorDashboard from "./MentorDashboard.jsx";

/** Routes `/dashboard` to the right dashboard for the signed-in role — mirrors how
 *  staff already get their own dashboard at `/admin`. */
export default function Dashboard() {
  const { isInstructor, isStaff } = usePermissions();
  
  if (isStaff) {
    return <Navigate to="/admin" replace />;
  }
  
  return isInstructor ? <MentorDashboard /> : <StudentDashboard />;
}
