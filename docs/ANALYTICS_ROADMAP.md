# Analytics Roadmap (Frontend-first)

This document outlines a frontend-first roadmap for building the Admin Analytics section. It assumes backend capabilities will be added to match the frontend needs (aggregation endpoints, cached summaries). The goal is to provide a clear plan from KPIs to UI components, data contracts, and rollout.

1. Goals & Scope
- **Primary goals**: provide real-time overview, historical trends, and drilldowns for tasks, users, leaves, meetings, and attachments.
- **Users**: Super Admin, Admin, Department Head, Manager
- **Must-have views**: Overview dashboard, Tasks analytics, User activity, Leave trends, Meeting metrics, Attachments/storage

2. KPIs (top-level)
- **Tasks**: total, open, in-progress, completed, overdue rate, average resolution time, tasks per department, tasks by priority
- **Users**: active users (DAU/WAU/MAU), new users, user activity heatmap, average tasks completed per user
- **Leave**: total requests, approval rate, avg processing time, leaves by department
- **Meetings**: total meetings, avg attendees, meetings by department
- **Attachments**: total storage, files per type, previews generated

3. Data Sources & Contracts (frontend expectations)
- Aggregation endpoints (examples):
  - `GET /api/analytics/tasks/summary?from=YYYY-MM-DD&to=YYYY-MM-DD&groupBy=day|week|month`
    - returns: { total, completed, inProgress, overdue, avgResolutionMs, byPriority: {...}, byDepartment: [...] }
  - `GET /api/analytics/users/active?window=7d` -> { dau, wau, mau }
  - `GET /api/analytics/leaves/summary?from=&to=` -> { total, approved, rejected, avgProcessingMs, byDepartment }
  - `GET /api/analytics/meetings/summary` -> { total, avgAttendees, byDepartment }
  - `GET /api/analytics/attachments/summary` -> { totalFiles, totalStorageBytes, byType }

Contract notes:
- Use consistent pagination for detail endpoints
- Support `companyId`, `departmentId`, `userId`, and role-based filters
- Return timestamps in ISO8601 and counts as integers; include `cachedAt` for cached responses

4. Backend Requirements (high level)
- Aggregation SQL/NoSQL queries or background jobs to pre-compute daily rollups
- Cache layer (Redis) for heavy queries with TTLs
- Access control checks in endpoints
- Optional streaming/topic for real-time updates (websocket or SSE)

5. Frontend Architecture
- Place new page: `src/pages/Admin/Analytics.tsx`
- Create components:
  - `components/Analytics/OverviewCard.tsx` (stat card)
  - `components/Analytics/TimeSeriesChart.tsx` (reusable chart wrapper)
  - `components/Analytics/BreakdownTable.tsx` (sortable table)
  - `components/Analytics/FiltersBar.tsx` (date range, groupBy, department, user)
  - `components/Analytics/ExportButton.tsx`
- Use `react-query` for data fetching with caching and staleTimes
- Chart library: `recharts` or `chart.js` (recommend `recharts` for React ergonomics)
- Use `tailwind`/existing UI primitives for consistent look

6. UI & UX Details
- Top filters: date range, groupBy (day/week/month), department, user, priority
- Overview: row of `OverviewCard` items for high-level KPIs
- Trends: time-series area/line charts with brush and hover tooltips
- Breakdowns: pie or bar charts for category distributions; tables for drilldown
- Drilldown: clicking a slice or table row opens a side-panel with details and links to filtered lists (tasks, users, leaves)
- Loading: use Users-style loading screen / skeleton cards

7. Performance & Real-time
- Use server-side rollups for historical/trend charts
- For near-real-time counters (current active tasks), use websocket or poll every 30s
- Add client-side memoization and `react-query` prefetching

8. Security & Access
- Only admin roles see analytics page; implement route guard
- Backend endpoints return data scoped to the requesting user's company
- Audit logs for analytics exports

9. Testing & Monitoring
- Unit tests for data transforms, snapshot tests for components
- Integration tests hitting mocked endpoints
- Monitor endpoint latency, set alerts on aggregation failures

10. Rollout Plan
- Phase 1 (MVP): Overview cards + tasks summary endpoint + basic time-series chart
- Phase 2: Breakdowns, drilldowns, export CSV
- Phase 3: Real-time updates, caching optimizations, additional modules (meetings/leaves)

11. Implementation Checklist (developer tasks)
- [ ] Define backend endpoints and payloads
- [ ] Implement backend aggregations and caching
- [ ] Create frontend page, filters, and components
- [ ] Hook charts to endpoints and implement loading states
- [ ] Add drilldown and export features
- [ ] QA and performance tuning

12. Example API Response (tasks summary)
```
{
  "total": 1200,
  "completed": 900,
  "inProgress": 200,
  "overdue": 100,
  "avgResolutionMs": 172800000,
  "byPriority": { "urgent": 30, "high": 200, "medium": 600, "low": 370 },
  "byDepartment": [{ "id": "d1", "name": "Engineering", "count": 400 }, ...],
  "grouped": [ { "date": "2025-08-01", "count": 30, "completed": 20 }, ... ],
  "cachedAt": "2025-08-15T12:00:00Z"
}
```

---

If you want, I can now:
- scaffold the frontend page and components (`Analytics.tsx` + components folder), or
- draft the backend endpoint contracts in `docs/API_ANALYTICS.md`, or
- do both in a single PR. Which should I start with?











































