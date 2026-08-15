# SkillAra Client

> For how the three SkillAra apps fit together, see the
> [workspace README](../README.md).

React frontend for **learners** and **organization administrators** on a tenant subdomain. One app serves both experiences: students use the main routes; owners and org admins use `/admin`.

## Who uses this app

| User | URL | Purpose |
|------|-----|---------|
| Anyone | `http://localhost:5173/login` | Find workspace (enter subdomain) |
| New student | `http://{subdomain}.localhost:5173/signup` | Self-registration — creates a Student account and signs in |
| Student | `http://{subdomain}.localhost:5173` | Browse courses, watch lessons, track progress |
| Instructor | `http://{subdomain}.localhost:5173/teach` | Create courses, upload video/PDF, publish |
| Organization owner / org admin | `http://{subdomain}.localhost:5173/admin` | Users, roles, master data, profile |

Platform super admins use **SkillAra_adminpanel** on `localhost:5174` instead.

## Login flow

1. Open `http://localhost:5173/login` and enter a workspace name (e.g. `acmebootcamp`)
2. App validates the tenant via the API
3. Redirect to `http://acmebootcamp.localhost:5173/login`
4. Sign in with email and password scoped to that organization
5. Organization owners/admins navigate to `/admin` after login

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Requires **SkillAra_server** on port **5000**.

Create a tenant first via the platform admin panel, then use the owner credentials on the tenant subdomain.

## Environment

```env
VITE_ROOT_DOMAIN=skillara.com
VITE_API_URL=
```

| Variable | Description |
|----------|-------------|
| `VITE_ROOT_DOMAIN` | Root domain for subdomain URL building |
| `VITE_API_URL` | Leave **empty** in dev — Vite proxies `/api` and sets `X-Tenant-Subdomain` from `*.localhost` hosts |

## Routes

### Student (authenticated)

| Path | Page |
|------|------|
| `/` | Home (includes a "Your access" panel listing the role's permissions) |
| `/courses` | Course catalog |
| `/courses/:id` | Course detail — locked lessons show a padlock, previews are playable |
| `/learn/:courseId` | Lesson player |
| `/my-learning` | Enrolled courses |

### Instructor (`/teach`)

Requires `courses: create` permission — instructors, org admins, and the owner.

| Path | Page |
|------|------|
| `/teach` | My courses — create, filter by status |
| `/teach/:id` | Course editor: details, thumbnail, curriculum, publish |

**Instructor preview:** opening your own course under `/learn/:courseId` works without an
enrolment. A banner marks it as preview mode, and completions you record there are kept
off the learner analytics.

**Where instructors upload video:** `/teach` → open a course → add a module → add a
lesson → click the lesson title to expand it → the **Lesson media** file picker. Files
under 45 MB are proxied through the API; larger video uploads straight to Backblaze B2
via a presigned URL, with a progress bar either way.

### Organization admin (`/admin`)

Requires tenant admin portal role (`TENANT_ADMIN`, `ORG_ADMIN`, or organization owner).

| Path | Page |
|------|------|
| `/admin` | Dashboard |
| `/admin/courses` | Course catalog moderation — unpublish or block any course in the tenant |
| `/admin/users` | User management (create, edit, import, filters) |
| `/admin/roles` | Roles & permissions |
| `/admin/master-data` | Departments & designations |
| `/admin/profile` | Owner profile & ownership transfer |

### Account

| Path | Page |
|------|------|
| `/profile` | Profile — editable name/phone, org details, and a full permission list |

### Auth

| Path | Page |
|------|------|
| `/login` | Tenant login (or workspace finder on root host) |
| `/signup` | Open student self-registration |
| `/register` | Invite-based registration (staff accounts) |

## How students join

Two paths, both supported:

1. **Self sign-up** — `/signup` creates a Student account and signs them straight in.
   They then enrol themselves from the catalog. An org admin can disable this per tenant
   (`Tenant.allowStudentSignup`).
2. **Admin adds them** — staff create the user in `/admin/users`, then enrol them from
   the course editor's **Students** panel, so the learner signs in already enrolled.

The Students panel also shows the live roster with each learner's completion count and
mastery percentage.

## Layout

Every signed-in role gets the same shell: a **static left sidebar** for navigation and a
scrolling content area on the right. The sidebar collapses to an icon rail (persisted in
localStorage) and slides in as an overlay on mobile.

Sidebar sections are built from the user's permission map, so each role sees only what
it can use:

| Section | Shown to |
|---------|----------|
| Learn — Home, Browse courses, My learning | Everyone |
| Teach — My courses | Anyone with `courses: create` |
| Manage — Admin panel, Moderate courses | Organization owner and org admins |
| Account — My profile | Everyone |

## Features

### User management

- CRUD with `roleId`, `departmentId`, `designationId` (API-backed dropdowns)
- Organization owner hidden from employee list; managed via platform admin when creating org
- Only **organization owner** may assign **Organization Admin** role
- CSV import with sample download generated from live roles/departments

### Role-aware navigation

The API returns the signed-in user's permission map (`{ moduleId: [actions] }`) on
`/api/auth/login` and `/api/auth/me`. `src/utils/permissions.js` turns that into
navigation and capability checks:

| Role | Sees in the navbar | Sidebar (`/admin`) |
|------|--------------------|--------------------|
| Student | Courses, My Learning | — |
| Instructor | Courses, Teach | — |
| Org Admin | Courses, Teach, Admin | Dashboard, Courses, Users, Roles, Master data |
| Organization Owner | Courses, Teach, Admin | All of the above |

`getAdminNav(user)` filters each entry by the permission it needs, so a **custom role**
created in Roles & Permissions automatically gets the right menu with no code change.

These checks are presentation only — the API re-authorizes every request, so a
tampered client gains nothing.

### Course authoring

- Create/edit course details, thumbnail, tags, outcomes, requirements
- Modules and lessons with up/down reordering (persisted via reorder endpoints)
- Lesson media upload to Backblaze B2, plus per-lesson attachments
- **Free preview** toggle makes a lesson playable without enrolling
- Publish is blocked until the course has at least one lesson
- A course blocked by an admin shows the reason and cannot be re-published

### Roles & permissions

- Loads roles from `/api/roles`
- Permission modules from `/api/roles/permission-modules`
- System vs custom roles; clone, enable/disable, delete custom roles

### Master data

- Categories from `/api/master-data/categories`
- Departments and designations per tenant (seeded on tenant creation)

All master-data and role options come from the API — no hardcoded dropdown values.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port **5173** |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | oxlint |

## Auth & debugging

- Access token stored in memory (`adminAccessTokenMemory` for admin routes)
- Refresh token in httpOnly cookie
- In **development**, org-owner auth issues log to the console under `[SkillAra:tenant-auth]` when using user management

## Source layout

```
src/
├── admin/                  # Organization admin module
│   ├── pages/              # UserManagement, TenantRolesPermissions, MasterDataManagement, …
│   ├── hooks/              # useTenantRoles, useTenantMasterData
│   ├── components/
│   └── api/
├── pages/                  # Student-facing pages
│   └── instructor/         # MyCourses, CourseEditor
├── components/teach/       # ModuleCard, LessonRow, CourseStudents (roster)
├── components/AppSidebar.jsx  # Role-aware navigation for all signed-in users
├── components/
├── context/                # AuthContext, AdminAuthContext
└── api/
```

## Related docs

- [Root README](../README.md)
- [SkillAra_adminpanel README](../SkillAra_adminpanel/README.md) — platform super admin
- [SkillAra_server README](../SkillAra_server/README.md) — API
- [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md)

## License

Private — add a license before open-sourcing if needed.
