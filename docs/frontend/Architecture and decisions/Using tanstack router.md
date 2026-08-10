# Using Tanstack Router

This project uses tanstack router.

> Why? Well the project already uses `tanstack/query`, and I wanted to try it out, so yeah.

## How to configure Tanstack Router?

### 1. Install

```bash
pnpm install @tanstack/react-router
pnpm install -D @tanstack/router-plugin @tanstack/router-devtools
```

### 2. Configure the vite plugin

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### 3. Create routes

You need to create the following files for it to work:

- src/routes/\_\_root.tsx (with two '\_' characters)
- src/routes/index.tsx
- src/routes/about.tsx
- src/main.tsx

```tsx
// __root.tsx
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

const RootLayout = () => (
  <>
    <div className="p-2 flex gap-2">
      <Link to="/" className="[&.active]:font-bold">
        Home
      </Link>{" "}
      <Link to="/about" className="[&.active]:font-bold">
        About
      </Link>
    </div>
    <hr />
    <Outlet />
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRoute({ component: RootLayout });
```

```tsx
// index.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
    </div>
  );
}
```

```tsx
// about.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return <div className="p-2">Hello from About!</div>;
}
```

```tsx
// main.tsx
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
```

There is one problem with creating routes this way: eslint will create a warning which will say something like this:

```
Fast refresh only works when a file only exports components. Move your component(s) to a separate file. If all exports are HOCs, add them to the `extraHOCs` option.
```

To resolve this, move your components into separate files and than use them under routes or you can surpass it using:

```
// eslint-disable-next-line react-refresh/only-export-components
```

Whenever you run your project a `routeTree.gen` file will be created by tanstack router.

> Note: you need to commit this file to github.

## Resources and further reading

- [Tanstack router manual installation](https://tanstack.com/router/latest/docs/installation/manual)
