import { useNavigate, useParams, useLocation } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import VideoCall from "../components/VideoCall.jsx";

function CallRoomContent() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const returnTo = location.state?.returnTo || "/mock-interviews";

  return (
    <div className="h-[calc(100vh-8rem)]">
      <VideoCall
        roomId={roomId}
        jitsiFallbackUrl={location.state?.jitsiFallbackUrl}
        title={location.state?.title}
        onLeave={() => navigate(returnTo)}
      />
    </div>
  );
}

export default function CallRoom() {
  return (
    <ProtectedRoute>
      <CallRoomContent />
    </ProtectedRoute>
  );
}
