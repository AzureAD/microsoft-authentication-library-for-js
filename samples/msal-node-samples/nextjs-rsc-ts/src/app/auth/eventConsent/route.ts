import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { calendarRequest } from "~/serverConfig";
import { authProvider } from "~/services/auth";

export async function GET(request: NextRequest) {
  const returnTo = new URL("/event", request.url).toString();

  redirect(await authProvider.getAuthCodeUrl(calendarRequest, returnTo));
}
