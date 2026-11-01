# Frontend foundation

React + Vite + TypeScript, with a "Hello, world!" heading and no API integration yet.

## Requirements

Node.js 22.12 or newer and npm. Run these commands from `frontend/`.

## Install and run

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:5173. A "Hello, world!" heading confirms React is running.
Vite uses a fixed port and reports an error if 5173 is already occupied.
To use a different port, run `npm run dev -- --port 5174`.

## Development proxy

Start FastAPI separately from the repository root. Requests beginning with
`/api` are forwarded unchanged to http://127.0.0.1:8000. FastAPI has no endpoints
yet, so these requests currently return its JSON 404 response.

To change the target, copy `.env.example` to `.env.local` and edit
`API_PROXY_TARGET`, then restart Vite. Use http://127.0.0.1:8001 when the backend
runs on port 8001. This setting is used by Vite's development server only.
The browser does not receive it. Future browser environment settings must use
Vite's `VITE_` prefix and be declared in `src/vite-env.d.ts`; those values are
public and must never contain secrets.

The development proxy is not included in production builds or `vite preview`.
Production API routing and hosting are deferred.

## Checks and build

```bash
npm run typecheck
npm run lint
npm run build
npm run preview -- --host 127.0.0.1
```

`build` also runs type checking. Output is written to the ignored `dist/`
directory. `preview` serves that build locally; it is not a production server.
Oxlint provides the starter's React and TypeScript lint rules.

## Structure

```text
frontend/
  index.html          # HTML document and React mount element
  vite.config.ts      # React plugin, source alias, and development proxy
  src/
    main.tsx          # mounts React in StrictMode
    App.tsx           # Hello, world! application root
    index.css         # reserved for Part 3 global styles
    vite-env.d.ts     # Vite environment typing
    components/       # reserved for future components
    lib/              # reserved for future shared helpers
```

`@/` resolves to `src/` in both Vite and TypeScript. Dependencies are locked in
`package-lock.json`. Tailwind and shadcn/ui are reserved for Part 3. Routing,
API clients, data fetching, and application screens are deferred.
