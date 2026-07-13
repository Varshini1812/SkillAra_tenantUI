export const TENANT_PERMISSION_MODULES = [
  { id: "dashboard", label: "Dashboard", actions: ["view", "export"] },
  { id: "users", label: "Users", actions: ["view", "create", "edit", "delete", "assign", "export", "import", "manage"] },
  { id: "roles", label: "Roles & Permissions", actions: ["view", "create", "edit", "delete", "clone", "assign", "configure", "manage"] },
  { id: "courses", label: "Courses", actions: ["view", "create", "edit", "delete", "publish", "archive", "assign", "export"] },
  { id: "course-categories", label: "Course Categories", actions: ["view", "create", "edit", "delete", "manage"] },
  { id: "course-modules", label: "Course Modules", actions: ["view", "create", "edit", "delete", "publish", "archive"] },
  { id: "lessons", label: "Lessons", actions: ["view", "create", "edit", "delete", "publish", "archive"] },
  { id: "assignments", label: "Assignments", actions: ["view", "create", "edit", "delete", "assign", "approve", "export"] },
  { id: "question-bank", label: "Question Bank", actions: ["view", "create", "edit", "delete", "import", "export", "manage"] },
  { id: "quizzes", label: "Quizzes", actions: ["view", "create", "edit", "delete", "publish", "assign"] },
  { id: "mock-tests", label: "Mock Tests", actions: ["view", "create", "edit", "delete", "publish", "assign"] },
  { id: "certificates", label: "Certificates", actions: ["view", "create", "edit", "delete", "approve", "export"] },
  { id: "mentorship", label: "Mentorship", actions: ["view", "create", "edit", "delete", "assign", "manage"] },
  { id: "students", label: "Students", actions: ["view", "create", "edit", "delete", "assign", "export"] },
  { id: "instructors", label: "Instructors", actions: ["view", "create", "edit", "delete", "assign", "manage"] },
  { id: "mentors", label: "Mentors", actions: ["view", "create", "edit", "delete", "assign"] },
  { id: "community", label: "Community", actions: ["view", "create", "edit", "delete", "moderate", "manage"] },
  { id: "forum", label: "Forum", actions: ["view", "create", "edit", "delete", "approve", "moderate"] },
  { id: "notifications", label: "Notifications", actions: ["view", "create", "edit", "configure", "manage"] },
  { id: "reports", label: "Reports", actions: ["view", "export", "configure"] },
  { id: "analytics", label: "Analytics", actions: ["view", "export", "configure"] },
  { id: "org-settings", label: "Organization Settings", actions: ["view", "edit", "configure", "manage"] },
  { id: "branding", label: "Branding", actions: ["view", "edit", "configure"] },
  { id: "security", label: "Security", actions: ["view", "configure", "manage"] },
  { id: "audit-logs", label: "Audit Logs", actions: ["view", "export"] },
];

export function countTenantPermissions(permissions = {}) {
  return Object.values(permissions).reduce((sum, actions) => sum + (actions?.length || 0), 0);
}

function fullTenantPermissions() {
  const perms = {};
  TENANT_PERMISSION_MODULES.forEach((m) => {
    perms[m.id] = [...m.actions];
  });
  return perms;
}

function readOnlyTenantPermissions() {
  const perms = {};
  TENANT_PERMISSION_MODULES.forEach((m) => {
    if (m.actions.includes("view")) perms[m.id] = ["view"];
  });
  return perms;
}

function instructorPermissions() {
  return {
    dashboard: ["view"],
    courses: ["view", "create", "edit", "publish", "archive"],
    "course-modules": ["view", "create", "edit", "publish"],
    lessons: ["view", "create", "edit", "publish"],
    assignments: ["view", "create", "edit", "assign", "approve"],
    quizzes: ["view", "create", "edit", "publish", "assign"],
    students: ["view", "assign"],
    instructors: ["view"],
    mentorship: ["view", "assign"],
    notifications: ["view", "create"],
    reports: ["view", "export"],
    analytics: ["view"],
  };
}

function studentPermissions() {
  return {
    dashboard: ["view"],
    courses: ["view"],
    lessons: ["view"],
    assignments: ["view"],
    quizzes: ["view"],
    "mock-tests": ["view"],
    certificates: ["view"],
    mentorship: ["view"],
    community: ["view", "create"],
    forum: ["view", "create"],
    notifications: ["view"],
  };
}

