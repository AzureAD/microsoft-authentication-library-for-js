import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { authProvider } from "~/services/auth";
import { destroySession, getSession } from "~/services/session";

export async function POST(request: NextRequest) {
  const { instance, account } = await authProvider.authenticate();

  if (account) {
    await instance.getTokenCache().removeAccount(account);
  }

  const session = await getSession(headers().get("Cookie"));

  return NextResponse.redirect(new URL("/", request.url), {
    status: 303,
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
