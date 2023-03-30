/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "./AccountInfo";
import {
    AccountByHomeIdRequest,
    AccountByLocalIdRequest,
    AccountByUsernameRequest,
} from "./AccountRequests";
import { BridgeCapabilities } from "./BridgeCapabilities";
import { BridgeRequest } from "./BridgeRequest";
import { BridgeRequestEnvelope, BridgeMethods } from "./BridgeRequestEnvelope";
import { BridgeResponseEnvelope } from "./BridgeResponseEnvelope";
import { IBridgeProxy } from "./IBridgeProxy";
import { InitializeBridgeResponse } from "./InitializeBridgeResponse";
import { TokenRequest } from "./TokenRequest";
import { TokenResponse } from "./TokenResponse";
import { AuthBridge } from "./AuthBridge";

declare global {
    interface Window {
        nestedAppAuthBridge: AuthBridge;
    }
}

/**
 * BridgeProxy
 * Provides a proxy for accessing a bridge to a host app and/or
 * platform broker
 */
export class BridgeProxy implements IBridgeProxy {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static bridgeRequests: any[] = [];
    static crypto: Crypto;
    sdkName: string;
    sdkVersion: string;
    capabilities: BridgeCapabilities;

    private static async initializeNestedAppAuthBridge(): Promise<InitializeBridgeResponse> {
        if (window === undefined) {
            throw new Error("window is undefined");
        }
        if (window.nestedAppAuthBridge === undefined) {
            throw new Error("window.nestedAppAuthBridge is undefined");
        }
        if (window.crypto === undefined) {
            throw new Error("window.crypto is undefined");
        }

        try {
            BridgeProxy.crypto = window.crypto;

            window.nestedAppAuthBridge.addEventListener(
                "message",
                (response: string) => {
                    window.console.log(response);
                    const responseEnvelope: BridgeResponseEnvelope =
                        JSON.parse(response);
                    const request = BridgeProxy.bridgeRequests.find(
                        (element) =>
                            element.requestId === responseEnvelope.requestId
                    );
                    if (request !== undefined) {
                        BridgeProxy.bridgeRequests.splice(
                            BridgeProxy.bridgeRequests.indexOf(request),
                            1
                        );
                        if (responseEnvelope.success) {
                            request.resolve(responseEnvelope.body);
                        } else {
                            request.reject(responseEnvelope.body);
                        }
                    }
                }
            );

            const promise = new Promise<InitializeBridgeResponse>(
                (resolve, reject) => {
                    const message: BridgeRequestEnvelope = {
                        messageType: "NestedAppAuthRequest",
                        method: "GetInitContext",
                        requestId: BridgeProxy.crypto.randomUUID(),
                    };
                    const request: BridgeRequest<InitializeBridgeResponse> = {
                        requestId: message.requestId,
                        method: message.method,
                        resolve: resolve,
                        reject: reject,
                    };
                    BridgeProxy.bridgeRequests.push(request);
                    window.nestedAppAuthBridge.postMessage(
                        JSON.stringify(message)
                    );
                }
            );

            return promise;
        } catch (error) {
            window.console.log(error);
            throw error;
        }
    }

    /**
     * acquireToken
     * @param request A token request
     */
    public acquireToken(request: TokenRequest): Promise<TokenResponse> {
        const message: BridgeRequestEnvelope = {
            messageType: "NestedAppAuthRequest",
            method: "GetToken",
            requestId: BridgeProxy.crypto.randomUUID(),
            apiKey: "test_key",
            body: request,
        };

        const promise = new Promise<TokenResponse>((resolve, reject) => {
            const request: BridgeRequest<TokenResponse> = {
                requestId: message.requestId,
                method: message.method,
                resolve: resolve,
                reject: reject,
            };
            BridgeProxy.bridgeRequests.push(request);
            window.nestedAppAuthBridge.postMessage(JSON.stringify(message));
        });

        return promise;
    }

    /**
     * getAccountInfo
     * @param request A request for account information
     */
    public getAccountInfo(
        request:
        | AccountByHomeIdRequest
        | AccountByLocalIdRequest
        | AccountByUsernameRequest
    ): Promise<AccountInfo> {
        let method: BridgeMethods;

        if ((request as AccountByHomeIdRequest).homeAccountId !== undefined) {
            method = "GetAccountByHomeId";
        }

        if ((request as AccountByLocalIdRequest).localAccountId !== undefined) {
            method = "GetAccountByLocalId";
        }

        if ((request as AccountByUsernameRequest).username !== undefined) {
            method = "GetAccountByUsername";
        }

        const message: BridgeRequestEnvelope = {
            messageType: "NestedAppAuthRequest",
            method: method,
            requestId: BridgeProxy.crypto.randomUUID(),
            body: request,
        };

        const promise = new Promise<AccountInfo>((resolve, reject) => {
            const request: BridgeRequest<AccountInfo> = {
                requestId: message.requestId,
                method: message.method,
                resolve: resolve,
                reject: reject,
            };
            BridgeProxy.bridgeRequests.push(request);
            window.nestedAppAuthBridge.postMessage(JSON.stringify(message));
        });

        return promise;
    }

    private constructor(
        sdkName: string,
        sdkVersion: string,
        capabilities: BridgeCapabilities
    ) {
        this.sdkName = sdkName;
        this.sdkVersion = sdkVersion;
        this.capabilities = capabilities;
    }

    // Factory method
    public static async create(): Promise<IBridgeProxy> {
        const response = await BridgeProxy.initializeNestedAppAuthBridge();
        return new BridgeProxy(
            response.sdkName,
            response.sdkVersion,
            response.capabilities
        );
    }
}
