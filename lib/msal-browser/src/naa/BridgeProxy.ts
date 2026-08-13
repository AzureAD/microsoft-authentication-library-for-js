/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthBridge, AuthBridgeResponse } from "./AuthBridge.js";
import { AuthResult } from "./AuthResult.js";
import { BridgeCapabilities } from "./BridgeCapabilities.js";
import { AccountContext } from "./BridgeAccountContext.js";
import { BridgeError } from "./BridgeError.js";
import {
    BridgeRequestEnvelope,
    BridgeMethods,
} from "./BridgeRequestEnvelope.js";
import { BridgeResponseEnvelope } from "./BridgeResponseEnvelope.js";
import { BridgeStatusCode } from "./BridgeStatusCode.js";
import { IBridgeProxy } from "./IBridgeProxy.js";
import { InitContext } from "./InitContext.js";
import { TokenRequest } from "./TokenRequest.js";
import * as BrowserCrypto from "../crypto/BrowserCrypto.js";
import { BrowserConstants } from "../utils/BrowserConstants.js";
import { version } from "../packageMetadata.js";
import { IWebBrokerBridgeMessage } from "../webBrokerBridge/IWebBrokerBridgeMessage.js";
import { PendingRequestRegistry } from "../webBrokerBridge/PendingRequestRegistry.js";

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
    /**
     * Correlates outbound bridge requests with inbound responses by
     * `requestId`
     */
    static pendingRegistry =
        new PendingRequestRegistry<BridgeResponseEnvelope>();
    sdkName: string;
    sdkVersion: string;
    capabilities?: BridgeCapabilities;
    accountContext?: AccountContext;

    /**
     * initializeNestedAppAuthBridge - Initializes the bridge to the host app
     * @returns a promise that resolves to an InitializeBridgeResponse or rejects with an Error
     * @remarks This method will be called by the create factory method
     * @remarks If the bridge is not available, this method will throw an error
     */
    protected static async initializeNestedAppAuthBridge(): Promise<InitContext> {
        if (window === undefined) {
            throw new Error("window is undefined");
        }
        if (window.nestedAppAuthBridge === undefined) {
            throw new Error("window.nestedAppAuthBridge is undefined");
        }

        try {
            window.nestedAppAuthBridge.addEventListener(
                "message",
                (response: AuthBridgeResponse) => {
                    const responsePayload =
                        typeof response === "string" ? response : response.data;
                    const responseEnvelope: BridgeResponseEnvelope =
                        JSON.parse(responsePayload);
                    if (responseEnvelope.success) {
                        BridgeProxy.pendingRegistry.resolve(
                            responseEnvelope.requestId,
                            responseEnvelope
                        );
                    } else {
                        BridgeProxy.pendingRegistry.reject(
                            responseEnvelope.requestId,
                            responseEnvelope.error
                        );
                    }
                }
            );

            const bridgeResponse = await BridgeProxy.sendRequestViaRegistry(
                BridgeProxy.buildRequest("GetInitContext")
            );

            return BridgeProxy.validateBridgeResultOrThrow(
                bridgeResponse.initContext
            );
        } catch (error) {
            window.console.log(error);
            throw error;
        }
    }

    /**
     * getTokenInteractive - Attempts to get a token interactively from the bridge
     * @param request A token request
     * @returns a promise that resolves to an auth result or rejects with a BridgeError
     */
    public getTokenInteractive(request: TokenRequest): Promise<AuthResult> {
        return this.getToken("GetTokenPopup", request);
    }

    /**
     * getTokenSilent Attempts to get a token silently from the bridge
     * @param request A token request
     * @returns a promise that resolves to an auth result or rejects with a BridgeError
     */
    public getTokenSilent(request: TokenRequest): Promise<AuthResult> {
        return this.getToken("GetToken", request);
    }

    private async getToken(
        requestType: BridgeMethods,
        request: TokenRequest
    ): Promise<AuthResult> {
        const result = await this.sendRequest(requestType, {
            tokenParams: request,
        });
        return {
            token: BridgeProxy.validateBridgeResultOrThrow(result.token),
            account: BridgeProxy.validateBridgeResultOrThrow(result.account),
        };
    }

    public getHostCapabilities(): BridgeCapabilities | null {
        return this.capabilities ?? null;
    }

    public getAccountContext(): AccountContext | null {
        return this.accountContext ? this.accountContext : null;
    }

    private static buildRequest(
        method: BridgeMethods,
        requestParams?: Partial<BridgeRequestEnvelope>
    ): BridgeRequestEnvelope {
        return {
            messageType: "NestedAppAuthRequest",
            method: method,
            requestId: BrowserCrypto.createNewGuid(),
            sendTime: Date.now(),
            clientLibrary: BrowserConstants.MSAL_SKU,
            clientLibraryVersion: version,
            ...requestParams,
        };
    }

    /**
     * A method used to send a request to the bridge
     * @param request A token request
     * @returns a promise that resolves to a response of provided type or rejects with a BridgeError
     */
    private sendRequest(
        method: BridgeMethods,
        requestParams?: Partial<BridgeRequestEnvelope>
    ): Promise<BridgeResponseEnvelope> {
        return BridgeProxy.sendRequestViaRegistry(
            BridgeProxy.buildRequest(method, requestParams)
        );
    }

    /**
     * Registers `message.requestId` with the shared pending-request
     * registry, then posts the envelope over the host bridge. Resolves
     * with the matching response envelope; rejects with the raw
     * `BridgeError` payload.
     */
    private static sendRequestViaRegistry(
        message: BridgeRequestEnvelope
    ): Promise<BridgeResponseEnvelope> {
        const correlationKey: IWebBrokerBridgeMessage = {
            requestId: message.requestId,
            type: message.method,
        };
        return BridgeProxy.pendingRegistry.sendAndAwait(correlationKey, () => {
            window.nestedAppAuthBridge.postMessage(JSON.stringify(message));
        });
    }

    private static validateBridgeResultOrThrow<T>(input: T | undefined): T {
        if (input === undefined) {
            const bridgeError: BridgeError = {
                status: BridgeStatusCode.NestedAppAuthUnavailable,
            };
            throw bridgeError;
        }
        return input;
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
        accountContext?: AccountContext,
        capabilities?: BridgeCapabilities
    ) {
        this.sdkName = sdkName;
        this.sdkVersion = sdkVersion;
        this.accountContext = accountContext;
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
            response.accountContext,
            response.capabilities
        );
    }
}

export default BridgeProxy;
