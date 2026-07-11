# SkillAra Client

React frontend for **learners** and **organization administrators** on a tenant subdomain. One app serves both experiences: students use the main routes; owners and org admins use `/admin`.

## Who uses this app

| User | URL | Purpose |
|------|-----|---------|
| Anyone | `http://localhost:5173/login` | Find workspace (enter subdomain) |
| Student / instructor | `http://{subdomain}.localhost:5173` | Courses, learning, my learning |
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
| `/` | Home |
| `/courses` | Course catalog |
| `/courses/:id` | Course detail |
| `/learn/:courseId` | Lesson player |
| `/my-learning` | Enrolled courses |

### Organization admin (`/admin`)

Requires tenant admin portal role (`TENANT_ADMIN`, `ORG_ADMIN`, or organization owner).

| Path | Page |
|------|------|
| `/admin` | Dashboard |
| `/admin/users` | User management (create, edit, import, filters) |
| `/admin/roles` | Roles & permissions |
| `/admin/master-data` | Departments & designations |
| `/admin/profile` | Owner profile & ownership transfer |

### Auth

| Path | Page |
|------|------|
| `/login` | Tenant login (or workspace finder on root host) |
| `/register` | Invite-based registration |

## Features

### User management

- CRUD with `roleId`, `departmentId`, `designationId` (API-backed dropdowns)
- Organization owner hidden from employee list; managed via platform admin when creating org
- Only **organization owner** may assign **Organization Admin** role
- CSV import with sample download generated from live roles/departments

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
