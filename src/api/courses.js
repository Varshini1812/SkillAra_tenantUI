import api, { getData } from "./client.js";

/* --------------------------------- catalog --------------------------------- */

/** @returns {Promise<{items: object[], pagination: object}>} */
export async function fetchCourses(params = {}) {
  const res = await api.get("/api/courses", { params });
  return { items: getData(res) || [], pagination: res.data?.pagination || {} };
}

export async function fetchCourse(id) {
  const res = await api.get(`/api/courses/${id}`);
  return getData(res);
}

/* -------------------------------- authoring -------------------------------- */

export async function createCourse(payload) {
  const res = await api.post("/api/courses", payload);
  return getData(res);
}

export async function updateCourse(id, payload) {
  const res = await api.patch(`/api/courses/${id}`, payload);
  return getData(res);
}

export async function deleteCourse(id) {
  const res = await api.delete(`/api/courses/${id}`);
  return getData(res);
}

export async function publishCourse(id) {
  const res = await api.post(`/api/courses/${id}/publish`);
  return getData(res);
}

export async function unpublishCourse(id) {
  const res = await api.post(`/api/courses/${id}/unpublish`);
  return getData(res);
}

/* ------------------------------ content review ------------------------------ */

/**
 * A course must be approved by a content reviewer before it can be published.
 * The reviewer list comes from the permission matrix (anyone granted courses:approve),
 * so renamed or cloned reviewer roles work without a client change.
 */
export async function fetchCourseReviewers() {
  const res = await api.get("/api/courses/reviewers");
  return getData(res)?.reviewers || [];
}

/**
 * Courses waiting on the signed-in reviewer. Pass "ALL" for the admin monitoring view:
 * moderators then see every course in review, sent back, or approved-but-unpublished.
 */
export async function fetchReviewQueue(status) {
  const res = await api.get("/api/courses/review-queue", { params: { status } });
  return getData(res)?.courses || [];
}

export async function fetchCourseReview(id) {
  const res = await api.get(`/api/courses/${id}/review`);
  return getData(res);
}

export async function submitCourseForReview(id, { reviewerId, note }) {
  const res = await api.post(`/api/courses/${id}/submit-review`, { reviewerId, note });
  return getData(res);
}

/** Reviewer sends the course back with what needs fixing. The note is required. */
export async function requestCourseChanges(id, note) {
  const res = await api.post(`/api/courses/${id}/review/request-changes`, { note });
  return getData(res);
}

export async function approveCourseReview(id, note) {
  const res = await api.post(`/api/courses/${id}/review/approve`, { note });
  return getData(res);
}

/** Tenant admin / org admin only. */
export async function blockCourse(id, reason) {
  const res = await api.post(`/api/courses/${id}/block`, { reason });
  return getData(res);
}

export async function unblockCourse(id) {
  const res = await api.post(`/api/courses/${id}/unblock`);
  return getData(res);
}

export async function uploadCourseThumbnail(id, file, onProgress) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post(`/api/courses/${id}/thumbnail`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: progressHandler(onProgress),
  });
  return getData(res);
}

/* --------------------------------- modules --------------------------------- */

export async function addModule(courseId, payload) {
  const res = await api.post(`/api/courses/${courseId}/modules`, payload);
  return getData(res);
}

export async function updateModule(moduleId, payload) {
  const res = await api.patch(`/api/courses/modules/${moduleId}`, payload);
  return getData(res);
}

export async function deleteModule(moduleId) {
  const res = await api.delete(`/api/courses/modules/${moduleId}`);
  return getData(res);
}

export async function reorderModules(courseId, moduleIds) {
  const res = await api.put(`/api/courses/${courseId}/modules/reorder`, { moduleIds });
  return getData(res);
}

/* --------------------------------- lessons --------------------------------- */

export async function addLesson(moduleId, payload) {
  const res = await api.post(`/api/courses/modules/${moduleId}/lessons`, payload);
  return getData(res);
}

export async function updateLesson(lessonId, payload) {
  const res = await api.patch(`/api/courses/lessons/${lessonId}`, payload);
  return getData(res);
}

export async function deleteLesson(lessonId) {
  const res = await api.delete(`/api/courses/lessons/${lessonId}`);
  return getData(res);
}

export async function reorderLessons(moduleId, lessonIds) {
  const res = await api.put(`/api/courses/modules/${moduleId}/lessons/reorder`, { lessonIds });
  return getData(res);
}

/** Short-lived signed URL for playback or download. Re-fetch when it expires. */
export async function getLessonPlaybackUrl(lessonId, attachmentId) {
  const res = await api.get(`/api/courses/lessons/${lessonId}/play`, {
    params: attachmentId ? { attachmentId } : undefined,
  });
  return getData(res);
}

/* ------------------------------ lesson uploads ------------------------------ */

function progressHandler(onProgress) {
  if (!onProgress) return undefined;
  return (event) => {
    if (!event.total) return;
    onProgress(Math.round((event.loaded / event.total) * 100));
  };
}

/** Files above this size skip the server and go straight to Backblaze B2. */
export const DIRECT_UPLOAD_THRESHOLD_BYTES = 45 * 1024 * 1024;

async function uploadLessonContentViaServer(lessonId, file, onProgress) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post(`/api/courses/lessons/${lessonId}/content`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: progressHandler(onProgress),
  });
  return getData(res);
}

/**
 * Two-step direct upload: ask the API for a presigned PUT URL, send the bytes
 * straight to B2, then have the server confirm the object landed before it trusts
 * the key. Keeps multi-hundred-megabyte video off the application server entirely.
 */
async function uploadLessonContentDirect(lessonId, file, onProgress) {
  const signed = getData(
    await api.post(`/api/courses/lessons/${lessonId}/upload-url`, {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    })
  );

  await new Promise((resolve, reject) => {
    // XHR rather than fetch: it reports upload progress, which fetch still cannot.
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signed.url, true);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed with status ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.send(file);
  });

  const res = await api.post(`/api/courses/lessons/${lessonId}/upload-complete`, {
    key: signed.key,
    mimeType: file.type,
  });
  return getData(res);
}

/** Picks the proxied or direct path based on file size. */
export async function uploadLessonContent(lessonId, file, onProgress) {
  if (file.size > DIRECT_UPLOAD_THRESHOLD_BYTES) {
    return uploadLessonContentDirect(lessonId, file, onProgress);
  }
  return uploadLessonContentViaServer(lessonId, file, onProgress);
}

export async function addLessonAttachment(lessonId, file, onProgress) {
  const form = new FormData();
  form.append("file", file);
  const res = await api.post(`/api/courses/lessons/${lessonId}/attachments`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: progressHandler(onProgress),
  });
  return getData(res);
}

export async function deleteLessonAttachment(lessonId, attachmentId) {
  const res = await api.delete(`/api/courses/lessons/${lessonId}/attachments/${attachmentId}`);
  return getData(res);
}
