import { graphConfig } from "~/serverConfig";
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

  return await fetch(graphConfig.profilePhotoEndpoint, {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
    },
  });
}
