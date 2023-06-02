import { Configuration } from "@azure/msal-node";
import { SessionPartitionManager } from "../utils/SessionPartitionManager";
import RedisCacheClient from "../utils/RedisCacheClient";
import { redisClient } from "./redis";
import { AuthProvider } from "~/utils/AuthProvider";
import { getSession } from "./session";
import { cookies } from "next/headers";

const clientId = process.env.AZURE_AD_CLIENT_ID;
const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
const tenantId = process.env.AZURE_AD_TENANT_ID ?? "common";

if (!clientId || !clientSecret) {
  throw new Error(
    "Missing AZURE_AD_CLIENT_ID or AZURE_AD_CLIENT_SECRET environment variable."
  );
}

export const msalConfig: Configuration = {
  auth: {
    clientId,
    clientSecret,
    authority: `https://login.microsoftonline.com/${tenantId}`,
  },
};

export const codeRequest = {
  scopes: ["User.Read"],
};

async function partitionManagerFactory() {
  const cookie = cookies().get("__session");

  const session = await getSession(`__session=${cookie?.value}`);

  return new SessionPartitionManager(session);
}

export const authProvider = new AuthProvider(
  msalConfig,
  "http://localhost:3000/auth/callback",
  new RedisCacheClient(redisClient),
  partitionManagerFactory
);
