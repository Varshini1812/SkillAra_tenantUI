/**
 * Client-side view of the tenant RBAC model.
 *
 * The server sends `user.permissions` — a map of { moduleId: [actions] } taken from
 * the user's tenant role — on /api/auth/login and /api/auth/me. Everything here is
 * presentation only: it decides which navigation entries and buttons to render.
 * The API re-checks every action independently, so a tampered client gains nothing.
 *
 * Module ids and action names mirror data/permissionCatalog.js on the server.
 */

export const ROLE = {
  TENANT_ADMIN: "TENANT_ADMIN",
  ORG_ADMIN: "ORG_ADMIN",
  TUTOR: "TUTOR",
  STUDENT: "STUDENT",
  LEARNER: "LEARNER",
};

/** Roles that manage the organization rather than consume it. */
const STAFF_ROLES = new Set([ROLE.TENANT_ADMIN, ROLE.ORG_ADMIN]);

export function getUserRole(user) {
  if (!user) return null;
  if (user.isTenantAdmin) return ROLE.TENANT_ADMIN;
  return String(user.role || "").toUpperCase() || null;
}

export function isStaff(user) {
  return STAFF_ROLES.has(getUserRole(user));
}

export function isInstructor(user) {
  return getUserRole(user) === ROLE.TUTOR;
}

export function isLearner(user) {
  const role = getUserRole(user);
  return !role || role === ROLE.STUDENT || role === ROLE.LEARNER;
}

/**
 * Anyone who can author course content.
 *
 * Asks the permission rather than the role tier: Instructor, Mentor, Teaching Assistant,
 * Support and Content Reviewer all report TUTOR, and only some of them author anything.
 */
export function canAuthorCourses(user) {
  return can(user, "courses", "create");
}

/**
 * True when the user's role grants `action` on `moduleId`.
 * The organization owner is allowed everything without consulting the map, because
 * ownership is a property of the account rather than of a permission list.
 */
export function can(user, moduleId, action = "view") {
  if (!user) return false;
  if (user.isTenantAdmin || getUserRole(user) === ROLE.TENANT_ADMIN) return true;

  const actions = user.permissions?.[moduleId];
  if (!Array.isArray(actions)) return false;
  return actions.includes(action) || actions.includes("manage");
}

/** True when the user has any of the listed actions on the module. */
export function canAny(user, moduleId, actions = ["view"]) {
  return actions.some((action) => can(user, moduleId, action));
}

export const ROLE_LABELS = {
  [ROLE.TENANT_ADMIN]: "Organization Owner",
  [ROLE.ORG_ADMIN]: "Organization Admin",
  [ROLE.TUTOR]: "Instructor",
  [ROLE.STUDENT]: "Student",
};

export const ROLE_DESCRIPTIONS = {
  [ROLE.TENANT_ADMIN]: "Full control of the organization, its people, and its catalog.",
  [ROLE.ORG_ADMIN]: "Manages users, roles, and moderates the course catalog.",
  [ROLE.TUTOR]: "Creates courses, uploads lessons and video, and grades learners.",
  [ROLE.STUDENT]: "Enrolls in courses, watches lessons, and tracks progress.",
};

export function getRoleLabel(user) {
  const role = getUserRole(user);
  return user?.roleName || ROLE_LABELS[role] || role || "—";
}

export function getRoleBadgeClass(userOrRole) {
  const role = typeof userOrRole === "string" ? userOrRole : getUserRole(userOrRole);
  const styles = {
    [ROLE.TENANT_ADMIN]: "bg-brand-subtle text-brand-hover ring-brand-border",
    [ROLE.ORG_ADMIN]: "bg-brand-subtle text-brand-hover ring-brand-border",
    [ROLE.INSTRUCTOR]: "bg-warning-subtle text-warning ring-warning-border",
    [ROLE.MENTOR]: "bg-success-subtle text-success ring-success-border",
    [ROLE.STUDENT]: "bg-surface-sunken text-ink-muted ring-line",
  };
  return styles[role] || "bg-surface-sunken text-ink-muted ring-line";
}

/**
 * Main app navigation, grouped for the sidebar and filtered by role.
 * `requires` is [moduleId, action]; `roles` restricts to specific roles.
 * Entries with neither are shown to everyone signed in.
 */
const APP_NAV = [
  {
    section: "Learn",
    items: [
      { to: "/dashboard", label: "My Dashboard", icon: "home" },
      { to: "/courses", label: "Browse courses", icon: "courses" },
      { to: "/my-learning", label: "My learning", icon: "learning", requires: ["courses", "view"] },
    ],
  },
  {
    section: "Community",
    items: [
      { to: "/ai-tools", label: "AI Tools", icon: "ai" },
      { to: "/mentorship", label: "Mentorship", icon: "mentors", requires: ["mentorship", "view"] },
      { to: "/mock-interviews", label: "Mock Interviews", icon: "sessions", requires: ["mock-interviews", "view"] },
      { to: "/mock-tests", label: "Mock Tests", icon: "quiz", requires: ["mock-tests", "view"] },
      { to: "/live-sessions", label: "Live Sessions", icon: "live", requires: ["live-sessions", "view"] },
      { to: "/forum", label: "Forum", icon: "forum" },
    ],
  },
  {
    section: "Teach",
    items: [
      { to: "/teach", label: "My courses", icon: "teach", requires: ["courses", "create"] },
      { to: "/review-queue", label: "Review queue", icon: "moderate", requires: ["courses", "approve"] },
    ],
  },
  {
    section: "Manage",
    items: [
      { to: "/admin", label: "Admin panel", icon: "admin", gate: "admin" },
      { to: "/admin/courses", label: "Moderate courses", icon: "moderate", requires: ["courses", "moderate"] },
    ],
  },
  {
    section: "Account",
    items: [
      { to: "/notifications", label: "Notifications", icon: "notifications" },
      { to: "/profile", label: "My profile", icon: "profile" },
    ],
  },
];

