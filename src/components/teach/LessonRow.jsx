import { useRef, useState } from "react";

import {
  addLessonAttachment,
  deleteLesson,
  deleteLessonAttachment,
  updateLesson,
  uploadLessonContent,
  DIRECT_UPLOAD_THRESHOLD_BYTES,
} from "../../api/courses.js";
import { getErrorMessage } from "../../api/client.js";
import Icon from "../../admin/components/ui/Icon.jsx";

const LESSON_TYPES = ["VIDEO", "TEXT", "PDF", "QUIZ", "ASSIGNMENT"];

function formatBytes(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}

/**
 * One lesson inside the curriculum builder: inline rename, type/duration/preview
 * settings, media upload, and attachments.
 */
export default function LessonRow({ lesson, index, onChanged, onDeleted, onMove, canMoveUp, canMoveDown }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(lesson);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadPercent, setUploadPercent] = useState(null);

  const contentInput = useRef(null);
  const attachmentInput = useRef(null);

  const patch = async (changes) => {
    setSaving(true);
    setError("");
    try {
      const updated = await updateLesson(lesson.id, changes);
      setDraft(updated);
      onChanged(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setError("");
    setUploadPercent(0);
    try {
      const updated = await uploadLessonContent(lesson.id, file, setUploadPercent);
      setDraft(updated);
      onChanged(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploadPercent(null);
      if (contentInput.current) contentInput.current.value = "";
    }
  };

  const handleAttachment = async (file) => {
    if (!file) return;
    setError("");
    try {
      const updated = await addLessonAttachment(lesson.id, file);
      setDraft(updated);
      onChanged(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      if (attachmentInput.current) attachmentInput.current.value = "";
    }
  };

  const removeAttachment = async (attachmentId) => {
    try {
      const updated = await deleteLessonAttachment(lesson.id, attachmentId);
      setDraft(updated);
      onChanged(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete lesson "${draft.title}"? Its uploaded files are deleted too.`)) return;
    try {
      await deleteLesson(lesson.id);
      onDeleted(lesson.id);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <li className="rounded-control border border-line bg-surface">
      <div className="flex items-center gap-2 p-2">
        <span className="w-6 shrink-0 text-center text-xs text-ink-subtle">{index + 1}</span>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 truncate text-left text-sm font-medium hover:text-brand"
        >
          {draft.title}
        </button>

        <span className="rounded bg-surface-sunken px-1.5 py-0.5 text-[11px] text-ink-muted">
          {draft.type}
        </span>
        {draft.isPreview && (
          <span className="rounded bg-success-subtle px-1.5 py-0.5 text-[11px] text-success">
            Preview
          </span>
        )}
        {draft.hasContent ? (
          <span className="text-xs text-success" title="Media uploaded">
            <Icon name="circleDot" size={12} />
          </span>
        ) : (
          <span className="text-xs text-ink-subtle" title="No media">
            <Icon name="circle" size={12} />
          </span>
        )}

        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={!canMoveUp}
            className="rounded px-1.5 py-0.5 text-xs text-ink-subtle hover:bg-surface-sunken disabled:opacity-30"
            aria-label="Move lesson up"
          >
            <Icon name="arrowUp" size={14} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={!canMoveDown}
            className="rounded px-1.5 py-0.5 text-xs text-ink-subtle hover:bg-surface-sunken disabled:opacity-30"
            aria-label="Move lesson down"
          >
            <Icon name="arrowDown" size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-line p-3">
          {error && <div className="rounded bg-danger-subtle p-2 text-xs text-danger">{error}</div>}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-ink-muted">
              Title
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                onBlur={() => draft.title !== lesson.title && patch({ title: draft.title })}
                className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
              />
            </label>

            <label className="text-xs font-medium text-ink-muted">
              Type
              <select
                value={draft.type}
                onChange={(e) => patch({ type: e.target.value })}
                className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
              >
                {LESSON_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-ink-muted">
              Duration (minutes)
              <input
                type="number"
                min="0"
                value={draft.duration ?? 0}
                onChange={(e) => setDraft({ ...draft, duration: Number(e.target.value) })}
                onBlur={() =>
                  draft.duration !== lesson.duration && patch({ duration: Number(draft.duration) })
                }
                className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
              />
            </label>

            <label className="flex items-center gap-2 self-end text-xs font-medium text-ink-muted">
              <input
                type="checkbox"
                checked={Boolean(draft.isPreview)}
                onChange={(e) => patch({ isPreview: e.target.checked })}
              />
              Free preview (playable without enrolling)
            </label>
          </div>

          <label className="block text-xs font-medium text-ink-muted">
            Lesson notes
            <textarea
              rows={4}
              value={draft.content || ""}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              onBlur={() => draft.content !== lesson.content && patch({ content: draft.content })}
              className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
              placeholder="Markdown or plain text shown alongside the media"
            />
          </label>

          {draft.type === "ASSIGNMENT" && (
            <label className="block text-xs font-medium text-ink-muted">
              Assignment instructions
              <textarea
                rows={3}
                value={draft.assignmentInstructions || ""}
                onChange={(e) => setDraft({ ...draft, assignmentInstructions: e.target.value })}
                onBlur={() =>
                  draft.assignmentInstructions !== lesson.assignmentInstructions &&
                  patch({ assignmentInstructions: draft.assignmentInstructions })
                }
                className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
              />
            </label>
          )}

          {/* ---- media ---- */}
          <div className="rounded-control bg-surface-sunken p-3">
            <p className="text-xs font-semibold text-ink-muted">Lesson media</p>

            {draft.hasContent ? (
              <p className="mt-1 text-xs text-ink-subtle">
                {draft.mimeType || "file"} · {formatBytes(draft.fileSize)} · stored privately in
                Backblaze B2
              </p>
            ) : (
              <p className="mt-1 text-xs text-ink-subtle">
                No file uploaded. Videos over {Math.round(DIRECT_UPLOAD_THRESHOLD_BYTES / 1024 / 1024)} MB
                upload straight to storage.
              </p>
            )}

            <input
              ref={contentInput}
              type="file"
              accept="video/*,audio/*,application/pdf,image/*"
              onChange={(e) => handleUpload(e.target.files?.[0])}
              disabled={uploadPercent !== null}
              className="mt-2 block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-brand-subtle file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-hover"
            />

            {uploadPercent !== null && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-ink-subtle">Uploading… {uploadPercent}%</p>
              </div>
            )}
          </div>

          {/* ---- attachments ---- */}
          <div className="rounded-control bg-surface-sunken p-3">
            <p className="text-xs font-semibold text-ink-muted">Attachments</p>
            <ul className="mt-1 space-y-1">
              {(draft.attachments || []).map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-xs text-ink-muted">
                  <span className="flex-1 truncate"><Icon name="paperclip" size={14} /> {a.name}</span>
                  <span className="text-ink-subtle">{formatBytes(a.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    className="text-danger hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
              {(draft.attachments || []).length === 0 && (
                <li className="text-xs text-ink-subtle">None yet.</li>
              )}
            </ul>
            <input
              ref={attachmentInput}
              type="file"
              onChange={(e) => handleAttachment(e.target.files?.[0])}
              className="mt-2 block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-surface-sunken file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink-muted"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-subtle">{saving ? "Saving…" : "Changes save on blur"}</span>
            <button
              type="button"
              onClick={remove}
              className="text-xs font-medium text-danger hover:underline"
            >
              Delete lesson
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
