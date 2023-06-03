import { createCookieSessionStorage } from "@remix-run/node";
import { sessionSecret } from "~/serverConfig";
import "server-only";

export type SessionData = {
  homeAccountId: string;
};

// https://remix.run/docs/en/1.16.1/utils/sessions#createcookiesessionstorage

export const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData>({
    cookie: {
      name: "__session",
      secrets: [sessionSecret],
      sameSite: "lax",
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  });
