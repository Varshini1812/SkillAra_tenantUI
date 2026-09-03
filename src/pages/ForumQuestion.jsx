import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  fetchQuestion,
  deleteQuestion,
  voteQuestion,
  moderateQuestion,
  createAnswer,
  deleteAnswer,
  acceptAnswer,
  voteAnswer,
  moderateAnswer,
} from "../api/forum.js";
import { getErrorMessage } from "../api/client.js";
import { usePermissions } from "../hooks/usePermissions.js";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import Icon from "../admin/components/ui/Icon.jsx";

function VoteButtons({ score, onVote }) {
  return (
    <div className="flex flex-col items-center gap-1 text-ink-subtle">
      <button type="button" onClick={() => onVote(1)} className="rounded p-1 hover:bg-surface-sunken" aria-label="Upvote">
        <Icon name="sortAsc" size={16} />
      </button>
      <span className="text-sm font-semibold text-ink-muted">{score}</span>
      <button type="button" onClick={() => onVote(-1)} className="rounded p-1 hover:bg-surface-sunken" aria-label="Downvote">
        <Icon name="sortDesc" size={16} />
      </button>
    </div>
  );
}

function ForumQuestionContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, can } = usePermissions();
  const canModerate = can("forum", "moderate");

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [answerBody, setAnswerBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchQuestion(id)
      .then((data) => {
        setQuestion(data.question);
        setAnswers(data.answers);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = question && String(question.userId?._id || question.userId) === String(user?.id);

  const submitAnswer = async (e) => {
    e.preventDefault();
    setPosting(true);
    setError("");
    try {
      await createAnswer(id, answerBody.trim());
      setAnswerBody("");
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPosting(false);
    }
  };

  const handleVoteQuestion = async (value) => {
    try {
      const r = await voteQuestion(id, value);
      setQuestion((prev) => ({ ...prev, voteScore: r.voteScore }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleVoteAnswer = async (answerId, value) => {
    try {
      const r = await voteAnswer(answerId, value);
      setAnswers((prev) => prev.map((a) => (a.id === answerId ? { ...a, voteScore: r.voteScore } : a)));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleAccept = async (answerId) => {
    try {
      await acceptAnswer(answerId);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteQuestion = async () => {
    if (!window.confirm("Delete this question and all its answers?")) return;
    try {
      await deleteQuestion(id);
      navigate("/forum");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm("Delete this answer?")) return;
    try {
      await deleteAnswer(answerId);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleModerateQuestion = async () => {
    const reason = window.prompt("Reason for hiding this question?") || "";
    try {
      await moderateQuestion(id, !question.moderation?.isHidden, reason);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleModerateAnswer = async (answerId, currentlyHidden) => {
    const reason = currentlyHidden ? "" : window.prompt("Reason for hiding this answer?") || "";
    try {
      await moderateAnswer(answerId, !currentlyHidden, reason);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <p className="text-sm text-ink-subtle">Loading…</p>;
  if (!question) return <p className="text-sm text-danger">{error || "Question not found"}</p>;

  return (
    <div className="space-y-6">
      <Link
        to="/forum"
        className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-brand transition mb-1"
      >
        <Icon name="arrowLeft" size={15} /> Back to Forum
      </Link>

      {error && <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}

      <div className="flex gap-4 rounded-surface border border-line bg-surface p-4">
        <VoteButtons score={question.voteScore} onVote={handleVoteQuestion} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-ink">{question.title}</h1>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">{question.body}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {question.tags?.map((tag) => (
              <span key={tag} className="rounded bg-surface-sunken px-1.5 py-0.5 text-[10px] text-ink-subtle">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-ink-subtle">
            <span>Asked by {question.userId?.name || question.userId?.email}</span>
            {(isOwner || canModerate) && (
              <button type="button" onClick={handleDeleteQuestion} className="text-danger hover:underline">
                Delete
              </button>
            )}
            {canModerate && (
              <button type="button" onClick={handleModerateQuestion} className="text-warning hover:underline">
                {question.moderation?.isHidden ? "Unhide" : "Hide"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold">{answers.length} Answers</h2>
        <div className="space-y-3">
          {answers.map((a) => (
            <div
              key={a.id}
              className={`flex gap-4 rounded-surface border p-4 ${
                a.isAccepted ? "border-success-border bg-success-subtle" : "border-line bg-surface"
              }`}
            >
              <VoteButtons score={a.voteScore} onVote={(v) => handleVoteAnswer(a.id, v)} />
              <div className="min-w-0 flex-1">
                {a.isAccepted && (
                  <span className="mb-1 inline-block rounded bg-success px-2 py-0.5 text-[10px] font-semibold text-white"><Icon name="check" size={14} /> Accepted
                  </span>
                )}
                <p className="whitespace-pre-wrap text-sm text-ink-muted">{a.body}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-subtle">
                  <span>{a.userId?.name || a.userId?.email}</span>
                  {isOwner && !a.isAccepted && question.status !== "CLOSED" && (
                    <button type="button" onClick={() => handleAccept(a.id)} className="text-success hover:underline">
                      Accept answer
                    </button>
                  )}
                  {(String(a.userId?._id || a.userId) === String(user?.id) || canModerate) && (
                    <button type="button" onClick={() => handleDeleteAnswer(a.id)} className="text-danger hover:underline">
                      Delete
                    </button>
                  )}
                  {canModerate && (
                    <button
                      type="button"
                      onClick={() => handleModerateAnswer(a.id, a.moderation?.isHidden)}
                      className="text-warning hover:underline"
                    >
                      {a.moderation?.isHidden ? "Unhide" : "Hide"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {question.status === "CLOSED" ? (
        <p className="text-sm text-ink-subtle">This question is closed to new answers.</p>
      ) : (
        <form onSubmit={submitAnswer} className="space-y-2 rounded-surface border border-line bg-surface p-4">
          <label className="block text-sm font-medium text-ink-muted">Your answer</label>
          <textarea
            required
            rows={4}
            value={answerBody}
            onChange={(e) => setAnswerBody(e.target.value)}
            className="w-full rounded border border-line-strong px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={posting}
            className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
          >
            {posting ? "Posting…" : "Post answer"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ForumQuestion() {
  return (
    <ProtectedRoute>
      <ForumQuestionContent />
    </ProtectedRoute>
  );
}
