import { createClient } from "redis";
import "server-only";

export const redisClient = createClient();

redisClient.on("error", (err) => console.log("Redis Client Error", err));