function itemVisible(user, item) {
  const role = getUserRole(user);
  if (item.roles && !item.roles.includes(role)) return false;
  if (item.gate === "admin" && !canAccessAdminPanel(user)) return false;
  if (item.requires && !can(user, item.requires[0], item.requires[1])) return false;
  return true;
}

/** Grouped sidebar navigation. Empty sections are dropped. */
export function getAppNav(user) {
  if (!user) {
    return [{ section: "Learn", items: [{ to: "/courses", label: "Browse courses", icon: "courses" }] }];
  }

  return APP_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => itemVisible(user, item)),
  })).filter((group) => group.items.length > 0);
}

/** Flat list, used by the compact mobile menu. */
export function getFlatAppNav(user) {
  return getAppNav(user).flatMap((group) => group.items);
}

/**
 * Admin-panel navigation. Each entry names the permission that unlocks it, so a
 * custom role created in Roles & Permissions automatically gets the right menu.
 */
const ADMIN_NAV = [
  {
    section: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: "dashboard", end: true, requires: ["dashboard", "view"] }],
  },
  {
    section: "Learning",
    items: [
      { to: "/admin/courses", label: "Courses", icon: "courses", requires: ["courses", "moderate"] },
      { to: "/admin/enrollment-requests", label: "Access requests", icon: "enrollments", requires: ["learners", "assign"] },
      { to: "/admin/content-reviews", label: "Content reviews", icon: "review", requires: ["courses", "approve"] },
      { to: "/admin/monitoring", label: "Community monitoring", icon: "monitoring", requires: ["community", "moderate"] },
      { to: "/admin/mentorship", label: "Mentorship queue", icon: "mentors", requires: ["mentorship", "manage"] },
    ],
  },
  {
    section: "People",
    items: [
      { to: "/admin/users", label: "Users", icon: "users", requires: ["users", "view"] },
      { to: "/admin/roles", label: "Roles & permissions", icon: "roles", requires: ["roles", "view"] },
    ],
  },
  {
    section: "Organization",
    items: [
      { to: "/admin/master-data", label: "Master data", icon: "master-data", requires: ["org-settings", "view"] },
    ],
  },
];

/**
 * Permissions that admit someone to the admin panel. Every one is administrative — none is
 * part of the baseline every colleague holds — so the gate cannot be satisfied just by being
 * signed in. The organization owner always passes.
 */
const ADMIN_GATE = [
  ["users", "view"],
  ["roles", "view"],
  ["org-settings", "view"],
  ["courses", "moderate"],
  ["community", "moderate"],
  ["mentorship", "manage"],
  ["audit-logs", "view"],
];

export function canAccessAdminPanel(user) {
  if (!user) return false;
  if (user.isTenantAdmin || getUserRole(user) === ROLE.TENANT_ADMIN) return true;
  return ADMIN_GATE.some(([moduleId, action]) => can(user, moduleId, action));
}

export function getAdminNav(user) {
  return ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.requires || can(user, item.requires[0], item.requires[1])),
  })).filter((group) => group.items.length > 0);
}

/**
 * Flatten the permission map into rows for a "what you can do" panel.
 * @returns {{module: string, label: string, actions: string[]}[]}
 */
export function describePermissions(user) {
  const permissions = user?.permissions || {};
  return Object.entries(permissions)
    .filter(([, actions]) => Array.isArray(actions) && actions.length > 0)
    .map(([module, actions]) => ({
      module,
      label: MODULE_LABELS[module] || module.replace(/-/g, " "),
      actions: [...actions],
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export const MODULE_LABELS = {
  dashboard: "Dashboard",
  users: "Users",
  roles: "Roles & Permissions",
  courses: "Courses",
  "course-categories": "Course Categories",
  "course-modules": "Course Modules",
  lessons: "Lessons",
  assignments: "Assignments",
  "question-bank": "Question Bank",
  quizzes: "Quizzes",
  "mock-tests": "Mock Tests",
  "mock-interviews": "Mock Interviews",
  "live-sessions": "Live Sessions",
  certificates: "Certificates",
  mentorship: "Mentorship",
  learners: "Learners",
  instructors: "Instructors",
  mentors: "Mentors",
  community: "Community",
  forum: "Forum",
  notifications: "Notifications",
  reports: "Reports",
  analytics: "Analytics",
  "org-settings": "Organization Settings",
  branding: "Branding",
  security: "Security",
  "audit-logs": "Audit Logs",
};
