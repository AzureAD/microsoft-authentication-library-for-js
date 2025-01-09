import fs from "fs";
import dotenv from "dotenv";
import express, { Express, Request, Response, NextFunction } from "express";
import { createClient, RedisClientType } from "redis";
import {
    PerformanceObserver,
    PerformanceObserverEntryList,
    PerformanceEntry,
} from "perf_hooks";

import { AuthProvider, AppConfig } from "./AuthProvider";
import { isAuthorized } from "./middleware";
import AxiosHelper from "./AxiosHelper";

export const port = process.env.PORT || 5000;
export const app: Express = express();

dotenv.config();

const appConfig: AppConfig = {
    instance: process.env.INSTANCE || "ENTER_CLOUD_INSTANCE_HERE",
    tenantId: process.env.TENANT_ID || "ENTER_TENANT_ID_HERE",
    clientId: process.env.CLIENT_ID || "ENTER_CLIENT_ID_HERE",
    clientSecret: process.env.CLIENT_SECRET || "ENTER_CLIENT_SECRET_HERE",
    permissions: process.env.PERMISSIONS || "ENTER_REQUIRED_PERMISSIONS_HERE", // e.g. "access_as_user"
};

async function main() {
    initializePerformanceObserver();
    const cacheClient = await initializeRedisClient();
    const authProvider = await AuthProvider.initialize(appConfig, cacheClient);

    app.get(
        "/obo",
        isAuthorized(appConfig), // check if the access token is valid
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tokenResponse = await authProvider.getToken({
                    oboAssertion: req.headers.authorization?.split(" ")[1]!,
                    scopes: ["User.Read"],
                });

                const graphResponse = await AxiosHelper.callDownstreamApi(
                    "https://graph.microsoft.com/v1.0/me",
                    tokenResponse?.accessToken
                );

                res.json(graphResponse);
            } catch (error) {
                next(error);
            }
        },
        (error: any, req: Request, res: Response, next: NextFunction) => {
            /**
             * Add your custom error handling logic here. For more information, see:
             * http://expressjs.com/en/guide/error-handling.html
             */

            // set locals, only providing error in development
            res.locals.message = error.message;
            res.locals.error =
                req.app.get("env") === "development" ? error : {};

            // send error response
            res.status(error.status || 500).send(error);
        }
    );

    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

function initializePerformanceObserver(): void {
    const perfObserver = new PerformanceObserver(
        (items: PerformanceObserverEntryList) => {
            let durationInCacheInMs = 0;
            let durationTotalInMs = 0;
            let tokenSource;

            items
                .getEntriesByName("beforeCacheAccess")
                .forEach((entry: PerformanceEntry) => {
                    durationInCacheInMs += entry.duration;
                });

            items
                .getEntriesByName("afterCacheAccess")
                .forEach((entry: PerformanceEntry) => {
                    durationInCacheInMs += entry.duration;
                });

            items
                .getEntriesByName("acquireTokenOnBehalfOf-fromNetwork")
                .forEach((entry: PerformanceEntry) => {
                    durationTotalInMs = entry.duration;
                    tokenSource = "network";
                });

            items
                .getEntriesByName("acquireTokenOnBehalfOf-fromCache")
                .forEach((entry: PerformanceEntry) => {
                    durationTotalInMs = entry.duration;
                    tokenSource = "cache";
                });

            if (tokenSource) {
                const results = {
                    tokenSource,
                    durationTotalInMs,
                    durationInCacheInMs,
                    durationInHttpInMs:
                        tokenSource === "network"
                            ? durationTotalInMs - durationInCacheInMs
                            : 0,
                };

                console.log(results);

                fs.appendFile(
                    "benchmarks.json",
                    `${JSON.stringify(results)}\n`,
                    function (error) {
                        if (error) {
                            throw error;
                        }
                    }
                );
            }
        }
    );

    perfObserver.observe({ entryTypes: ["measure"], buffered: true });
}

async function initializeRedisClient(): Promise<RedisClientType> {
    /**
     * Configure connection strategy and other settings. See:
     * https://github.com/redis/node-redis/blob/master/docs/client-configuration.md
     */
    const redis = createClient({
        socket: {
            reconnectStrategy: false,
        },
    });

    redis.on("error", (error: any) => console.log("Redis Client Error", error));

    await redis.connect();
    return redis as RedisClientType;
}

main();
