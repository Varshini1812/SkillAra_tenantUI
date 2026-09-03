import { useState } from "react";

export default function CourseAnnouncements({ courseId }) {
  const [announcements, setAnnouncements] = useState([
    {
      id: "ann-1",
      title: "Welcome to the course!",
      content: "Please complete Module 1 by Friday and attempt the practice quiz.",
      date: new Date().toLocaleDateString(),
      author: "Instructor",
    },
  ]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newAnn = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      date: new Date().toLocaleDateString(),
      author: "Instructor",
    };

    setAnnouncements([newAnn, ...announcements]);
    setTitle("");
    setContent("");
    setShowForm(false);
  };

  return (
    <div className="rounded-surface border border-line bg-surface p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-ink">Course Announcements</h2>
          <p className="text-xs text-ink-subtle">
            Post updates and messages directly to all enrolled students
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-control bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover"
        >
          {showForm ? "Cancel" : "+ Post Announcement"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-control border border-line p-3 bg-surface-sunken space-y-3">
          <label className="block text-xs font-medium text-ink-muted">
            Announcement Title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm quiz schedule update"
              className="mt-1 w-full rounded border border-line-strong px-2.5 py-1.5 text-sm bg-surface"
            />
          </label>

          <label className="block text-xs font-medium text-ink-muted">
            Message
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your update here..."
              className="mt-1 w-full rounded border border-line-strong px-2.5 py-1.5 text-sm bg-surface"
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="rounded-control bg-brand px-4 py-1.5 text-xs font-medium text-white hover:bg-brand-hover"
            >
              Post to Students
            </button>
          </div>
        </form>
      )}

      {announcements.length === 0 ? (
        <p className="text-center py-6 text-xs text-ink-subtle italic border border-dashed border-line rounded">
          No announcements posted yet.
        </p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="rounded-control border border-line p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-ink">{a.title}</h3>
                <span className="text-[11px] text-ink-subtle">{a.date}</span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed whitespace-pre-wrap">{a.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
