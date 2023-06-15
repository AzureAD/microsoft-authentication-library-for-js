import { NextRequest, NextResponse } from "next/server";
import { calendarRequest } from "~/serverConfig";
import { authProvider } from "~/services/auth";

export async function POST(request: NextRequest) {
  const returnTo = new URL("/event", request.url).toString();

  return NextResponse.redirect(
    await authProvider.getAuthCodeUrl(calendarRequest, returnTo),
    {
      status: 303,
    }
  );
}
