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

## Phase 1 MVP

- Configurable Wiki API endpoint, stored in `localStorage`
- `zh-CN`, `en-US`, and `ja-JP` locale structure
- MUI light / dark / system theme support
- User contribution query through `list=usercontribs`
- Contribution table with sorting and pagination
- Edit trend, hourly, weekday, namespace, top page, and top user charts
- Hash-based routing and relative Vite base for GitHub Pages compatibility

## Notes

Patrol and patrol speed pages are scaffolded for phase 2. If a Wiki does not expose patrol logs or hides related revision data, the UI reports that the feature is unavailable because some logs are not public.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Deploy the generated `dist` directory to GitHub Pages, Netlify, or Vercel.
