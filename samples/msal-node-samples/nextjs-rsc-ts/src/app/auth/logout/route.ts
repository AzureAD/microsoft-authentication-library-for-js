import { headers } from "next/headers";
import { authProvider } from "~/services/auth";
import { destroySession, getSession } from "~/services/session";

export async function POST() {
  const { instance, account } = await authProvider.authenticate();

  if (account) {
    await instance.getTokenCache().removeAccount(account);
  }

  const session = await getSession(headers().get("Cookie"));

  return new Response(null, {
    status: 200,
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
