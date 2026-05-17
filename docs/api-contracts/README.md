# Glimmora API Contracts — Backend Developer Guide

## Overview

This frontend is a complete, working application powered by **MSW (Mock Service Worker)** — a browser-level API mock layer. The MSW handlers define the **exact API specification** that the backend must implement.

**The frontend works completely standalone with mock data. Your job as a backend developer is to build real endpoints that match the mock handlers' behavior.**

## How to Read the API Spec

Every API endpoint is defined in three places:

1. **TypeScript Types** (`src/lib/api/types/`) — The canonical request/response shapes
2. **MSW Handlers** (`src/mocks/handlers/`) — The behavior specification (URL, method, auth, validation, response)
3. **Endpoint Registry** (`src/lib/api/endpoints.ts`) — All paths in one file (if created)

### Reading a Handler

```typescript
// src/mocks/handlers/student.handlers.ts
http.get("/api/students/me/dashboard", async ({ request }) => {
  await delay(400);
  // ^ Simulated latency — your endpoint should respond within 500ms

  // Authentication check
  const authHeader = request.headers.get("Authorization");
  // ^ Frontend sends: Authorization: Bearer <token>
  // ^ Return 401 if missing/invalid

  // Response
  return HttpResponse.json({ data: dashboard });
  // ^ Response shape: { data: StudentDashboard }
  // ^ See src/lib/api/types/student.types.ts for StudentDashboard interface
});
```

## Standard API Envelope

Every response follows this format:

```typescript
// Success (single item)
{ "data": { ... } }

// Success (list with pagination)
{ "data": [...], "meta": { "page": 1, "pageSize": 20, "total": 150, "totalPages": 8 } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": { "fieldName": ["error message"] } } }
```

## Authentication

- Frontend sends `Authorization: Bearer <token>` header on every request
- The API client (`src/lib/api/client.ts`) automatically injects the token
- Return `401` with `{ error: { code: "UNAUTHORIZED", message: "..." } }` for invalid tokens

## HTTP Status Codes Used

| Code | When |
|------|------|
| 200 | Success |
| 401 | Missing/invalid auth token |
| 404 | Resource not found |
| 422 | Validation error (field-level details in `error.details`) |
| 500 | Server error |

## Pagination Convention

List endpoints accept query params:
- `page` (default: 1)
- `pageSize` (default: 20)
- Return `meta` object with `page`, `pageSize`, `total`, `totalPages`

## Search/Filter Convention

- `search` — Full-text search across relevant fields
- Other filters are endpoint-specific (see handler for each)
- Filters are additive (AND logic)

## Endpoints by Portal

### Auth (`src/mocks/handlers/auth.handlers.ts`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout (invalidate token) |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Student (`src/mocks/handlers/student.handlers.ts`)
| Method | Path | Filters |
|--------|------|---------|
| GET | `/api/students/me/dashboard` | — |
| GET | `/api/students/me/transcript` | — |
| GET | `/api/students/me/courses` | status, page, pageSize |
| GET | `/api/students/me/courses/:courseId` | — |
| GET | `/api/students/me/skills` | — |
| GET | `/api/students/me/skills/evolution` | — |
| GET | `/api/students/me/skills/gaps` | — |
| GET | `/api/students/me/credentials` | type |
| GET | `/api/students/me/credentials/:id` | — |
| GET | `/api/students/me/career-readiness` | — |
| GET | `/api/students/me/jobs` | type, minMatch, page, pageSize |
| GET | `/api/students/me/jobs/:jobId` | — |
| GET | `/api/students/me/applications` | page, pageSize |
| POST | `/api/students/me/applications` | body: { jobId } |
| GET | `/api/students/me/portfolio` | — |
| POST | `/api/students/me/portfolio` | body: PortfolioItem |
| DELETE | `/api/students/me/portfolio/:id` | — |
| GET | `/api/students/me/recommendations` | — |
| POST | `/api/students/me/recommendations/:id/approve` | — |
| POST | `/api/students/me/recommendations/:id/dismiss` | body: { reason } |
| GET | `/api/students/me/appeals` | — |
| GET | `/api/students/me/appeals/:id` | — |
| POST | `/api/students/me/appeals` | body: CreateAppealRequest |
| GET | `/api/students/me/profile` | — |
| PATCH | `/api/students/me/profile` | body: Partial<StudentProfile> |
| GET | `/api/students/me/notification-preferences` | — |
| PATCH | `/api/students/me/notification-preferences` | body: Partial |

### Faculty (`src/mocks/handlers/faculty.handlers.ts`)
| Method | Path | Filters |
|--------|------|---------|
| GET | `/api/faculty/me/dashboard` | — |
| GET | `/api/faculty/me/students` | search, riskLevel, page, pageSize |
| GET | `/api/faculty/me/students/:id` | — |
| GET | `/api/faculty/me/interventions` | status, page, pageSize |
| GET | `/api/faculty/me/interventions/:id` | — |
| POST | `/api/faculty/me/interventions` | body: CreateInterventionRequest |
| PATCH | `/api/faculty/me/interventions/:id` | body: { status?, outcomes?, note? } |
| GET | `/api/faculty/me/courses` | — |
| GET | `/api/faculty/me/courses/:id` | — |
| GET | `/api/faculty/me/grants` | status, page, pageSize |
| GET | `/api/faculty/me/collaborations` | search |
| GET | `/api/faculty/me/publications` | type, search |
| GET | `/api/faculty/me/briefings` | — |
| GET | `/api/faculty/me/briefings/:courseId` | — |
| PATCH | `/api/faculty/me/briefings/:courseId/action-items/:index` | toggle completed |
| GET | `/api/faculty/me/profile` | — |
| PATCH | `/api/faculty/me/profile` | body: Partial<FacultyProfile> |

