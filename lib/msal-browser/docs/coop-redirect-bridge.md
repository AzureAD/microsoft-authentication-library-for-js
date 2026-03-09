# COOP Redirect Bridge — Framework-Specific Setup

This guide provides framework-specific instructions for setting up the COOP redirect bridge page introduced in MSAL Browser v5. For background on what COOP is and why the redirect bridge is needed, see the [v4 to v5 migration guide](./v4-migration.md#cross-origin-opener-policy-coop-support).

> **Important:** The redirect bridge page must **NOT** be served with `Cross-Origin-Opener-Policy` headers. The bridge page is an intermediary that receives the authentication response after the IdP completes the OAuth flow. If COOP headers are set on the bridge page, the browser performs a browsing context group swap that severs the communication channel back to the main application — reintroducing the exact problem the bridge is designed to solve.

> [!IMPORTANT]
> After updating your `redirectUri` to point to the new redirect bridge page,
> you **MUST** also update the redirect URI in your
> [Entra ID app registration](https://learn.microsoft.com/azure/active-directory/develop/quickstart-register-app#add-a-redirect-uri).
> The URI must match **exactly** — including path, protocol, and port.
> Failure to update the app registration will result in `redirect_uri_mismatch` errors.

## Angular

1. **Create the redirect bridge component** (`src/app/redirect/redirect.component.ts`):

```typescript
import { Component, OnInit } from "@angular/core";
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

@Component({
    selector: "app-redirect",
    standalone: true,
    template: "<p>Processing authentication...</p>",
})
export class RedirectComponent implements OnInit {
    ngOnInit(): void {
        broadcastResponseToMainFrame().catch((error: Error) => {
            console.error("Error broadcasting response to main frame:", error);
        });
    }
}
```

1. **Add the `/redirect` route** in your routing configuration. The redirect route must be **outside** the `MsalGuard` and should not be wrapped by any MSAL interceptor:

```typescript
import { RedirectComponent } from "./redirect/redirect.component";

const routes: Routes = [
    { path: "redirect", component: RedirectComponent },
    // ... your other routes
];
```

1. **Ensure the build includes the component.** No `angular.json` assets change is needed when using an Angular route component — the Angular CLI bundles the component automatically. If you prefer a static `redirect.html` instead of a routed component, add it to the assets array:

```jsonc
// angular.json
{
    "projects": {
        "your-app": {
            "architect": {
                "build": {
                    "options": {
                        "assets": [
                            { "glob": "**/*", "input": "public" },
                            "src/redirect.html" // ← Add redirect bridge page
                        ]
                    }
                }
            }
        }
    }
}
```

> **Sample:** See [angular-standalone-sample](../../../samples/msal-angular-samples/angular-standalone-sample) and [angular-modules-sample](../../../samples/msal-angular-samples/angular-modules-sample).

## Vite

Vite requires a multi-page configuration so that `redirect.html` is included as a separate entry point in the build output.

1. **Create `redirect.html`** in your project root (next to `index.html`):

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Redirect</title>
</head>
<body>
    <p>Processing authentication...</p>
    <script type="module">
        import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

        broadcastResponseToMainFrame().catch((error) => {
            console.error("Error broadcasting response:", error);
        });
    </script>
</body>
</html>
```

1. **Update `vite.config.ts`** to add the redirect page as a second entry:

```typescript
import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                redirect: resolve(__dirname, "redirect.html"), // ← Redirect bridge entry
            },
        },
    },
});
```

During development (`vite dev`), the redirect page is automatically served at `/redirect.html`. In production builds, Rollup will emit both `index.html` and `redirect.html` in the output directory.

## Webpack

Webpack requires a dedicated entry point and an `HtmlWebpackPlugin` instance for the redirect page.

1. **Create `src/redirect.html`**:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Redirect</title>
</head>
<body>
    <p>Processing authentication...</p>
    <!-- The redirect script bundle will be injected by HtmlWebpackPlugin (see redirect.js entry). -->
</body>
</html>
```

1. **Create `src/redirect.js`** (entry point for Webpack):

```javascript
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

broadcastResponseToMainFrame().catch((error) => {
    console.error("Error broadcasting response:", error);
});
```

1. **Update `webpack.config.js`**:

```javascript
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: {
        main: "./src/index.js",
        redirect: "./src/redirect.js", // ← Redirect bridge entry
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: "./src/index.html",
            chunks: ["main"],
        }),
        new HtmlWebpackPlugin({
            filename: "redirect.html",
            template: "./src/redirect.html",
            chunks: ["redirect"], // ← Only include the redirect chunk
        }),
    ],
};
```

## Next.js

Next.js pages automatically become routes, so the redirect bridge is a page component. The setup differs between the **Pages Router** and the **App Router**.

### Pages Router (`pages/`)

1. **Create `pages/redirect.js`**:

```jsx
import { useEffect } from "react";
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

export default function Redirect() {
    useEffect(() => {
        broadcastResponseToMainFrame().catch((error) => {
            console.error("Error broadcasting response to main frame:", error);
        });
    }, []);

    return <p>Processing authentication...</p>;
}
```

1. **Exclude the redirect page from `MsalProvider`** in `_app.js`:

```jsx
// pages/_app.js
import { useRouter } from "next/router";
import { MsalProvider } from "@azure/msal-react";

function MyApp({ Component, pageProps }) {
    const router = useRouter();

    // The redirect page must NOT be wrapped in MsalProvider
    if (router.pathname === "/redirect") {
        return <Component {...pageProps} />;
    }

    return (
        <MsalProvider instance={msalInstance}>
            <Component {...pageProps} />
        </MsalProvider>
    );
}
```

