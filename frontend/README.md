# React frontend

React, Vite, TypeScript, Tailwind CSS, and shadcn/ui.

## Requirements

Node.js 22.12 or newer and npm. Run these commands from `frontend/`.

## Install and run

```bash
npm ci
npm run dev
```

Open http://127.0.0.1:5173.
Vite uses a fixed port and reports an error if 5173 is already occupied.
To use a different port, run `npm run dev -- --port 5174`.

## Development proxy

Start FastAPI separately from the repository root. Requests beginning with
`/api` are forwarded unchanged to http://127.0.0.1:8000.

To change the target, copy `.env.example` to `.env.local` and edit
`API_PROXY_TARGET`, then restart Vite. Use http://127.0.0.1:8001 when the backend
runs on port 8001. This setting is used by Vite's development server only.
The browser does not receive it. Future browser environment settings must use
Vite's `VITE_` prefix and be declared in `src/vite-env.d.ts`; those values are
public and must never contain secrets.

The development proxy is not included in production builds or `vite preview`.

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

## Styling and components

Tailwind CSS runs through `@tailwindcss/vite`. Add utility classes directly to
JSX. Global styles and shared theme tokens live in `src/index.css`.

The theme uses neutral colors and locally bundled Geist fonts. Light colors are
defined in `:root`; dark colors are defined in `.dark`. Apply the `dark` class
to the document's `<html>` element to select the dark theme. Semantic utilities
such as `bg-background`, `text-foreground`, and `border-border` use these tokens.

`components.json` configures shadcn/ui for React with the Radix Nova preset,
TypeScript, and CSS variables. To add a component, run from `frontend/`:

```bash
npx shadcn add button
```

The CLI writes component source to `src/components/ui/` and installs the
dependencies it needs. Review the generated files before committing them.
Shared helpers belong in `src/lib/`; `@/lib/utils` exports the `cn` class-name
helper. Hooks belong in `src/hooks/`.

## Structure

```text
frontend/
  index.html          # HTML document and React mount element
  vite.config.ts      # React plugin, source alias, and development proxy
  components.json     # shadcn/ui preset, stylesheet, and aliases
  src/
    main.tsx          # mounts React in StrictMode
    App.tsx           # application root
    index.css         # Tailwind imports, global styles, and theme tokens
    vite-env.d.ts     # Vite environment typing
    components/ui/    # shadcn/ui component source
    hooks/            # shared React hooks
    lib/utils.ts      # shared class-name helper
```

`@/` resolves to `src/` in both Vite and TypeScript. Dependencies are locked in
`package-lock.json`.
