/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NetworkResponse } from "./NetworkResponse.js";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse.js";
import * as Constants from "../utils/Constants.js";
import { CacheManager } from "../cache/CacheManager.js";
import { ServerError } from "../error/ServerError.js";
import {
    getRequestThumbprint,
    RequestThumbprint,
} from "./RequestThumbprint.js";
import { ThrottlingEntity } from "../cache/entities/ThrottlingEntity.js";
import { BaseAuthRequest } from "../request/BaseAuthRequest.js";

/** @internal */
export class ThrottlingUtils {
    /**
     * Prepares a RequestThumbprint to be stored as a key.
     * @param thumbprint
     */
    static generateThrottlingStorageKey(thumbprint: RequestThumbprint): string {
        return `${Constants.THROTTLING_PREFIX}.${JSON.stringify(thumbprint)}`;
    }

    /**
     * Prepares an app-wide throttling key that ignores any user component
     * (homeAccountIdentifier). This is used for service-directed throttling
     * (HTTP 429 / Retry-After) which applies to the whole application.
     * @param thumbprint
     */
    static generateAppWideThrottlingStorageKey(
        thumbprint: RequestThumbprint
    ): string {
        const appWideThumbprint: RequestThumbprint = { ...thumbprint };
        delete appWideThumbprint.homeAccountIdentifier;
        return ThrottlingUtils.generateThrottlingStorageKey(appWideThumbprint);
    }

    /**
     * Throws a ServerError if there is a live throttling entry for the given key,
     * removing it first if it has expired.
     * @param cacheManager
     * @param key
     * @param correlationId
     */
    private static throttleIfCached(
        cacheManager: CacheManager,
        key: string,
        correlationId: string
    ): void {
        const value = cacheManager.getThrottlingCache(key, correlationId);

        if (value) {
            if (value.throttleTime < Date.now()) {
                cacheManager.removeItem(key, correlationId);
                return;
            }
            throw new ServerError(
                value.errorCodes?.join(" ") || "",
                correlationId,
                value.errorMessage,
                value.subError
            );
        }
    }

    /**
     * Performs necessary throttling checks before a network request.
     * @param cacheManager
     * @param thumbprint
     */
    static preProcess(
        cacheManager: CacheManager,
        thumbprint: RequestThumbprint,
        correlationId: string
    ): void {
        // Service-directed throttles (HTTP 429 / Retry-After) are stored app-wide.
        const appWideKey =
            ThrottlingUtils.generateAppWideThrottlingStorageKey(thumbprint);
        ThrottlingUtils.throttleIfCached(
            cacheManager,
            appWideKey,
            correlationId
        );

        /*
         * Error-class throttles (HTTP 5xx) are stored per-user so one user's failure does
         * not throttle a different user sharing the same clientId/authority/scopes.
         * Only check the user-aware key when it actually differs (i.e. a user component exists).
         */
        const userAwareKey =
            ThrottlingUtils.generateThrottlingStorageKey(thumbprint);
        if (userAwareKey !== appWideKey) {
            ThrottlingUtils.throttleIfCached(
                cacheManager,
                userAwareKey,
                correlationId
            );
        }
    }

    /**
     * Performs necessary throttling checks after a network request.
     * @param cacheManager
     * @param thumbprint
     * @param response
     */
    static postProcess(
        cacheManager: CacheManager,
        thumbprint: RequestThumbprint,
        response: NetworkResponse<ServerAuthorizationTokenResponse>,
        correlationId: string
    ): void {
        /*
         * HTTP 429 and explicit Retry-After are service-directed rate limiting for the whole
         * application, so they are throttled app-wide.
         */
        const isServiceThrottle =
            response.status === 429 ||
            ThrottlingUtils.checkResponseForRetryAfter(response);

        /*
         * HTTP 5xx (without a Retry-After) is a server/credential error that can be specific to a
         * single user (e.g. a federated STS returning HTTP 500 for one user's bad password), so it
         * is throttled per-user to avoid blocking other users.
         */
        const isServerError =
            !isServiceThrottle &&
            response.status >= 500 &&
            response.status < 600;

        if (isServiceThrottle || isServerError) {
            const thumbprintValue: ThrottlingEntity = {
                throttleTime: ThrottlingUtils.calculateThrottleTime(
                    parseInt(
                        response.headers[Constants.HeaderNames.RETRY_AFTER]
                    )
                ),
                error: response.body.error,
                errorCodes: response.body.error_codes,
                errorMessage: response.body.error_description,
                subError: response.body.suberror,
            };

            const key = isServerError
                ? ThrottlingUtils.generateThrottlingStorageKey(thumbprint)
                : ThrottlingUtils.generateAppWideThrottlingStorageKey(
                      thumbprint
                  );

            cacheManager.setThrottlingCache(
                key,
                thumbprintValue,
                correlationId
            );
        }
    }

    /**
     * Checks a NetworkResponse object's status codes against 429 or 5xx
     * @param response
     */
    static checkResponseStatus(
        response: NetworkResponse<ServerAuthorizationTokenResponse>
    ): boolean {
        return (
            response.status === 429 ||
            (response.status >= 500 && response.status < 600)
        );
    }

    /**
     * Checks a NetworkResponse object's RetryAfter header
     * @param response
     */
    static checkResponseForRetryAfter(
        response: NetworkResponse<ServerAuthorizationTokenResponse>
    ): boolean {
        if (response.headers) {
            return (
                response.headers.hasOwnProperty(
                    Constants.HeaderNames.RETRY_AFTER
                ) &&
                (response.status < 200 || response.status >= 300)
            );
        }
        return false;
    }

    /**
     * Calculates the Unix-time value for a throttle to expire given throttleTime in seconds.
     * @param throttleTime
     */
    static calculateThrottleTime(throttleTime: number): number {
        const time = throttleTime <= 0 ? 0 : throttleTime;

        const currentSeconds = Date.now() / 1000;
        return Math.floor(
            Math.min(
                currentSeconds +
                    (time || Constants.DEFAULT_THROTTLE_TIME_SECONDS),
                currentSeconds + Constants.DEFAULT_MAX_THROTTLE_TIME_SECONDS
            ) * 1000
        );
    }

    static removeThrottle(
        cacheManager: CacheManager,
        clientId: string,
        request: BaseAuthRequest,
        homeAccountIdentifier?: string
    ): void {
        const thumbprint = getRequestThumbprint(
            clientId,
            request,
            homeAccountIdentifier
        );

        // Remove both the app-wide (429 / Retry-After) and user-aware (5xx) throttling entries.
        const userAwareKey = this.generateThrottlingStorageKey(thumbprint);
        cacheManager.removeItem(userAwareKey, request.correlationId);

        const appWideKey = this.generateAppWideThrottlingStorageKey(thumbprint);
        if (appWideKey !== userAwareKey) {
            cacheManager.removeItem(appWideKey, request.correlationId);
        }
    }
}