### App Router (`app/`)

1. **Create `app/redirect/page.js`** — this must be a Client Component (`"use client"`):

```jsx
"use client";

import { useEffect } from "react";
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

export default function Redirect() {
    useEffect(() => {
        broadcastResponseToMainFrame().catch((error) => {
            console.error("Error broadcasting response to main frame:", error);
        });
    }, []);

    return <p>Processing authentication...</p>;
}
```

1. **Exclude the redirect route from `MsalProvider`** in your root layout. If your `app/layout.js` wraps children in `MsalProvider`, create a separate layout for the redirect route that skips it:

```jsx
// app/redirect/layout.js — no MsalProvider wrapper
export default function RedirectLayout({ children }) {
    return <>{children}</>;
}
```

This prevents MSAL from processing the auth response hash before `broadcastResponseToMainFrame()` runs.

---

No `next.config.js` changes are needed for either router — Next.js serves pages automatically.

> **Sample:** See the [nextjs-sample](../../../samples/msal-react-samples/nextjs-sample) for a Pages Router example.

## Create React App (CRA)

The recommended approach for CRA is to use a **dedicated static HTML file** placed in the `public/` folder. CRA copies everything in `public/` to the build output as-is, so `public/redirect.html` is served at `/redirect.html` with no React bundle attached — exactly what the redirect bridge requires.

### Recommended: dedicated `public/redirect.html`

1. **Create `public/redirect.html`**:

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Redirect</title>
</head>
<body>
    <p>Processing authentication...</p>
    <!--
        Ensure that msal-redirect-bridge.min.js (the UMD bundle) is hosted at this path,
        for example by copying it from the @azure/msal-browser package into your public/ folder.
    -->
    <script src="/msal-redirect-bridge.min.js"></script>
    <script>
        msalRedirectBridge.broadcastResponseToMainFrame().catch(function (error) {
            console.error("Error broadcasting response:", error);
        });
    </script>
</body>
</html>
```

2. **Set `redirectUri`** in your MSAL configuration to point to this file:

```javascript
const msalConfig = {
    auth: {
        clientId: "YOUR_CLIENT_ID",
        redirectUri: window.location.origin + "/redirect.html",
    },
};
```

This page is served as plain HTML — it does **not** load your React application bundle, React Router, or `MsalProvider`. No changes to `App.js` or routing are required.

> **Important:** The `public/redirect.html` example above uses the UMD bundle (`msal-redirect-bridge.min.js`) and the global `msalRedirectBridge` object. This makes the page usable in a wide range of browsers, including those that do not support native ES modules. If you prefer to use an ES module instead, you can replace the UMD `<script>` tag with a `<script type="module">` block that imports `broadcastResponseToMainFrame` from `@azure/msal-browser/redirect-bridge`, or you can use the SPA route approach described below.

### Alternative: SPA route (React Router)

> **Caveat:** This approach mounts the redirect URI inside the React Router SPA, so the **full application bundle** — including React, React Router, and all your app code — is downloaded and executed on the redirect page. For most apps the extra overhead is negligible, but it can slow down the authentication round-trip. If you use hash-based routing (`HashRouter`) you will also need to ensure the redirect URI hash is not consumed by the router before `broadcastResponseToMainFrame` runs.

If you prefer to keep everything inside the SPA, follow these steps to create a dedicated route that runs the bridge script and place it **outside** `MsalProvider`:

1. **Create `src/pages/Redirect.jsx`**:

```jsx
import { useEffect } from "react";
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

export function Redirect() {
    useEffect(() => {
        broadcastResponseToMainFrame().catch((error) => {
            console.error("Error broadcasting response to main frame:", error);
        });
    }, []);

    return <p>Processing authentication...</p>;
}
```

2. **Add the route outside of `MsalProvider`** in your `App.js`:

```jsx
import { Routes, Route } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { Redirect } from "./pages/Redirect";

function App({ msalInstance }) {
    return (
        <Routes>
            {/* Redirect route must be OUTSIDE MsalProvider */}
            <Route path="/redirect" element={<Redirect />} />
            <Route
                path="/*"
                element={
                    <MsalProvider instance={msalInstance}>
                        {/* Your app routes */}
                    </MsalProvider>
                }
            />
        </Routes>
    );
}
```

> **Sample:** See the [react-router-sample](../../../samples/msal-react-samples/react-router-sample) and [typescript-sample](../../../samples/msal-react-samples/typescript-sample).

## Express.js / Node.js Backend

When using Express.js (or any Node.js backend serving static files), configure the server to serve the redirect page **without** COOP headers:

```javascript
const express = require("express");
const path = require("path");
const app = express();

// Serve the redirect bridge page WITHOUT COOP headers
app.get("/redirect", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "redirect.html"));
});

// Set COOP headers for all other routes
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
});

app.use(express.static(path.join(__dirname, "public")));
```

> **Sample:** See the [HybridSample](../../../samples/msal-browser-samples/HybridSample).

## Additional Resources

- [v4 to v5 migration guide — COOP section](./v4-migration.md#cross-origin-opener-policy-coop-support)
- [Redirect URI considerations](./login-user.md#redirecturi-considerations)
- [Handling popup interaction_in_progress errors](./login-user.md#handling-popup-interaction_in_progress-errors)
- [MDN: Cross-Origin-Opener-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy)