### Admin (`src/mocks/handlers/admin.handlers.ts`)
| Method | Path | Filters |
|--------|------|---------|
| GET | `/api/admin/dashboard` | — |
| GET | `/api/admin/analytics` | — |
| GET | `/api/admin/compliance/pulse` | — |
| GET | `/api/admin/compliance/deviations` | status, severity |
| PATCH | `/api/admin/compliance/deviations/:id` | body: { resolution } |
| GET | `/api/admin/compliance/audit-trail` | search, action, role, page, pageSize |
| GET | `/api/admin/users` | search, role, status, page, pageSize |
| GET | `/api/admin/users/:id` | — |
| POST | `/api/admin/users` | body: CreateUserRequest |
| PATCH | `/api/admin/users/:id` | body: { role?, status?, department? } |
| GET | `/api/admin/roles` | — |
| PATCH | `/api/admin/roles/:role/permissions` | body: { module, action } |
| GET | `/api/admin/integrations` | — |
| GET | `/api/admin/budget` | — |
| GET | `/api/admin/ai-governance/overview` | — |
| GET | `/api/admin/ai-governance/models` | — |
| GET | `/api/admin/ai-governance/models/:id` | — |
| GET | `/api/admin/ai-governance/bias-reports` | — |
| GET | `/api/admin/ai-governance/bias-reports/:id` | — |
| GET | `/api/admin/ai-governance/overrides` | page, pageSize |
| GET | `/api/admin/credentials` | search, type, status, page, pageSize |
| POST | `/api/admin/credentials` | body: IssueCredentialRequest |
| POST | `/api/admin/credentials/:id/revoke` | body: { reason } |
| GET | `/api/admin/reports/templates` | — |
| GET | `/api/admin/reports/generated` | page, pageSize |
| POST | `/api/admin/reports/generate` | body: { templateId, parameters } |
| GET | `/api/admin/settings` | — |
| PATCH | `/api/admin/settings` | body: Partial<InstitutionSettings> |

### Research (`src/mocks/handlers/research.handlers.ts`)
| Method | Path | Filters |
|--------|------|---------|
| GET | `/api/research/me/dashboard` | — |
| GET | `/api/research/grants/discover` | status, page, pageSize |
| GET | `/api/research/grants/:id` | — |
| GET | `/api/research/me/grants` | — |
| PATCH | `/api/research/me/grants/:id` | body: { status } |
| GET | `/api/research/me/collaborations` | search |
| GET | `/api/research/me/collaborations/graph` | — |
| GET | `/api/research/me/publications` | type, search, page, pageSize |
| GET | `/api/research/topics/trends` | — |
| GET | `/api/research/me/performance` | — |
| GET | `/api/research/me/profile` | — |
| PATCH | `/api/research/me/profile` | body: Partial<ResearchProfile> |

### Placement (`src/mocks/handlers/placement.handlers.ts`)
| Method | Path | Filters |
|--------|------|---------|
| GET | `/api/placement/dashboard` | — |
| GET | `/api/placement/students` | search, department, minScore, page, pageSize |
| GET | `/api/placement/employers` | search, industry, page, pageSize |
| GET | `/api/placement/employers/:id` | — |
| POST | `/api/placement/employers` | body: Partial<Employer> |
| POST | `/api/placement/matching/run` | body: MatchRunConfig |
| GET | `/api/placement/matching/results` | status, page, pageSize |
| POST | `/api/placement/matching/:id/approve` | — |
| POST | `/api/placement/matching/:id/reject` | — |
| GET | `/api/placement/pipeline` | stage |
| PATCH | `/api/placement/pipeline/:id` | body: { stage?, notes? } |
| GET | `/api/placement/reports` | — |
| GET | `/api/placement/settings` | — |
| PATCH | `/api/placement/settings` | body: Partial<PlacementSettings> |

### Ministry (`src/mocks/handlers/ministry.handlers.ts`)
| Method | Path | Filters |
|--------|------|---------|
| GET | `/api/ministry/dashboard` | — |
| GET | `/api/ministry/institutions` | search, region, type, complianceStatus, page, pageSize |
| GET | `/api/ministry/institutions/:id` | — |
| GET | `/api/ministry/compliance` | — |
| GET | `/api/ministry/simulation/results` | — |
| POST | `/api/ministry/simulation/run` | body: SimulationConfig |
| GET | `/api/ministry/scenarios/compare` | ids (comma-separated) |
| GET | `/api/ministry/reports` | type, page, pageSize |
| POST | `/api/ministry/reports/generate` | body: { title, type, parameters } |
| GET | `/api/ministry/quality-indicators` | region, sort |
| GET | `/api/ministry/budget` | — |
| GET | `/api/ministry/settings` | — |
| PATCH | `/api/ministry/settings` | body: Partial<MinistrySettings> |

## Switching from Mocks to Real Backend

1. Set `NEXT_PUBLIC_MSW_ENABLED=false` in `.env.local`
2. Set `NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com`
3. The frontend will call real endpoints — no code changes needed
4. You can switch individual endpoints by removing specific handlers from `src/mocks/handlers/index.ts`

## Validation Schemas

The frontend validates forms using Zod schemas in `src/lib/schemas/`. Your backend should enforce the same rules:

- `auth.schema.ts` — Login, forgot password, reset password
- `faculty.schema.ts` — Create intervention, faculty profile
- `admin.schema.ts` — Create user, issue/revoke credential, institution settings, resolve deviation

## Multi-tenancy

Every authenticated request includes the user's `tenantId` (institution ID). The API client can be extended to send `X-Tenant-ID` header. Backend must scope all data queries by tenant.

## Key Data Types

All TypeScript interfaces are in `src/lib/api/types/`. Start there when building any endpoint — the types ARE the contract.
