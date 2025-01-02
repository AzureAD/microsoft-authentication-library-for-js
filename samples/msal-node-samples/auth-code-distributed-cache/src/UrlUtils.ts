/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UrlString, IUri } from "@azure/msal-common";
import { Request } from "express";

class UrlUtils {
    static getCanonicalUrlFromRequest = (req: Request): string => {
        return UrlString.canonicalizeUri(
            `${req.protocol}://${req.get("host")}${req.path}`
        );
    };

    static getPathFromUrl = (url: string): string => {
        const urlComponents: IUri = new UrlString(url).getUrlComponents();
        return `/${urlComponents.PathSegments.join("/")}`;
    };
}

export default UrlUtils;
