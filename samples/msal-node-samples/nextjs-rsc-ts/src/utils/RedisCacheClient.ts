import type { ICacheClient } from "@azure/msal-node";
import type { RedisClientType } from "redis";

export default class RedisCacheClient<
  RedisClient extends RedisClientType<any, any, any>
> implements ICacheClient
{
  client: RedisClient;

  constructor(client: RedisClient) {
    this.client = client;
  }

  async get(key: string) {
    if (!key) {
      return "";
    }

    await this.ensureConnected();

    const value = await this.client.get(key);

    return value ?? "";
  }

  async set(key: string, value: string) {
    if (!key) {
      return value;
    }

    await this.ensureConnected();

    const cacheValue = await this.client.set(key, value);

    if (!cacheValue) {
      throw new Error("Couldn't set cache for key " + key);
    }

    return cacheValue;
  }

  async ensureConnected() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }
}
