import { useCallback, useEffect, useState } from "react";

import {
  approveCourseReview,
  fetchCourseReview,
  fetchCourseReviewers,
  requestCourseChanges,
  submitCourseForReview,
} from "../../api/courses.js";
import { getErrorMessage } from "../../api/client.js";
import { can } from "../../utils/permissions.js";

const STATUS_STYLES = {
  NOT_SUBMITTED: { label: "Not submitted", chip: "bg-surface-sunken text-ink-muted" },
  PENDING: { label: "In review", chip: "bg-brand-muted text-brand-hover" },
  CHANGES_REQUESTED: { label: "Changes requested", chip: "bg-warning-subtle text-warning" },
  APPROVED: { label: "Approved", chip: "bg-success-subtle text-success" },
};

const ACTION_LABELS = {
  submitted: "Submitted for review",
  changes_requested: "Changes requested",
  approved: "Approved",
  reset: "Review reset",
};

/**
 * Content-review workflow for one course.
 *
 * Renders both sides of the hand-off from the same state, because who you are decides which
 * half you get: the author submits and re-submits, the assigned reviewer approves or sends
 * it back. Publishing lives in the parent and stays disabled until status is APPROVED.
 *
 * @param {{courseId: string, user: object, review: object|null,
 *          onReviewChange: (review: object) => void}} props
 */
export default function CourseReviewPanel({ courseId, user, review, onReviewChange }) {
  const [reviewers, setReviewers] = useState([]);
  const [reviewerId, setReviewerId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const status = review?.status || "NOT_SUBMITTED";
  const isAssignedReviewer = String(review?.reviewerId || "") === String(user?.id || "");
  const canSubmit = can(user, "courses", "submit");
  const canDecide = can(user, "courses", "approve") && (isAssignedReviewer || can(user, "courses", "delete"));

  const loadReviewers = useCallback(async () => {
    if (!canSubmit) return;
    try {
      const list = await fetchCourseReviewers();
      setReviewers(list);
      setReviewerId((current) => current || (list[0]?.id ?? ""));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [canSubmit]);

  useEffect(() => {
    loadReviewers();
  }, [loadReviewers]);

  const run = async (fn, successMessage) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await fn();
      onReviewChange(updated);
      setNote("");
      setNotice(successMessage);
    } catch (err) {
      setError(getErrorMessage(err));
      // Re-read so the panel never shows a state the server disagrees with.
      try {
        onReviewChange(await fetchCourseReview(courseId));
      } catch {
        // keep the error already shown
      }
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (!reviewerId) {
      setError("Choose a content reviewer to send this course to.");
      return;
    }
    return run(
      () => submitCourseForReview(courseId, { reviewerId, note: note.trim() }),
"Sent for review. The reviewer has been notified."
    );
  };

  const requestChanges = () => {
    if (note.trim().length < 3) {
      setError("Tell the instructor what needs to change.");
      return;
    }
    return run(
      () => requestCourseChanges(courseId, note.trim()),
"Sent back to the instructor with your notes."
    );
  };

  const approve = () =>
    run(
      () => approveCourseReview(courseId, note.trim()),
"Approved. The instructor can publish this course now."
    );

  const style = STATUS_STYLES[status] || STATUS_STYLES.NOT_SUBMITTED;
  const awaitingSubmission = status === "NOT_SUBMITTED" || status === "CHANGES_REQUESTED";

  return (
    <section className="rounded-surface border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Content review</h2>
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${style.chip}`}>
          {style.label}
        </span>
      </div>

      <p className="mt-1 text-xs text-ink-subtle">
        A course has to be approved by a content reviewer before it can be published.
      </p>

      {review?.note && (
        <div className="mt-3 rounded-control bg-surface-sunken p-3">
          <p className="text-xs font-medium text-ink-subtle">Latest reviewer note</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">{review.note}</p>
        </div>
      )}

      {error && <div className="mt-3 rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}
      {notice && (
        <div className="mt-3 rounded-control bg-success-subtle p-3 text-sm text-success">{notice}</div>
      )}

      {/* Author side — pick a reviewer and send it over. */}
      {canSubmit && awaitingSubmission && (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-ink-muted">Send to</span>
            <select
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              disabled={busy || reviewers.length === 0}
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm"
            >
              {reviewers.length === 0 && <option value="">No reviewer available</option>}
              {reviewers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name || r.email} — {r.roleName}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-ink-muted">Note for the reviewer (optional)</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              disabled={busy}
              placeholder="Anything the reviewer should look at first?"
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm"
            />
          </label>

          <button
            type="button"
            onClick={submit}
            disabled={busy || reviewers.length === 0}
            className="w-full rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {status === "CHANGES_REQUESTED" ? "Re-submit for review" : "Submit for review"}
          </button>

          {reviewers.length === 0 && (
            <p className="text-xs text-warning">
              Nobody in this organization holds the Content Reviewer role yet. Ask an admin to
              assign it in Roles &amp; permissions.
            </p>
          )}
        </div>
      )}

      {canSubmit && status === "PENDING" && (
        <p className="mt-4 rounded-control bg-brand-subtle p-3 text-sm text-brand-hover">
          Waiting on the reviewer. You&apos;ll get a notification when they respond.
        </p>
      )}

      {/* Reviewer side — approve, or send it back with what needs fixing. */}
      {canDecide && status === "PENDING" && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <label className="block">
            <span className="text-xs font-medium text-ink-muted">
              Your notes — required to request changes
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              disabled={busy}
              placeholder="Plagiarism findings, corrections, or anything the instructor must fix."
              className="mt-1 w-full rounded-control border border-line-strong px-3 py-2 text-sm"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={approve}
              disabled={busy}
              className="flex-1 rounded-control bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success disabled:opacity-50"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={requestChanges}
              disabled={busy}
              className="flex-1 rounded-control border border-warning px-4 py-2 text-sm font-medium text-warning hover:bg-warning-subtle disabled:opacity-50"
            >
              Request changes
            </button>
          </div>
        </div>
      )}

      {review?.history?.length > 0 && (
        <ol className="mt-4 space-y-2 border-t border-line pt-4">
          {[...review.history].reverse().map((event, index) => (
            <li key={`${event.at}-${index}`} className="text-xs">
              <span className="font-medium text-ink-muted">
                {ACTION_LABELS[event.action] || event.action}
              </span>
              <span className="text-ink-subtle">
                {" "}
                · {event.actorName || "Someone"} ·{" "}
                {event.at ? new Date(event.at).toLocaleString() : ""}
              </span>
              {event.note && <p className="mt-0.5 text-ink-muted">{event.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
