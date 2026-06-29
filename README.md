# Wiki Stats Dashboard

A pure frontend React dashboard for MediaWiki contribution and patrol statistics.

## Stack

- React
- TypeScript
- Vite
- MUI / Material UI
- TanStack Query
- Apache ECharts
- i18next

## Features

- MediaWiki contribution statistics and patrol log statistics.
- Configurable API endpoint, language, and light/dark/system theme.
- Contribution filters for user, user group, permission, date range, multiple namespaces, minor edits, and request page count.
- Patrol filters for patroller, user group, permission, page title, date range, and request page count.
- Batch progress display, request retry handling, and CSV export.
- Data tables with sorting, pagination, namespace labels, and diff links.
- Patrol speed metrics based on patrol time and revision time.
- Charts for trends, hourly and weekday distribution, namespaces, top users, top pages, and patrol speed.
- Switchable chart types: line, bar, scatter, radar, and pie.
- Linear and logarithmic chart scales where supported.
- Customizable chart dashboard with local layout storage, drag ordering, size controls, add/remove charts, and reset.
- Local settings and chart layouts stored in `localStorage`.
- GitHub Pages deployment workflow.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
