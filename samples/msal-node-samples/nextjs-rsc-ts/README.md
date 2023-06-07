# @azure/msal-node for Next.js with Server Components

This is a sample showcasing some authentication scenarios in Next.js, that uses `@azure/msal-node` on the server to fully utilize the frameworks capabilities.  
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

### Gradual consent

The `AuthProvider` implementation stores the `CodeRequest` in the state that is sent to Azure. This means you can call `getAuthCodeUrl` with different types of request where needed, and the `handleAuthCodeCallback` will extract that request and pass it to `acquireTokenByCode` automatically. This allows you to have a single `auth/callback` url that can handle different token requests, and return the user back to where they where before login/consent was initiated.

### Server actions and Route Handlers

The `AuthProvider` works with Server Actions and Route Handlers, but the cache won't work the same way as with react. Therefore, a single call to `AuthProvider.authenticate` is recommended.

## Running the sample

Create an App Registration in the Azure portal with the following:

- Redirect URI (**WEB**): http://localhost:3000/auth/callback
- API permissions `User.Read` and `Calendars.Read`
- A client secret

Set up a `.env.local` file with the following values

```env
AZURE_AD_CLIENT_ID=YOUR_CLIENT_ID
AZURE_AD_CLIENT_SECRET=YOUR_CLIENT_SECRET
AZURE_AD_TENANT_ID=YOUR_TENANT_ID
SESSION_SECRET=SUPER_SECRET_STRING_USED_TO_SIGN_COOKIES
```

You also need [Redis](https://redis.io/) up and running locally, or modify `src/services/redis.ts` to connect to an external Redis.

Install and run the development server:

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Remarks
