import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import TenantGate from "./components/TenantGate.jsx";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import FindWorkspace from "./pages/FindWorkspace.jsx";
import TenantLogin from "./pages/TenantLogin.jsx";
import Register from "./pages/Register.jsx";
import Courses from "./pages/Courses.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import Learn from "./pages/Learn.jsx";
import MyLearning from "./pages/MyLearning.jsx";
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
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="learn/:courseId" element={<Learn />} />
        <Route path="my-learning" element={<MyLearning />} />
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
      <TenantGate>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TenantGate>
    </AuthProvider>
  );
}
