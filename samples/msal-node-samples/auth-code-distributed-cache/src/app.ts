/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { PerformanceObserver, PerformanceObserverEntryList, PerformanceEntry } from "perf_hooks";
import express, { Express, NextFunction, Request, Response } from "express";
import session from "express-session";
import RedisStore from "connect-redis"
import { createClient, RedisClientType } from "redis";
import { AccountInfo, AuthorizationCodeRequest } from "@azure/msal-node";

import { AppConfig, AuthProvider } from "./AuthProvider";
import { auth } from "./middleware";
import AxiosHelper from "./AxiosHelper";

declare module 'express-session' {
    interface SessionData {
        id: string;
        isAuthenticated: boolean;
        account: AccountInfo;
        tokenRequest: AuthorizationCodeRequest;
        protectedResources: Record<string, {
            accessToken: string;
            callingRoute: string;
        }>;
    }
}

export const port = process.env.PORT || 3000;
export const app: Express = express();

dotenv.config();

const appConfig: AppConfig = {
    instance: process.env.INSTANCE || "ENTER_CLOUD_INSTANCE_HERE",
    tenantId: process.env.TENANT_ID || "ENTER_TENANT_ID_HERE",
    clientId: process.env.CLIENT_ID || "ENTER_CLIENT_ID_HERE",
    clientSecret: process.env.CLIENT_SECRET || "ENTER_CLIENT_SECRET_HERE",
    redirectUri: process.env.REDIRECT_URI || "ENTER_REDIRECT_URI_HERE",
};

async function main() {
    initializePerformanceObserver();
    const cacheClient = await initializeRedisClient();
    const authProvider = await AuthProvider.initialize(appConfig, cacheClient);

    /**
     * Using express-session middleware for persistent user session. Be sure to
     * familiarize yourself with available options. Visit: https://www.npmjs.com/package/express-session
     */
    app.use(session({
        store: new RedisStore({ client: cacheClient }),
        secret: process.env.CLIENT_SECRET || "ENTER_SESSION_SECRET_HERE",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false, // set this to true on production
        }
    }));

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'hbs');

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(express.static(path.join(__dirname, 'public')));

    /**
     * Custom middleware to handle authentication and authorization
     * using express session and MSAL Node CCA acquireToken* APIs.
     */
    app.use(auth({
        appConfig,
        authProvider,
        protectedResources: {
            "/call-graph-direct": ["https://graph.microsoft.com/v1.0/me", ["User.Read"]],
            "/call-graph-on-behalf": ["http://localhost:5000/obo", ["api://ENTER_API_CLIENT_ID_HERE/access_as_user"]],
        }
    }));

    app.get('/call-graph-direct', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const graphResponse = await AxiosHelper.callDownstreamApi(
                "https://graph.microsoft.com/v1.0/me",
                req.session.protectedResources ? req.session.protectedResources["https://graph.microsoft.com/v1.0/me"].accessToken : undefined
            );

            res.render('profile', { profile: graphResponse })
        } catch (error) {
            next(error);
        }
    });

    app.get('/call-graph-on-behalf', async (req: Request, res: Response, next: NextFunction) => {
        try {
            const graphResponse = await AxiosHelper.callDownstreamApi(
                "http://localhost:5000/obo",
                req.session.protectedResources ? req.session.protectedResources["http://localhost:5000/obo"].accessToken : undefined
            );

            res.render('profile', { profile: graphResponse })
        } catch (error) {
            next(error);
        }
    });

    app.get('/', (req: Request, res: Response) => {
        res.render('index', {
            title: 'MSAL Node & Express Web App',
            isAuthenticated: req.session.isAuthenticated,
            username: req.session.account?.username,
        });
    });

    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });

    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

function initializePerformanceObserver(): void {
    const perfObserver = new PerformanceObserver((items: PerformanceObserverEntryList) => {
        let durationTotalInMs = 0;
        let tokenSource;

        items.getEntriesByName("acquireTokenByCode").forEach((entry: PerformanceEntry) => {
            durationTotalInMs = entry.duration;
            tokenSource = "network";
        });

        items.getEntriesByName("acquireTokenSilent").forEach((entry: PerformanceEntry) => {
            durationTotalInMs = entry.duration;
            tokenSource = "cache";
        });

        const results = {
            tokenSource,
            durationTotalInMs
        };

        fs.appendFile(
            "benchmarks.json",
            `${JSON.stringify(results)}\n`,
            function (err) {
                if (err) {
                    throw err;
                }
            }
        );
    });

    perfObserver.observe({ entryTypes: ["measure"], buffered: true });
}

async function initializeRedisClient(): Promise<RedisClientType> {
    /**
     * Configure connection strategy and other settings. See:
     * https://github.com/redis/node-redis/blob/master/docs/client-configuration.md
     */
    const redis = createClient({
        socket: {
            reconnectStrategy: false
        }
    });

    redis.on('error', (err: any) => console.log('Redis Client Error', err));

    await redis.connect();
    return redis as RedisClientType;
}

main();
