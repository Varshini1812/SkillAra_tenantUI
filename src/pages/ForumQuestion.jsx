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

function VoteButtons({ score, onVote }) {
  return (
    <div className="flex flex-col items-center gap-1 text-slate-500">
      <button type="button" onClick={() => onVote(1)} className="rounded p-1 hover:bg-slate-100" aria-label="Upvote">
        ▲
      </button>
      <span className="text-sm font-semibold text-slate-700">{score}</span>
      <button type="button" onClick={() => onVote(-1)} className="rounded p-1 hover:bg-slate-100" aria-label="Downvote">
        ▼
      </button>
    </div>
  );
}

function ForumQuestionContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isStaff } = usePermissions();

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

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;
  if (!question) return <p className="text-sm text-red-500">{error || "Question not found"}</p>;

  return (
    <div className="space-y-6">
      <Link to="/forum" className="text-sm text-slate-500 hover:text-indigo-600">
        ← Back to forum
      </Link>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <div className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <VoteButtons score={question.voteScore} onVote={handleVoteQuestion} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-slate-900">{question.title}</h1>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{question.body}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {question.tags?.map((tag) => (
              <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>Asked by {question.userId?.name || question.userId?.email}</span>
            {(isOwner || isStaff) && (
              <button type="button" onClick={handleDeleteQuestion} className="text-rose-600 hover:underline">
                Delete
              </button>
            )}
            {isStaff && (
              <button type="button" onClick={handleModerateQuestion} className="text-amber-600 hover:underline">
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
              className={`flex gap-4 rounded-xl border p-4 ${
                a.isAccepted ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"
              }`}
            >
              <VoteButtons score={a.voteScore} onVote={(v) => handleVoteAnswer(a.id, v)} />
              <div className="min-w-0 flex-1">
                {a.isAccepted && (
                  <span className="mb-1 inline-block rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    ✓ Accepted
                  </span>
                )}
                <p className="whitespace-pre-wrap text-sm text-slate-700">{a.body}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>{a.userId?.name || a.userId?.email}</span>
                  {isOwner && !a.isAccepted && question.status !== "CLOSED" && (
                    <button type="button" onClick={() => handleAccept(a.id)} className="text-emerald-600 hover:underline">
                      Accept answer
                    </button>
                  )}
                  {(String(a.userId?._id || a.userId) === String(user?.id) || isStaff) && (
                    <button type="button" onClick={() => handleDeleteAnswer(a.id)} className="text-rose-600 hover:underline">
                      Delete
                    </button>
                  )}
                  {isStaff && (
                    <button
                      type="button"
                      onClick={() => handleModerateAnswer(a.id, a.moderation?.isHidden)}
                      className="text-amber-600 hover:underline"
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
        <p className="text-sm text-slate-400">This question is closed to new answers.</p>
      ) : (
        <form onSubmit={submitAnswer} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          <label className="block text-sm font-medium text-slate-700">Your answer</label>
          <textarea
            required
            rows={4}
            value={answerBody}
            onChange={(e) => setAnswerBody(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={posting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
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
