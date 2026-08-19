import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { AdminAuthProvider } from "./admin/context/AdminAuthContext.jsx";
import { ToastProvider } from "./admin/components/ui/Toast.jsx";
import TenantGate from "./components/TenantGate.jsx";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import FindWorkspace from "./pages/FindWorkspace.jsx";
import TenantLogin from "./pages/TenantLogin.jsx";
import Register from "./pages/Register.jsx";
import SignUp from "./pages/SignUp.jsx";
import Courses from "./pages/Courses.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import Learn from "./pages/Learn.jsx";
import MyLearning from "./pages/MyLearning.jsx";
import Profile from "./pages/Profile.jsx";
import MyCourses from "./pages/instructor/MyCourses.jsx";
import CourseEditor from "./pages/instructor/CourseEditor.jsx";
import Sessions from "./pages/Sessions.jsx";
import Mentors from "./pages/Mentors.jsx";
import Forum from "./pages/Forum.jsx";
import ForumQuestion from "./pages/ForumQuestion.jsx";
import CallRoom from "./pages/CallRoom.jsx";
import AdminLayout from "./admin/components/AdminLayout.jsx";
import AdminProtectedRoute from "./admin/components/AdminProtectedRoute.jsx";
import AdminDashboard from "./admin/pages/Dashboard.jsx";
import UserManagement from "./admin/pages/UserManagement.jsx";
import TenantRolesPermissions from "./admin/pages/TenantRolesPermissions.jsx";
import MasterDataManagement from "./admin/pages/MasterDataManagement.jsx";
import CourseModeration from "./admin/pages/CourseModeration.jsx";
import CommunityMonitoring from "./admin/pages/CommunityMonitoring.jsx";
import OwnerProfile from "./admin/pages/OwnerProfile.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { isRootApp } from "./utils/tenant.js";

function RootRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<FindWorkspace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function TenantRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<TenantLogin />} />
      <Route path="/register" element={<Register />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route
        element={
          <AdminProtectedRoute
            roles={["tenant_admin", "TENANT_ADMIN", "ORG_ADMIN"]}
          >
            <AdminLayout />
          </AdminProtectedRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/courses" element={<CourseModeration />} />
        <Route path="/admin/monitoring" element={<CommunityMonitoring />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route
          path="/admin/users/new"
          element={<Navigate to="/admin/users?panel=create" replace />}
        />
        <Route path="/admin/roles" element={<TenantRolesPermissions />} />
        <Route path="/admin/master-data" element={<MasterDataManagement />} />
        <Route path="/admin/profile" element={<OwnerProfile />} />
      </Route>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="learn/:courseId" element={<Learn />} />
        <Route path="my-learning" element={<MyLearning />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="mentors" element={<Mentors />} />
        <Route path="forum" element={<Forum />} />
        <Route path="forum/:id" element={<ForumQuestion />} />
        <Route path="call/:roomId" element={<CallRoom />} />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="teach"
          element={
            <ProtectedRoute roles={["TUTOR", "TENANT_ADMIN", "ORG_ADMIN"]}>
              <MyCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="teach/:id"
          element={
            <ProtectedRoute roles={["TUTOR", "TENANT_ADMIN", "ORG_ADMIN"]}>
              <CourseEditor />
            </ProtectedRoute>
          }
        />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function AppRoutes() {
  return isRootApp() ? <RootRoutes /> : <TenantRoutes />;
}

export default function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <ToastProvider>
          <TenantGate>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TenantGate>
        </ToastProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}