export const TENANT_SYSTEM_ROLES = [
  {
    id: "org-admin",
    slug: "ORG_ADMIN",
    name: "Organization Admin",
    description: "Manages users, roles, courses, and organization settings.",
    roleType: "system",
    status: "active",
    createdBy: "System",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    usersAssigned: 0,
    permissions: {
      ...readOnlyTenantPermissions(),
      users: ["view", "create", "edit", "assign", "export", "manage"],
      roles: ["view", "create", "edit", "clone", "assign"],
      courses: ["view", "create", "edit", "delete", "publish", "archive", "assign"],
      "org-settings": ["view", "edit", "configure"],
      branding: ["view", "edit"],
      reports: ["view", "export"],
      analytics: ["view"],
      "audit-logs": ["view", "export"],
    },
    protected: true,
    apiRole: "ORG_ADMIN",
  },
  {
    id: "instructor",
    slug: "INSTRUCTOR",
    name: "Instructor",
    description: "Creates and delivers courses, assignments, and quizzes.",
    roleType: "system",
    status: "active",
    createdBy: "System",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    usersAssigned: 0,
    permissions: instructorPermissions(),
    protected: true,
    apiRole: "TUTOR",
  },
  {
    id: "teaching-assistant",
    slug: "TEACHING_ASSISTANT",
    name: "Teaching Assistant",
    description: "Supports instructors with content and student management.",
    roleType: "system",
    status: "active",
    createdBy: "System",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    usersAssigned: 0,
    permissions: {
      dashboard: ["view"],
      courses: ["view", "edit"],
      lessons: ["view", "create", "edit"],
      assignments: ["view", "edit", "assign"],
      quizzes: ["view", "edit"],
      students: ["view", "assign"],
    },
    protected: true,
    apiRole: "TUTOR",
  },
  {
    id: "mentor",
    slug: "MENTOR",
    name: "Mentor",
    description: "Guides students through mentorship sessions.",
    roleType: "system",
    status: "active",
    createdBy: "System",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    usersAssigned: 0,
    permissions: {
      dashboard: ["view"],
      mentorship: ["view", "create", "edit", "assign", "manage"],
      students: ["view", "assign"],
      notifications: ["view", "create"],
    },
    protected: true,
    apiRole: "TUTOR",
  },
  {
    id: "student",
    slug: "STUDENT",
    name: "Student",
    description: "Enrolls in courses and tracks learning progress.",
    roleType: "system",
    status: "active",
    createdBy: "System",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    usersAssigned: 0,
    permissions: studentPermissions(),
    protected: true,
    apiRole: "STUDENT",
  },
  {
    id: "finance",
    slug: "FINANCE",
    name: "Finance",
    description: "Access to billing, invoices, and financial reports.",
    roleType: "system",
    status: "active",
    createdBy: "System",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    usersAssigned: 0,
    permissions: {
      dashboard: ["view"],
      reports: ["view", "export"],
      analytics: ["view", "export"],
      "org-settings": ["view"],
    },
    protected: true,
    apiRole: null,
  },
  {
    id: "support",
    slug: "SUPPORT",
    name: "Support",
    description: "Handles user support and community moderation.",
    roleType: "system",
    status: "active",
    createdBy: "System",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    usersAssigned: 0,
    permissions: {
      dashboard: ["view"],
      users: ["view"],
      students: ["view"],
      community: ["view", "moderate", "manage"],
      forum: ["view", "moderate", "approve"],
      notifications: ["view", "create"],
    },
    protected: true,
    apiRole: null,
  },
  {
    id: "content-reviewer",
    slug: "CONTENT_REVIEWER",
    name: "Content Reviewer",
    description: "Reviews and approves course content before publishing.",
    roleType: "system",
    status: "active",
    createdBy: "System",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    usersAssigned: 0,
    permissions: {
      dashboard: ["view"],
      courses: ["view", "approve", "archive"],
      lessons: ["view", "approve"],
      assignments: ["view", "approve"],
      quizzes: ["view", "approve"],
      "mock-tests": ["view", "approve"],
      certificates: ["view", "approve"],
    },
    protected: true,
    apiRole: null,
  },
];

export const TENANT_ROLES_STORAGE_KEY = "skillara_tenant_roles_v1";
export const TENANT_USER_PROFILES_KEY = "skillara_tenant_user_profiles_v1";
export const TENANT_AUDIT_LOG_KEY = "skillara_tenant_audit_v1";

export const USER_STATUSES = ["ACTIVE", "INACTIVE", "PENDING", "BLOCKED"];

export function getRoleById(roles, id) {
  return roles.find((r) => r.id === id);
}

export function mapApiRoleToTenantRoleId(apiRole) {
  const map = {
    ORG_ADMIN: "org-admin",
    TUTOR: "instructor",
    STUDENT: "student",
  };
  return map[apiRole] || null;
}

export function mapTenantRoleToApiRole(role) {
  return role?.apiRole || null;
}
