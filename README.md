# SkillAra Client

React frontend for students on the SkillAra learning platform.

## Login flow

1. Root domain (`localhost:5173/login`) — enter workspace name
2. System validates the workspace exists
3. Redirect to `{workspace}.localhost:5173/login`
4. Sign in with email/password scoped to that organization

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Requires the API server running on port 5000.

## Environment

```env
VITE_ROOT_DOMAIN=skillara.com
VITE_API_URL=
```

## Documentation

See the root project docs:

- [README.md](../README.md) — overview & quick start
- [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) — architecture and development status
