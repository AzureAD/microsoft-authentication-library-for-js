import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { loginRequest } from "~/serverConfig";
import { authProvider } from "~/services/auth";

export async function GET(request: NextRequest) {
  const returnTo = new URL("/", request.url).toString();

  redirect(await authProvider.getAuthCodeUrl(loginRequest, returnTo));
}
