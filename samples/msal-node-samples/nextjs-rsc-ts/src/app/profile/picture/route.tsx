import { authProvider } from "~/services/auth";

export async function GET() {
  const { account, instance } = await authProvider.authenticate();

  if (!account) {
    return new Response(null, { status: 401 });
  }

  const token = await instance.acquireTokenSilent({
    account,
    scopes: ["User.Read"],
  });

  if (!token) {
    return new Response(null, { status: 403 });
  }

  return await fetch("https://graph.microsoft.com/v1.0/me/photo/$value", {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
    },
  });
}
