/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Request, Response, NextFunction, RequestHandler } from "express";

import { AppConfig } from "./AuthProvider";
import TokenValidator from "./TokenValidator";

export const isAuthorized = (appConfig: AppConfig): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const accessToken = req.headers.authorization?.split(" ")[1];

        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        try {
            const tokenValidator = new TokenValidator(appConfig);
            const isTokenValid = await tokenValidator.validateAccessToken(
                accessToken
            );

            if (!isTokenValid) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};
