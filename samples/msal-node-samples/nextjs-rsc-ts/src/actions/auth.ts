"use server";

import { AuthorizationUrlRequest } from "@azure/msal-node";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { calendarRequest, loginRequest } from "~/serverConfig";
import { authProvider } from "~/services/auth";
import { getCurrentUrl } from "~/utils/url";

async function acquireToken(
  request: Omit<AuthorizationUrlRequest, "redirectUri">
) {
  redirect(await authProvider.getAuthCodeUrl(request, getCurrentUrl()));
}

export async function acquireCalendarTokenInteractive() {
  await acquireToken(calendarRequest);
}

export async function login() {
  await acquireToken(loginRequest);
}

export async function logout() {
  const { instance, account } = await authProvider.authenticate();

  if (account) {
    await instance.getTokenCache().removeAccount(account);
  }

  cookies().delete("__session");
}
