import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchQuestions, createQuestion, deleteQuestion, moderateQuestion } from "../api/forum.js";
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
        className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
      >
        Ask a question
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-surface border border-line bg-surface p-4">
      {error && <div className="rounded-control bg-danger-subtle p-2 text-sm text-danger">{error}</div>}
      <label className="block text-xs font-medium text-ink-muted">
        Title
        <input
          required
          minLength={5}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-xs font-medium text-ink-muted">
        Details
        <textarea
          required
          minLength={5}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
        />
      </label>
      <label className="block text-xs font-medium text-ink-muted">
        Tags <span className="font-normal text-ink-subtle">(comma separated)</span>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-control border border-line-strong px-3 py-1.5 text-sm hover:bg-surface-sunken"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-control bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {saving ? "Posting…" : "Post question"}
        </button>
      </div>
    </form>
  );
}

function ForumContent() {
  const { can, isStaff } = usePermissions();
  const canModerate = isStaff || can("forum", "moderate") || can("courses", "approve");
  const canAuthorCourses = can("courses", "create");

  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchQuestions(search ? { search } : {})
      .then((r) => setQuestions(r.items || []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Delete this question from the forum?")) return;
    try {
      await deleteQuestion(id);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleModerateHide = async (e, id, currentHidden) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await moderateQuestion(id, !currentHidden, "Content Reviewer moderation");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const unansweredCount = useMemo(() => {
    return questions.filter((q) => (q.answerCount || 0) === 0).length;
  }, [questions]);

  const filteredAndSorted = useMemo(() => {
    let list = [...questions];
    if (statusFilter === "unanswered") {
      list = list.filter((q) => (q.answerCount || 0) === 0);
    } else if (statusFilter === "answered") {
      list = list.filter((q) => (q.answerCount || 0) > 0);
    }

    if (sortBy === "newest") {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === "answers") {
      list.sort((a, b) => (b.answerCount || 0) - (a.answerCount || 0));
    } else if (sortBy === "votes") {
      list.sort((a, b) => (b.voteScore || 0) - (a.voteScore || 0));
    }
    return list;
  }, [questions, statusFilter, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Forum</h1>
          </div>
          <p className="mt-1 text-sm text-ink-subtle">Ask questions, help others, vote on answers.</p>
        </div>
        <AskForm onCreated={load} />
      </div>

      {canAuthorCourses && unansweredCount > 0 && (
        <div className="flex items-center justify-between rounded-surface border border-warning-border bg-warning-subtle p-3 text-sm">
          <div className="flex items-center gap-2 text-warning">
            <span className="font-semibold">Instructor Alert:</span>
            <span>{unansweredCount} learner question(s) are currently unanswered and need your attention.</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter("unanswered")}
            className="rounded-chip bg-warning px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90"
          >
            View Unanswered
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions…"
          className="w-full max-w-sm rounded-control border border-line-strong px-3 py-2 text-sm"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-control border border-line-strong px-3 py-2 text-sm"
        >
          <option value="all">All questions</option>
          <option value="unanswered">Unanswered ({unansweredCount})</option>
          <option value="answered">Answered</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-control border border-line-strong px-3 py-2 text-sm bg-surface"
        >
          <option value="newest">Sort: Newest</option>
          <option value="answers">Sort: Most Answers</option>
          <option value="votes">Sort: Highest Voted</option>
        </select>
      </div>

      {error && <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}

      {loading ? (
        <p className="text-sm text-ink-subtle">Loading…</p>
      ) : filteredAndSorted.length === 0 ? (
        <p className="rounded-control border border-dashed border-line-strong p-8 text-center text-sm text-ink-subtle">
          {statusFilter === "unanswered"
            ? "No unanswered questions! Great job supporting your learners."
            : "No questions found."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filteredAndSorted.map((q) => (
            <li key={q.id}>
              <div className="flex flex-col gap-2 rounded-surface border border-line bg-surface p-4 hover:border-brand-border sm:flex-row sm:items-center sm:justify-between">
                <Link to={`/forum/${q.id}`} className="flex flex-1 items-center gap-4 min-w-0">
                  <div className="flex w-14 shrink-0 flex-col items-center text-xs text-ink-subtle">
                    <span className="text-base font-semibold text-ink-muted">{q.voteScore || 0}</span>
                    votes
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-ink hover:text-brand">{q.title}</p>
                      {(q.answerCount || 0) === 0 && (
                        <span className="rounded-chip bg-warning-subtle px-2 py-0.5 text-[10px] font-semibold text-warning border border-warning-border">
                          Needs Answer
                        </span>
                      )}
                      {q.isHidden && (
                        <span className="rounded bg-danger-subtle px-2 py-0.5 text-[10px] font-semibold text-danger">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {q.tags?.map((tag) => (
                        <span key={tag} className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] text-ink-subtle">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>

                <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-ink-subtle shrink-0">
                  <div className="text-right">
                    <p className={(q.answerCount || 0) === 0 ? "font-semibold text-warning" : ""}>
                      {q.answerCount || 0} answers
                    </p>
                    <p>{q.viewCount || 0} views</p>
                  </div>

                  {canModerate && (
                    <div className="flex items-center gap-2 border-l border-line pl-3">
                      <button
                        type="button"
                        onClick={(e) => handleModerateHide(e, q.id, q.isHidden)}
                        className="rounded border border-line px-2 py-1 text-[11px] font-medium hover:bg-surface-sunken"
                      >
                        {q.isHidden ? "Unhide" : "Hide"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, q.id)}
                        className="rounded border border-danger-border px-2 py-1 text-[11px] font-medium text-danger hover:bg-danger-subtle"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
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
    <ProtectedRoute requires={["forum", "view"]}>
      <ForumContent />
    </ProtectedRoute>
  );
}
