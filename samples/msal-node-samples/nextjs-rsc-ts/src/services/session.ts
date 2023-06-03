import { createCookieSessionStorage } from "@remix-run/node";
import { sessionSecret } from "~/serverConfig";

export type SessionData = {
  homeAccountId: string;
};

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
