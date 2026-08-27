import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchQuestions, createQuestion } from "../api/forum.js";
import { getErrorMessage } from "../api/client.js";
import { usePermissions } from "../hooks/usePermissions.js";
import { useAuth } from "../context/AuthContext.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import LockedFeature from "../components/common/LockedFeature.jsx";

function AskForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createQuestion({
        title: title.trim(),
        body: body.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setTitle("");
      setBody("");
      setTags("");
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Ask a question
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      {error && <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</div>}
      <label className="block text-xs font-medium text-slate-600">
        Title
        <input
          required
          minLength={5}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-xs font-medium text-slate-600">
        Details
        <textarea
          required
          minLength={5}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-xs font-medium text-slate-600">
        Tags <span className="font-normal text-slate-400">(comma separated)</span>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Posting…" : "Post question"}
        </button>
      </div>
    </form>
  );
}

function ForumContent() {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchQuestions(search ? { search } : {})
      .then((r) => setQuestions(r.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Forum</h1>
          <p className="mt-1 text-sm text-slate-500">Ask questions, help others, vote on answers.</p>
        </div>
        <AskForm onCreated={load} />
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search questions…"
        className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : questions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
          No questions yet. Be the first to ask.
        </p>
      ) : (
        <ul className="space-y-2">
          {questions.map((q) => (
            <li key={q.id}>
              <Link
                to={`/forum/${q.id}`}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-200"
              >
                <div className="flex w-14 shrink-0 flex-col items-center text-xs text-slate-500">
                  <span className="text-base font-semibold text-slate-700">{q.voteScore}</span>
                  votes
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{q.title}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {q.tags?.map((tag) => (
                      <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-right text-xs text-slate-400">
                  <p>{q.answerCount} answers</p>
                  <p>{q.viewCount} views</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Forum() {
  const { tenantInfo } = useAuth();
  
  if (tenantInfo?.planFeatures && tenantInfo.planFeatures.communityEnabled === false) {
    return (
      <LockedFeature 
        title="Community Forum" 
        description="Build an active community by allowing learners and instructors to ask questions, post answers, and share knowledge." 
      />
    );
  }

  return (
    <ProtectedRoute module="forum" actions={["view"]}>
      <ForumContent />
    </ProtectedRoute>
  );
}
