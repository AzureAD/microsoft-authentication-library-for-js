import { NextRequest, NextResponse } from "next/server";
import { loginRequest } from "~/serverConfig";
import { authProvider } from "~/services/auth";

export async function POST(request: NextRequest) {
  const returnTo = new URL("/", request.url).toString();

  return NextResponse.redirect(
    await authProvider.getAuthCodeUrl(loginRequest, returnTo),
    {
      status: 303,
    }
  );
}
