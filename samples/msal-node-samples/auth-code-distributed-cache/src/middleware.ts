/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UrlString } from "@azure/msal-common";
import {
    InteractionRequiredAuthError,
    ResponseMode,
    AuthorizationCodeRequest,
} from "@azure/msal-node";
import express, { Request, Response, NextFunction, Router } from "express";

import { AppConfig, AuthProvider } from "./AuthProvider";
import UrlUtils from "./UrlUtils";

type TokenRequest = Omit<AuthorizationCodeRequest, "code" | "redirectUri">;

const EMPTY_STRING = "";

export type AuthOptions = {
    appConfig: AppConfig;
    authProvider: AuthProvider;
    protectedResources: {
        [route: string]: [string, TokenRequest];
    };
};

export const auth = (options: AuthOptions): Router => {
    const appRouter = express.Router();

    // ensure session is available
    appRouter.use((req: Request, res: Response, next: NextFunction) => {
        if (!req.session) {
            throw new Error(
                "Session not found. Please check your session middleware configuration."
            );
        }

        res.locals.originalUrl = `${req.protocol}://${req.get("host")}`;

        next();
    });

    // handle redirect response from AAD
    appRouter.post(
        UrlUtils.getPathFromUrl(options.appConfig.redirectUri),
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const tokenResponse =
                    await options.authProvider.getTokenInteractive(
                        {
                            ...req.session.tokenRequest!,
                            code: req.body.code,
                        },
                        req.body,
                        req.session.id
                    );

                req.session.isAuthenticated = true;
                req.session.account = tokenResponse?.account!; // account won't be null in this grant type

                res.redirect(res.locals.originalUrl); // redirect back to original route
            } catch (error) {
                next(error);
            }
        }
    );

    // ensure user is authenticated
    appRouter.use(async (req: Request, res: Response, next: NextFunction) => {
        const isRedirectUri =
            UrlUtils.getCanonicalUrlFromRequest(req) ===
            UrlString.canonicalizeUri(options.appConfig.redirectUri);

        if (!req.session.isAuthenticated && !isRedirectUri) {
            const { authCodeUrl, state } =
                await options.authProvider.prepareTokenRequest(
                    {
                        responseMode: ResponseMode.FORM_POST,
                        redirectUri: options.appConfig.redirectUri,
                        scopes: [],
                    },
                    req.session.id
                );

            req.session.tokenRequest = {
                redirectUri: options.appConfig.redirectUri,
                scopes: [],
                state,
                code: EMPTY_STRING,
            }; // save token request params to session, which will be used to acquire token after redirect

            return res.redirect(authCodeUrl);
        }

        next();
    });

    // acquire token for routes calling protected resources
    Object.entries(options.protectedResources).forEach((value) => {
        const [route, [resource, tokenRequest]] = value;

        appRouter.get(
            route,
            async (req: Request, res: Response, next: NextFunction) => {
                try {
                    if (
                        tokenRequest.authority &&
                        !tokenRequest.authority.includes(
                            options.appConfig.tenantId
                        )
                    ) {
                        throw new InteractionRequiredAuthError(
                            "New authority set - requires interaction."
                        );
                    }

                    const tokenResponse =
                        await options.authProvider.getTokenSilent(
                            {
                                ...tokenRequest,
                                account: req.session.account!,
                            },
                            req.session.id
                        );

                    req.session.protectedResources = {
                        ...req.session.protectedResources,
                        [resource]: {
                            callingRoute: route,
                            accessToken: tokenResponse?.accessToken!,
                        },
                    };

                    next();
                } catch (error) {
                    if (error instanceof InteractionRequiredAuthError) {
                        const { authCodeUrl, state } =
                            await options.authProvider.prepareTokenRequest(
                                {
                                    ...tokenRequest,
                                    responseMode: ResponseMode.FORM_POST,
                                    redirectUri: options.appConfig.redirectUri,
                                },
                                req.session.id,
                                route
                            );

                        req.session.tokenRequest = {
                            ...tokenRequest,
                            redirectUri: options.appConfig.redirectUri,
                            state,
                            code: EMPTY_STRING,
                        }; // save token request params to session, which will be used to acquire token after redirect

                        return res.redirect(authCodeUrl);
                    }

                    next(error);
                }
            }
        );
    });

    return appRouter;
};
