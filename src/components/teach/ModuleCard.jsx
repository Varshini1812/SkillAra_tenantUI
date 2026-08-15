import { useState } from "react";

import { addLesson, deleteModule, reorderLessons, updateModule } from "../../api/courses.js";
import { getErrorMessage } from "../../api/client.js";
import LessonRow from "./LessonRow.jsx";

/**
 * One module in the curriculum builder, owning its lesson list and ordering.
 * Reordering is optimistic: the list is swapped locally, then persisted; on failure
 * the parent reloads the course so the UI cannot drift from the server.
 */
export default function ModuleCard({ module, index, onChanged, onDeleted, onMove, canMoveUp, canMoveDown, onReloadNeeded }) {
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description || "");
  const [lessons, setLessons] = useState(module.lessons || []);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const saveModule = async (changes) => {
    setError("");
    try {
      const updated = await updateModule(module.id, changes);
      onChanged({ ...module, ...updated, lessons });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async () => {
    if (
      !window.confirm(
        `Delete module "${title}" and its ${lessons.length} lesson(s)? Uploaded files are deleted too.`
      )
    ) {
      return;
    }
    try {
      await deleteModule(module.id);
      onDeleted(module.id);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const createLesson = async (e) => {
    e.preventDefault();
    const value = newLessonTitle.trim();
    if (!value) return;

    setAdding(true);
    setError("");
    try {
      const lesson = await addLesson(module.id, { title: value, type: "VIDEO" });
      setLessons((prev) => [...prev, lesson]);
      setNewLessonTitle("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const moveLesson = async (from, delta) => {
    const to = from + delta;
    if (to < 0 || to >= lessons.length) return;

    const next = [...lessons];
    [next[from], next[to]] = [next[to], next[from]];
    setLessons(next);

    try {
      await reorderLessons(module.id, next.map((l) => l.id));
    } catch (err) {
      setError(getErrorMessage(err));
      onReloadNeeded?.();
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex items-start gap-2">
        <span className="mt-2 shrink-0 rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {index + 1}
        </span>

        <div className="min-w-0 flex-1">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title !== module.title && saveModule({ title })}
            className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-base font-semibold hover:border-slate-300 focus:border-slate-300 focus:bg-white"
            placeholder="Module title"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => description !== (module.description || "") && saveModule({ description })}
            className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-sm text-slate-500 hover:border-slate-300 focus:border-slate-300 focus:bg-white"
            placeholder="Short description (optional)"
          />
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={!canMoveUp}
            className="rounded px-2 py-1 text-sm text-slate-400 hover:bg-slate-200 disabled:opacity-30"
            aria-label="Move module up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={!canMoveDown}
            className="rounded px-2 py-1 text-sm text-slate-400 hover:bg-slate-200 disabled:opacity-30"
            aria-label="Move module down"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={remove}
            className="rounded px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      </div>

      {error && <div className="mt-2 rounded bg-red-50 p-2 text-xs text-red-600">{error}</div>}

      <ul className="mt-3 space-y-2">
        {lessons.map((lesson, i) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            index={i}
            canMoveUp={i > 0}
            canMoveDown={i < lessons.length - 1}
            onMove={(delta) => moveLesson(i, delta)}
            onChanged={(updated) =>
              setLessons((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
            }
            onDeleted={(id) => setLessons((prev) => prev.filter((l) => l.id !== id))}
          />
        ))}
        {lessons.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-300 p-3 text-center text-xs text-slate-400">
            No lessons yet.
          </li>
        )}
      </ul>

      <form onSubmit={createLesson} className="mt-3 flex gap-2">
        <input
          value={newLessonTitle}
          onChange={(e) => setNewLessonTitle(e.target.value)}
          placeholder="New lesson title"
          maxLength={200}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={adding || !newLessonTitle.trim()}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add lesson"}
        </button>
      </form>
    </div>
  );
}
