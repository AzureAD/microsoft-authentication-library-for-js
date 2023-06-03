// https://nextjs.org/docs/getting-started/react-essentials#the-server-only-package
// importing server-only as this module contains secrets that should not be exposed to the client
import { Configuration } from "@azure/msal-node";
import "server-only";

export const graphConfig = {
  meEndpoint: "https://graph.microsoft.com/v1.0/me",
  eventEndpoint: "https://graph.microsoft.com/v1.0/me/calendar/events?$top=1",
};

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
    authority:
      process.env.AZURE_AD_AUTHORITY ??
      "https://login.microsoftonline.com/common",
  },
};

export const loginRequest = {
  scopes: ["User.Read"],
};

export const calendarRequest = {
  scopes: ["Calendars.Read"],
};

export const authCallbackUri = "http://localhost:3000/auth/callback";

export const sessionSecret = process.env.SESSION_SECRET!;
