import { useCallback, useEffect, useRef, useState } from "react";

import { getLessonPlaybackUrl } from "../api/courses.js";
import { getErrorMessage } from "../api/client.js";
import Icon from "../admin/components/ui/Icon.jsx";

/**
 * Renders lesson media from Backblaze B2.
 *
 * The bucket is private, so nothing is embedded directly: the component asks the API
 * for a short-lived signed URL, and re-requests one shortly before it expires so a
 * long video does not die mid-playback. The API re-checks enrollment on every call.
 */
export default function LessonPlayer({ lesson }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const refreshTimer = useRef(null);

  const isVideo = lesson?.mimeType?.startsWith("video/") || lesson?.type === "VIDEO";
  const isAudio = lesson?.mimeType?.startsWith("audio/");
  const isPdf = lesson?.mimeType === "application/pdf" || lesson?.type === "PDF";

  const loadUrl = useCallback(async () => {
    if (!lesson?.id || !lesson.hasContent) return;

    setLoading(true);
    setError("");
    try {
      const data = await getLessonPlaybackUrl(lesson.id);
      setUrl(data.url);

      // Re-sign a minute before expiry so playback continues uninterrupted.
      const refreshInMs = Math.max(30, (data.expiresIn || 900) - 60) * 1000;
      clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(loadUrl, refreshInMs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [lesson?.id, lesson?.hasContent]);

  useEffect(() => {
    setUrl("");
    setError("");
    loadUrl();
    return () => clearTimeout(refreshTimer.current);
  }, [loadUrl]);

  if (!lesson?.hasContent) return null;

  if (lesson.locked) {
    return (
      <div className="mt-4 rounded-control border border-line bg-surface-sunken p-6 text-center text-sm text-ink-subtle"><Icon name="lock" size={15} /> Enroll in this course to watch this lesson.
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 rounded-control bg-danger-subtle p-3 text-sm text-danger">
        {error}
        <button
          type="button"
          onClick={loadUrl}
          className="ml-2 font-medium underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading && !url) {
    return (
      <div className="mt-4 aspect-video animate-pulse rounded-control bg-surface-sunken" aria-label="Loading media" />
    );
  }

  if (!url) return null;

  if (isVideo) {
    return (
      <div className="mt-4 aspect-video overflow-hidden rounded-control bg-black">
        {/* key forces a reload when the signed URL rotates */}
        <video key={url} src={url} controls controlsList="nodownload" className="h-full w-full" />
      </div>
    );
  }

  if (isAudio) {
    return <audio key={url} src={url} controls className="mt-4 w-full" />;
  }

  if (isPdf) {
    return (
      <div className="mt-4">
        <iframe key={url} src={url} title={lesson.title} className="h-[70vh] w-full rounded-control border border-line" />
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
        >
          Open in a new tab
        </a>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-4 inline-block rounded-control border border-line-strong px-4 py-2 text-sm font-medium hover:bg-surface-sunken"
    >
      Download lesson file
    </a>
  );
}

/** Attachment list with on-demand signed download links. */
export function LessonAttachments({ lesson }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  if (!lesson?.attachments?.length) return null;

  const open = async (attachmentId) => {
    setBusyId(attachmentId);
    setError("");
    try {
      const data = await getLessonPlaybackUrl(lesson.id, attachmentId);
      window.open(data.url, "_blank", "noopener");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-ink-muted">Resources</h3>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      <ul className="mt-2 space-y-1">
        {lesson.attachments.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => open(a.id)}
              disabled={busyId === a.id}
              className="text-sm text-brand hover:underline disabled:opacity-50"
            ><Icon name="paperclip" size={14} /> {a.name} {busyId === a.id && "…"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
