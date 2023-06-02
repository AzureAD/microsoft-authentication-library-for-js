"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authProvider, codeRequest } from "~/services/auth";
import { getCurrentUrl } from "~/utils/url";

export async function login() {
  redirect(await authProvider.getAuthCodeUrl(codeRequest, getCurrentUrl()));
}

export async function logout() {
  const { instance, account } = await authProvider.authenticate();

  if (account) {
    await instance.getTokenCache().removeAccount(account);
  }

  cookies().delete("__session");
}
