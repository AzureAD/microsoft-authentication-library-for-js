# @azure/msal-node for Next.js with Server Components

This is a sample showcasing some authentication scenarios in Next.js, that uses `@azure/msal-node` on the server to fully utilize the frameworks capabilities.  
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).  
This sample assumes some previous knowledge with React Server Components and Next.js.

## What this sample showcases

### React Server Components

The example `AuthProvider` implementation, uses functions wrapped in `cache` from `react`. This allows you to do multiple calls in separate server components, without the functions being invoked more than 1 time per request.

### Optional auth

The root `src/app/page.tsx` simply renders different content based on the existence of an account from the `AuthProvider`.

### Forced auth

In `src/app/forced/layout.tsx` you'll see these lines of code;

```tsx
const { account } = await authProvider.authenticate();

if (!account) {
  redirect(await authProvider.getAuthCodeUrl(codeRequest, getCurrentUrl()));
}
```

This will redirect the user to azure at the earliest possible time, using HTTP headers on the initial request to the page.

This can be useful if your whole app relies on being authenticated.

### Incremental consent

The `AuthProvider` implementation stores the `CodeRequest` in the state that is sent to Azure. This means you can call `getAuthCodeUrl` with different types of request where needed, and the `handleAuthCodeCallback` will extract that request and pass it to `acquireTokenByCode` automatically. This allows you to have a single `auth/callback` url that can handle different token requests, and return the user back to where they where before login/consent was initiated.

### Server actions and Route Handlers

The `AuthProvider` works with Server Actions and Route Handlers. Route Handlers doesn't run in a React context, and doesn't have access to the React cache. Therefore, a single call to `AuthProvider.authenticate` is recommended in Route Handlers.

## Notable files

- `./src/actions/auth.ts`

Contains Server Actions for logging in, logging out, and additional consent. Usage of them can be seen in `./src/app/page.tsx`, `./src/app/event/page.tsx` and `./src/components/LogoutButton.tsx`

- `./src/middleware.ts`
- `./src/utils/url.ts`

Injects the current url of the request and makes it available in server components.  
https://github.com/vercel/next.js/issues/43704#issuecomment-1411186664

### Route Handlers

- `./src/app/auth/callback/route.ts`

The route Azure will redirect back to with a code

- `./src/app/profile/picture/route.tsx`

A route handler that returns the Profile Picture of the currently logged in user. This route can be directly used in an img tag, without any more work from the client. The `./src/components/SignOutButton.tsx` uses the `/profile/picture` url for the `<Avatar>` component from Material UI.

### Pages

- `./src/app/page.tsx`

Contains links to the different samples, as well as login and logout buttons via Route Handlers and Server Actions.
Also showcases how to render different content if a user is logged in or not.

- `./src/app/forced/layout.tsx`

Showcases how to force authentication of a subset of pages. All pages that are accessed under `/forced` will be redirected directly to azure if not authenticated.

- `./src/app/profile/page.tsx`

Shows how to get data from graph in a server component.

- `./src/app/event/page.tsx`

Also shows how to get data from graph, but needs additional consent before it can use the API.

### AuthProvider

- `./src/utils/AuthProvider.ts`

Contains an implementation wrapping the usage of a ConfidentialClientApplication, that accepts an partition manager and a cache client for the [DistributedCachePlugin](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/caching.md#web-apps) that will be initialized internally.

- `./src/services/auth.ts`

Initializes an instance of the AuthProvider, and provides it with a `RedisCacheClient` and a `SessionPartitionManager`.

## Running the sample

Create an App Registration in the Azure portal with the following:

- Redirect URI (**WEB**): http://localhost:3000/auth/callback
- API permissions `User.Read` and `Calendars.Read`
- A client secret

Set up a `.env.local` file with the following values

```env
AZURE_AD_CLIENT_ID=YOUR_CLIENT_ID
AZURE_AD_CLIENT_SECRET=YOUR_CLIENT_SECRET
AZURE_AD_AUTHORITY=YOUR_AZURE_AD_AUTHORITY (optional, defaults to "https://login.microsoftonline.com/common")
AUTH_CALLBACK_URI=AUTH_CALLBACK_HANDLER (optional, defaults to "http://localhost:3000/auth/callback")
SESSION_SECRET=SUPER_SECRET_STRING_USED_TO_SIGN_COOKIES
REDIS_URL=redis[s]://[[username][:password]@][host][:port][/db-number] (optional, connects to a local redis server if not set)
```

You also need [Redis](https://redis.io/) up and running locally, or set `REDIS_URL` to connect to an external Redis.

Install and run the development server:

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Remarks

The sample uses `createCookieSessionStorage` from `@remix-run/node`, which might sound weird. But the implementation works directly with the cookie header, and therefore works as intended.

Session lifetime has not been handled at all, and the RedisCachePlugin does not evict anything, this should be reviewed when implementing in your own applications.

Material UI was integrated by following the [App Router guide](https://mui.com/material-ui/guides/next-js-app-router/).

The `middleware.ts` currently exposes the currently accessed url so that it can be retrieved in server components. This allows you to send the user back to where they originally were dynamically. If your application is hosted behind a proxy, you'd have to compute the url based on [forwarded headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded), depending on what your hosting platform exposes.

The `AuthProvider` interface uses the `state` parameter to store and retrieve required parameters from the triggering token request. It is highly recommended to store such information in the session instead, to avoid the risk of exposing sensitive info, as the `state` parameter will be stored in the browser history.
