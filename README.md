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

## Supported Features

- Configurable MediaWiki API endpoint
- Settings stored in `localStorage`
- Light, dark, and system theme modes
- `zh-CN`, `en-US`, and `ja-JP` locale structure
- Contribution queries with `list=usercontribs`
- Patrol log queries with `list=logevents&letype=patrol`
- Optional patrol speed calculation from patrol time and revision time
- Filters for user, user group, permission, date range, namespace, minor edits, page title, and request batch count
- Batch progress display for main list, revision detail, and user metadata requests
- DataGrid tables with sorting, pagination, localized labels, and diff links
- Namespace name lookup through siteinfo
- Chart type switching between line, bar, scatter, radar, and pie charts
- Linear and logarithmic chart scales for supported chart types
- Localized error handling for network, timeout, API, and private log failures
- GitHub Pages deployment workflow

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
