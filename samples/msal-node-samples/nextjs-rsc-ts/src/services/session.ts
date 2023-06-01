import { createCookieSessionStorage } from "@remix-run/node";

export type SessionData = {
  homeAccountId: string;
};

const secret = process.env.SESSION_SECRET;

if (!secret) {
  throw new Error("No session secret provided");
}

export const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData>({
    cookie: {
      name: "__session",
      secrets: [secret],
      sameSite: "lax",
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  });
