import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  addModule,
  deleteCourse,
  fetchCourse,
  publishCourse,
  reorderModules,
  unpublishCourse,
  updateCourse,
  uploadCourseThumbnail,
} from "../../api/courses.js";
import { getErrorMessage } from "../../api/client.js";
import ModuleCard from "../../components/teach/ModuleCard.jsx";
import CourseReviewPanel from "../../components/teach/CourseReviewPanel.jsx";
import { usePermissions } from "../../hooks/usePermissions.js";
import CourseMockTests from "../../components/teach/CourseMockTests.jsx";
import CourseLiveSessions from "../../components/teach/CourseLiveSessions.jsx";
import CourseStudents from "../../components/teach/CourseStudents.jsx";
import CourseAnnouncements from "../../components/teach/CourseAnnouncements.jsx";
import CourseAnalyticsModal from "../../components/teach/CourseAnalyticsModal.jsx";
import Icon from "../../admin/components/ui/Icon.jsx";

const LEVELS = ["ALL_LEVELS", "BEGINNER", "INTERMEDIATE", "ADVANCED"];

/** Comma/newline separated text <-> string[] for tags, outcomes, requirements. */
const toList = (text) =>
  text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

export default function CourseEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const thumbInput = useRef(null);
  const { user, can } = usePermissions();

  const [course, setCourse] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await fetchCourse(id);
      setCourse(data);
      setForm({
        title: data.title || "",
        subtitle: data.subtitle || "",
        description: data.description || "",
        category: data.category || "",
        level: data.level || "ALL_LEVELS",
        language: data.language || "en",
        price: data.price ?? 0,
        currency: data.currency || "INR",
        tags: (data.tags || []).join("\n"),
        outcomes: (data.outcomes || []).join("\n"),
        requirements: (data.requirements || []).join("\n"),
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const updated = await updateCourse(id, {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description,
        category: form.category.trim(),
        level: form.level,
        language: form.language.trim() || "en",
        price: Number(form.price) || 0,
        currency: (form.currency || "INR").toUpperCase(),
        tags: toList(form.tags),
        outcomes: toList(form.outcomes),
        requirements: toList(form.requirements),
      });
      setCourse((prev) => ({ ...prev, ...updated }));
      setNotice("Course details saved.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnail = async (file) => {
    if (!file) return;
    setError("");
    try {
      const updated = await uploadCourseThumbnail(id, file);
      setCourse((prev) => ({ ...prev, ...updated }));
      setNotice("Thumbnail updated.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      if (thumbInput.current) thumbInput.current.value = "";
    }
  };

  const togglePublish = async () => {
    setError("");
    setNotice("");
    try {
      const updated =
        course.status === "PUBLISHED" ? await unpublishCourse(id) : await publishCourse(id);
      setCourse((prev) => ({ ...prev, ...updated }));
      setNotice(updated.status === "PUBLISHED" ? "Course is live." : "Course moved back to draft.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const archive = async () => {
    if (!window.confirm("Archive this course? Learners will no longer see it in the catalog.")) return;
    try {
      await deleteCourse(id);
      navigate("/teach");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const createModule = async (e) => {
    e.preventDefault();
    const value = newModuleTitle.trim();
    if (!value) return;
    try {
      const module = await addModule(id, { title: value });
      setCourse((prev) => ({ ...prev, modules: [...(prev.modules || []), module] }));
      setNewModuleTitle("");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const moveModule = async (from, delta) => {
    const to = from + delta;
    const modules = course.modules || [];
    if (to < 0 || to >= modules.length) return;

    const next = [...modules];
    [next[from], next[to]] = [next[to], next[from]];
    setCourse((prev) => ({ ...prev, modules: next }));

    try {
      await reorderModules(id, next.map((m) => m.id));
    } catch (err) {
      setError(getErrorMessage(err));
      load();
    }
  };

  if (loading) return <div className="text-center text-ink-subtle">Loading course…</div>;
  if (!course) return <div className="text-center text-danger">{error || "Course not found"}</div>;

  const isPublished = course.status === "PUBLISHED";
  const blocked = course.moderation?.isBlocked;
  const review = course.review || null;
  const canEdit = can("courses", "edit");
  const canPublish = can("courses", "publish");
  const canArchive = can("courses", "delete");
  const approved = review?.status === "APPROVED";
  const publishBlockedReason = blocked
    ? "An administrator has blocked this course"
    : !approved
      ? "A content reviewer has to approve this course before it can be published"
      : undefined;

  const isAuthor = can("courses", "create");
  const backTo = isAuthor ? "/teach" : "/review-queue";
  const backLabel = isAuthor ? "Back to my courses" : "Back to review queue";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-sm text-ink-subtle hover:text-brand transition mb-1"
          >
            <Icon name="arrowLeft" size={15} /> {backLabel}
          </Link>
          <h1 className="mt-1 truncate text-2xl font-bold">{course.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`rounded px-2 py-0.5 font-semibold ${
                isPublished ? "bg-success-subtle text-success" : "bg-surface-sunken text-ink-muted"
              }`}
            >
              {course.status}
            </span>
            {blocked && (
              <span className="rounded bg-danger-subtle px-2 py-0.5 font-semibold text-danger">
                Blocked
              </span>
            )}
            <span className="text-ink-subtle">
              {course.stats?.lessonCount || 0} lessons · {course.stats?.enrolledCount || 0} enrolled
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAnalyticsModal(true)}
            className="rounded-control border border-brand-border bg-brand-subtle px-3.5 py-2 text-sm font-semibold text-brand-hover hover:bg-brand-muted"
          >
            📊 Analytics & Performance
          </button>
          <Link
            to={`/courses/${id}?from=editor`}
            state={{ from: "editor" }}
            className="rounded-control border border-line-strong px-4 py-2 text-sm hover:bg-surface-sunken"
          >
            Preview
          </Link>
          {canPublish && (
          <button
            type="button"
            onClick={togglePublish}
            disabled={blocked || (!isPublished && !approved)}
            title={isPublished ? undefined : publishBlockedReason}
            className={`rounded-control px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              isPublished ? "bg-ink-muted hover:bg-ink-muted" : "bg-brand hover:bg-brand-hover"
            }`}
          >
            {isPublished ? "Unpublish" : "Publish"}
          </button>
          )}
        </div>
      </div>

      {blocked && (
        <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">
          An administrator blocked this course
          {course.moderation.reason ? `: ${course.moderation.reason}` : "."} Contact your
          organization admin to resolve it.
        </div>
      )}
      {error && <div className="rounded-control bg-danger-subtle p-3 text-sm text-danger">{error}</div>}
      {notice && <div className="rounded-control bg-success-subtle p-3 text-sm text-success">{notice}</div>}

      {!isPublished && (
        <CourseReviewPanel
          courseId={id}
          user={user}
          review={review}
          onReviewChange={(next) => setCourse((prev) => ({ ...prev, review: next }))}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------------- details ---------------- */}
        <form onSubmit={saveDetails} className="space-y-4 rounded-surface border border-line bg-surface p-4 lg:col-span-1">
          <h2 className="font-semibold">Course details</h2>

          <div>
            <div className="aspect-video overflow-hidden rounded-control bg-gradient-to-br from-brand to-brand">
              {course.thumbnailUrl ? (
                <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-white/80">
            <Icon name="books" size={30} />
          </div>
              )}
            </div>
            <input
              ref={thumbInput}
              type="file"
              accept="image/*"
              onChange={(e) => handleThumbnail(e.target.files?.[0])}
              className="mt-2 block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-brand-subtle file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-hover"
            />
          </div>

          <label className="block text-xs font-medium text-ink-muted">
            Title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              maxLength={200}
              className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
            />
          </label>

          <label className="block text-xs font-medium text-ink-muted">
            Subtitle
            <input
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              maxLength={300}
              className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
            />
          </label>

          <label className="block text-xs font-medium text-ink-muted">
            Description
            <textarea
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-ink-muted">
              Category
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-ink-muted">
              Level
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
                className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l.replace("_", " ").toLowerCase()}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-ink-muted">
              Price
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-ink-muted">
              Currency
              <input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                maxLength={3}
                className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm uppercase"
              />
            </label>
          </div>

          <label className="block text-xs font-medium text-ink-muted">
            Tags <span className="font-normal text-ink-subtle">(one per line)</span>
            <textarea
              rows={3}
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
            />
          </label>

          <label className="block text-xs font-medium text-ink-muted">
            What learners will achieve <span className="font-normal text-ink-subtle">(one per line)</span>
            <textarea
              rows={3}
              value={form.outcomes}
              onChange={(e) => setForm({ ...form, outcomes: e.target.value })}
              className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
            />
          </label>

          <label className="block text-xs font-medium text-ink-muted">
            Requirements <span className="font-normal text-ink-subtle">(one per line)</span>
            <textarea
              rows={3}
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              className="mt-1 w-full rounded border border-line-strong px-2 py-1.5 text-sm"
            />
          </label>

          <div className="flex items-center justify-between pt-2">
            {canArchive ? (
              <button
                type="button"
                onClick={archive}
                className="text-xs font-medium text-danger hover:underline"
              >
                Archive course
              </button>
            ) : (
              <span />
            )}
            {canEdit && (
              <button
                type="submit"
                disabled={saving}
                className="rounded-control bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save details"}
              </button>
            )}
          </div>
        </form>

        {/* ---------------- curriculum ---------------- */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Curriculum</h2>
            <span className="text-xs text-ink-subtle">
              A course needs at least one lesson before it can be published.
            </span>
          </div>

          {(course.modules || []).map((module, i) => (
            <ModuleCard
              key={module.id}
              module={module}
              index={i}
              canMoveUp={i > 0}
              canMoveDown={i < (course.modules?.length || 0) - 1}
              onMove={(delta) => moveModule(i, delta)}
              onChanged={(updated) =>
                setCourse((prev) => ({
                  ...prev,
                  modules: prev.modules.map((m) => (m.id === updated.id ? updated : m)),
                }))
              }
              onDeleted={(moduleId) =>
                setCourse((prev) => ({
                  ...prev,
                  modules: prev.modules.filter((m) => m.id !== moduleId),
                }))
              }
              onReloadNeeded={load}
            />
          ))}

          {(course.modules || []).length === 0 && (
            <div className="rounded-surface border border-dashed border-line-strong p-8 text-center text-sm text-ink-subtle">
              No modules yet. Add your first one below.
            </div>
          )}

          <form onSubmit={createModule} className="flex gap-2">
            <input
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="New module title"
              maxLength={200}
              className="flex-1 rounded-control border border-line-strong px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={!newModuleTitle.trim()}
              className="rounded-control bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink disabled:opacity-50"
            >
              Add module
            </button>
          </form>

          <CourseMockTests courseId={id} />

          <CourseLiveSessions courseId={id} />

          <CourseAnnouncements courseId={id} />

          <CourseStudents courseId={id} />
        </div>
      </div>

      {showAnalyticsModal && (
        <CourseAnalyticsModal
          course={course}
          onClose={() => setShowAnalyticsModal(false)}
        />
      )}
    </div>
  );
}
