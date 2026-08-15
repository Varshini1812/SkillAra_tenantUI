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
    <li className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 p-2">
        <span className="w-6 shrink-0 text-center text-xs text-slate-400">{index + 1}</span>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 truncate text-left text-sm font-medium hover:text-indigo-600"
        >
          {draft.title}
        </button>

        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
          {draft.type}
        </span>
        {draft.isPreview && (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[11px] text-emerald-700">
            Preview
          </span>
        )}
        {draft.hasContent ? (
          <span className="text-xs text-emerald-600" title="Media uploaded">
            ●
          </span>
        ) : (
          <span className="text-xs text-slate-300" title="No media">
            ○
          </span>
        )}

        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={!canMoveUp}
            className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 disabled:opacity-30"
            aria-label="Move lesson up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={!canMoveDown}
            className="rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 disabled:opacity-30"
            aria-label="Move lesson down"
          >
            ↓
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-slate-100 p-3">
          {error && <div className="rounded bg-red-50 p-2 text-xs text-red-600">{error}</div>}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600">
              Title
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                onBlur={() => draft.title !== lesson.title && patch({ title: draft.title })}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>

            <label className="text-xs font-medium text-slate-600">
              Type
              <select
                value={draft.type}
                onChange={(e) => patch({ type: e.target.value })}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              >
                {LESSON_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-medium text-slate-600">
              Duration (minutes)
              <input
                type="number"
                min="0"
                value={draft.duration ?? 0}
                onChange={(e) => setDraft({ ...draft, duration: Number(e.target.value) })}
                onBlur={() =>
                  draft.duration !== lesson.duration && patch({ duration: Number(draft.duration) })
                }
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>

            <label className="flex items-center gap-2 self-end text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={Boolean(draft.isPreview)}
                onChange={(e) => patch({ isPreview: e.target.checked })}
              />
              Free preview (playable without enrolling)
            </label>
          </div>

          <label className="block text-xs font-medium text-slate-600">
            Lesson notes
            <textarea
              rows={4}
              value={draft.content || ""}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              onBlur={() => draft.content !== lesson.content && patch({ content: draft.content })}
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              placeholder="Markdown or plain text shown alongside the media"
            />
          </label>

          {draft.type === "ASSIGNMENT" && (
            <label className="block text-xs font-medium text-slate-600">
              Assignment instructions
              <textarea
                rows={3}
                value={draft.assignmentInstructions || ""}
                onChange={(e) => setDraft({ ...draft, assignmentInstructions: e.target.value })}
                onBlur={() =>
                  draft.assignmentInstructions !== lesson.assignmentInstructions &&
                  patch({ assignmentInstructions: draft.assignmentInstructions })
                }
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
          )}

          {/* ---- media ---- */}
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Lesson media</p>

            {draft.hasContent ? (
              <p className="mt-1 text-xs text-slate-500">
                {draft.mimeType || "file"} · {formatBytes(draft.fileSize)} · stored privately in
                Backblaze B2
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
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
              className="mt-2 block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-indigo-700"
            />

            {uploadPercent !== null && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Uploading… {uploadPercent}%</p>
              </div>
            )}
          </div>

          {/* ---- attachments ---- */}
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-700">Attachments</p>
            <ul className="mt-1 space-y-1">
              {(draft.attachments || []).map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="flex-1 truncate">📎 {a.name}</span>
                  <span className="text-slate-400">{formatBytes(a.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    className="text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
              {(draft.attachments || []).length === 0 && (
                <li className="text-xs text-slate-400">None yet.</li>
              )}
            </ul>
            <input
              ref={attachmentInput}
              type="file"
              onChange={(e) => handleAttachment(e.target.files?.[0])}
              className="mt-2 block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">{saving ? "Saving…" : "Changes save on blur"}</span>
            <button
              type="button"
              onClick={remove}
              className="text-xs font-medium text-rose-600 hover:underline"
            >
              Delete lesson
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
