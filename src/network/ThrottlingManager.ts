/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule, NetworkRequestOptions } from "./INetworkModule";
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { Constants, HeaderNames } from "../utils/Constants";
import { RequestThumbprint } from "./RequestThumbprint";
import { RequestThumbprintValue } from "./RequestThumbprintValue";
import { AuthError } from "../error/AuthError";

export type NetworkResponse<T> = {
    headers: Map<string, string>;
    body: T;
    status: number;
};

export abstract class ThrottlingManager {
    protected networkClient: INetworkModule;
    abstract getThrottlingItem(thumbprint: RequestThumbprint): RequestThumbprintValue | null;
    abstract setThrottlingItem(thumbprint: RequestThumbprint, thumbprintValue: RequestThumbprintValue): void;
    abstract removeThrottlingItem(thumbprint: RequestThumbprint): boolean;

    constructor(networkClient: INetworkModule) {
        this.networkClient = networkClient;
    }

    public async sendPostRequest<T>(thumbprint: RequestThumbprint, tokenEndpoint: string, options: NetworkRequestOptions): Promise<NetworkResponse<T>> {

        this.preProcess(thumbprint);
        const response = await this.networkClient.sendPostRequestAsync<T>(tokenEndpoint, options);
        this.postProcess(thumbprint, response);

        return response;
    }

    public preProcess(thumbprint: RequestThumbprint): void {
        const storageValue = this.getThrottlingItem(thumbprint);

        if (storageValue) {
            if (storageValue.throttleTime >= Date.now()) {
                this.removeThrottlingItem(thumbprint);
                return;
            }
            // TODO: implement this error
            // ThrottleError extends ServerError and adds a message about how long the request is throttled for
            // throw new ThrottleError(storageValue.throttleTime, storageValue.error, storageValue.errorDescription, storageValue.subError);
        }
    }    

    public postProcess(thumbprint: RequestThumbprint, response: NetworkResponse<ServerAuthorizationTokenResponse>): void {
        if (this.checkResponseForThrottle(response)) {
            const thumbprintValue = new RequestThumbprintValue(
                this.calculateThrottleTime(parseInt(response.headers.get(HeaderNames.RETRY_AFTER))),
                response.body.error,
                response.body.error_codes,
                response.body.error_description,
                response.body.suberror
            );
            this.setThrottlingItem(thumbprint, thumbprintValue);
        }
    }

    private checkResponseForThrottle(response: NetworkResponse<ServerAuthorizationTokenResponse>): boolean {
        if (response.status == 429 || response.status >= 500 && response.status < 600) {
            return true;
        }

        if (response.headers.has(HeaderNames.RETRY_AFTER) && response.status < 200 && response.status >= 300) {
            return true;
        }

        return false;
    }

    private calculateThrottleTime(throttleTime: number): number {
        return Math.min(throttleTime || Date.now() + Constants.DEFAULT_THROTTLE_TIME_MS, Constants.DEFAULT_MAX_THROTTLE_TIME_MS);
    }
}

export class DefaultThrottlingManager extends ThrottlingManager {
    getThrottlingItem(): RequestThumbprintValue | null {
        const notImplErr = "Throttling abstract class - getThrottlingItem() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    setThrottlingItem(): void {
        const notImplErr = "Throttling abstract class - setThrottlingItem() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    }
    removeThrottlingItem(): boolean {
        const notImplErr = "Throttling abstract class - removeThrottlingItem() has not been implemented";
        throw AuthError.createUnexpectedError(notImplErr);
    }
}
