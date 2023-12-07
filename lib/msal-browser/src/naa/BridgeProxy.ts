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
import { AuthBridge, AuthBridgeResponse } from "./AuthBridge";
import { BridgeCapabilities } from "./BridgeCapabilities";
import { BridgeRequest } from "./BridgeRequest";
import { BridgeRequestEnvelope, BridgeMethods } from "./BridgeRequestEnvelope";
import { BridgeResponseEnvelope } from "./BridgeResponseEnvelope";
import { IBridgeProxy } from "./IBridgeProxy";
import { InitializeBridgeResponse } from "./InitializeBridgeResponse";
import { TokenRequest } from "./TokenRequest";
import { TokenResponse } from "./TokenResponse";

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
    capabilities?: BridgeCapabilities;

    /**
     * initializeNestedAppAuthBridge - Initializes the bridge to the host app
     * @returns a promise that resolves to an InitializeBridgeResponse or rejects with an Error
     * @remarks This method will be called by the create factory method
     * @remarks If the bridge is not available, this method will throw an error
     */
    protected static async initializeNestedAppAuthBridge(): Promise<InitializeBridgeResponse> {
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
                (response: AuthBridgeResponse) => {
                    const responsePayload =
                        typeof response === "string" ? response : response.data;
                    const responseEnvelope: BridgeResponseEnvelope =
                        JSON.parse(responsePayload);
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
                        requestId: BridgeProxy.getRandomId(),
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

            return await promise;
        } catch (error) {
            window.console.log(error);
            throw error;
        }
    }

    public static getRandomId(): string {
        return BridgeProxy.crypto.randomUUID();
    }

    /**
     * getTokenInteractive - Attempts to get a token interactively from the bridge
     * @param request A token request
     * @returns a promise that resolves to a token response or rejects with a BridgeError
     */
    public getTokenInteractive(request: TokenRequest): Promise<TokenResponse> {
        return this.sendRequest<TokenResponse>("GetTokenPopup", request);
    }

    /**
     * getTokenSilent Attempts to get a token silently from the bridge
     * @param request A token request
     * @returns a promise that resolves to a token response or rejects with a BridgeError
     */
    public getTokenSilent(request: TokenRequest): Promise<TokenResponse> {
        return this.sendRequest<TokenResponse>("GetToken", request);
    }

    /**
     * getAccountInfo - Gets account information from the bridge
     *
     * @param request A request for account information
     */
    public getAccountInfo(
        request:
            | AccountByHomeIdRequest
            | AccountByLocalIdRequest
            | AccountByUsernameRequest
    ): Promise<AccountInfo> {
        let method: BridgeMethods = "GetAccountByHomeId";

        if ((request as AccountByHomeIdRequest).homeAccountId !== undefined) {
            method = "GetAccountByHomeId";
        }

        if ((request as AccountByLocalIdRequest).localAccountId !== undefined) {
            method = "GetAccountByLocalId";
        }

        if ((request as AccountByUsernameRequest).username !== undefined) {
            method = "GetAccountByUsername";
        }

        return this.sendRequest<AccountInfo>(method, request);
    }

    public getActiveAccount(): Promise<AccountInfo> {
        return this.sendRequest<AccountInfo>("GetActiveAccount", undefined);
    }

    public getHostCapabilities(): BridgeCapabilities | null {
        return this.capabilities ?? null;
    }

    /**
     * A method used to send a request to the bridge
     * @param request A token request
     * @returns a promise that resolves to a response of provided type or rejects with a BridgeError
     */
    private sendRequest<TResponse>(
        method: BridgeMethods,
        request:
            | TokenRequest
            | AccountByHomeIdRequest
            | AccountByLocalIdRequest
            | AccountByUsernameRequest
            | undefined
    ): Promise<TResponse> {
        const message: BridgeRequestEnvelope = {
            messageType: "NestedAppAuthRequest",
            method: method,
            requestId: BridgeProxy.getRandomId(),
            body: request,
        };

        const promise = new Promise<TResponse>((resolve, reject) => {
            const request: BridgeRequest<TResponse> = {
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
     * Private constructor for BridgeProxy
     * @param sdkName The name of the SDK being used to make requests on behalf of the app
     * @param sdkVersion The version of the SDK being used to make requests on behalf of the app
     * @param capabilities The capabilities of the bridge / SDK / platform broker
     */
    private constructor(
        sdkName: string,
        sdkVersion: string,
        capabilities?: BridgeCapabilities
    ) {
        this.sdkName = sdkName;
        this.sdkVersion = sdkVersion;
        this.capabilities = capabilities;
    }

    /**
     * Factory method for creating an implementation of IBridgeProxy
     * @returns A promise that resolves to a BridgeProxy implementation
     */
    public static async create(): Promise<IBridgeProxy> {
        const response = await BridgeProxy.initializeNestedAppAuthBridge();
        return new BridgeProxy(
            response.sdkName,
            response.sdkVersion,
            response.capabilities
        );
    }
}

export default BridgeProxy;
