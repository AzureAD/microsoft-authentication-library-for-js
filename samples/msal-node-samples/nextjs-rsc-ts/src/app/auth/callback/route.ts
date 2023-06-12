import { NextRequest, NextResponse } from "next/server";
import { authProvider } from "~/services/auth";
import { commitSession, getSession } from "~/services/session";

// forcing dynamic because of header/cookie usage
// if this is not set a build error occurs
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { account, returnTo } = await authProvider.handleAuthCodeCallback(
      await request.formData()
    );

    if (!account) {
      throw new Error("No account found");
    }

    const session = await getSession(request.headers.get("Cookie"));

    session.set("homeAccountId", account.homeAccountId);

    return NextResponse.redirect(returnTo, {
      status: 303,
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    console.error(error);
  }
}
