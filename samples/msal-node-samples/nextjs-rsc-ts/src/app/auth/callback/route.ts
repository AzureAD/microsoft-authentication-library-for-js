import { NextRequest, NextResponse } from "next/server";
import { authProvider } from "~/services/auth";
import { commitSession, getSession } from "~/services/session";

export async function GET(request: NextRequest) {
  try {
    const { account, returnTo } = await authProvider.handleAuthCodeCallback(
      request.nextUrl
    );

    if (!account) {
      throw new Error("No account found");
    }

    const session = await getSession(request.headers.get("Cookie"));

    session.set("homeAccountId", account.homeAccountId);

    return NextResponse.redirect(returnTo, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    console.error(error);
  }
}
