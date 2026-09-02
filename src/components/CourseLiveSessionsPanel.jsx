import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCourseLiveSessions, joinLiveSession } from "../api/liveSessions.js";
import { getErrorMessage } from "../api/client.js";
import Icon from "../admin/components/ui/Icon.jsx";

/** Student-facing list of a course's live classes, with an enrollment-gated join. */
export default function CourseLiveSessionsPanel({ courseId }) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetchCourseLiveSessions(courseId)
      .then((all) => setSessions(all.filter((s) => s.status === "SCHEDULED" || s.status === "LIVE")))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  const join = async (id, title) => {
    setError("");
    try {
      const data = await joinLiveSession(id);
      navigate(`/call/${data.session.meeting.roomId}`, {
        state: {
          jitsiFallbackUrl: data.session.meeting.jitsiFallbackUrl,
          title,
          returnTo: `/learn/${courseId}`,
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading || sessions.length === 0) return null;

  return (
    <div className="rounded-surface border border-line bg-surface p-4">
      <h2 className="font-semibold">Live sessions</h2>
      {error && <div className="mt-2 rounded-control bg-danger-subtle p-2 text-sm text-danger">{error}</div>}
      <ul className="mt-3 space-y-2">
        {sessions.map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded-control border border-line p-3">
            <div>
              <p className="text-sm font-medium text-ink">{s.title}</p>
              <p className="text-xs text-ink-subtle">
                {new Date(s.scheduledStart).toLocaleString()}
                {s.status === "LIVE" && <span className="ml-2 font-semibold text-success"><Icon name="circleDot" size={12} /> Live now</span>}
              </p>
            </div>
            <button
              type="button"
              onClick={() => join(s.id, s.title)}
              className="rounded-control bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success"
            >
              Join
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
