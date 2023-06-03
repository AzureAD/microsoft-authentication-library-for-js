import { SessionPartitionManager } from "../utils/SessionPartitionManager";
import RedisCacheClient from "../utils/RedisCacheClient";
import { redisClient } from "./redis";
import { AuthProvider } from "~/utils/AuthProvider";
import { getSession } from "./session";
import { cookies } from "next/headers";
import { authCallbackUri, msalConfig } from "~/serverConfig";

async function partitionManagerFactory() {
  const cookie = cookies().get("__session");

  const session = await getSession(`__session=${cookie?.value}`);

  return new SessionPartitionManager(session);
}

export const authProvider = new AuthProvider(
  msalConfig,
  authCallbackUri,
  new RedisCacheClient(redisClient),
  partitionManagerFactory
);
