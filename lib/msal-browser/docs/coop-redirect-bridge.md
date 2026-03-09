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
    <script type="module">
        import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

        broadcastResponseToMainFrame().catch((error) => {
            console.error("Error broadcasting response:", error);
        });
    </script>
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

Next.js pages automatically become routes, so the redirect bridge is a page component.

1. **Create `pages/redirect.js`** (Pages Router) or `app/redirect/page.js` (App Router):

```jsx
// pages/redirect.js (Pages Router)
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

No `next.config.js` changes are needed — Next.js serves pages automatically.

> **Sample:** See the [nextjs-sample](../../../samples/msal-react-samples/nextjs-sample).

## Create React App (CRA)

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

1. **Add the route outside of `MsalProvider`** in your `App.js`:

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
