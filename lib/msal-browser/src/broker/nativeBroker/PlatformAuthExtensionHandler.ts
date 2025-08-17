/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    PlatformAuthConstants,
    NativeExtensionMethod,
} from "../../utils/BrowserConstants.js";
import {
    Logger,
    AuthError,
    createAuthError,
    AuthErrorCodes,
    InProgressPerformanceEvent,
    IPerformanceClient,
} from "@azure/msal-common/browser";
import * as BrowserPerformanceEvents from "../../telemetry/BrowserPerformanceEvents.js";
import {
    NativeExtensionRequest,
    NativeExtensionRequestBody,
    PlatformAuthRequest,
} from "./PlatformAuthRequest.js";
import { createNativeAuthError } from "../../error/NativeAuthError.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../../error/BrowserAuthError.js";
import { createNewGuid } from "../../crypto/BrowserCrypto.js";
import { PlatformAuthResponse } from "./PlatformAuthResponse.js";
import { IPlatformAuthHandler } from "./IPlatformAuthHandler.js";

type ResponseResolvers<T> = {
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (
        value: AuthError | Error | PromiseLike<Error> | PromiseLike<AuthError>
    ) => void;
};

export class PlatformAuthExtensionHandler implements IPlatformAuthHandler {
    private eId: string | undefined;
    private eVer: string | undefined;
    private l: Logger;
    private readonly hsTO: number;
    private tId: number | undefined;
    private res: Map<string, ResponseResolvers<object>>;
    private hsRes: Map<string, ResponseResolvers<void>>;
    private mc: MessageChannel;
    private readonly wl: (event: MessageEvent) => void;
    private readonly pc: IPerformanceClient;
    private readonly he: InProgressPerformanceEvent;
    patType: string;

    constructor(
        logger: Logger,
        handshakeTimeoutMs: number,
        performanceClient: IPerformanceClient,
        extensionId?: string
    ) {
        this.l = logger;
        this.hsTO = handshakeTimeoutMs;
        this.eId = extensionId;
        this.res = new Map(); // Used for non-handshake messages
        this.hsRes = new Map(); // Used for handshake messages
        this.mc = new MessageChannel();
        this.wl = this.onWindowMessage.bind(this); // Window event callback doesn't have access to 'this' unless it's bound
        this.pc = performanceClient;
        this.he = performanceClient.startMeasurement(
            BrowserPerformanceEvents.NativeMessageHandlerHandshake
        );
        this.patType =
            PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER;
    }

    /**
     * Sends a given message to the extension and resolves with the extension response
     * @param request
     */
    async sendMessage(
        request: PlatformAuthRequest
    ): Promise<PlatformAuthResponse> {
        this.l.trace(this.patType + " - sendMessage called.");

        // fall back to native calls
        const messageBody: NativeExtensionRequestBody = {
            method: NativeExtensionMethod.GetToken,
            request: request,
        };

        const req: NativeExtensionRequest = {
            channel: PlatformAuthConstants.CHANNEL_ID,
            extensionId: this.eId,
            responseId: createNewGuid(),
            body: messageBody,
        };

        this.l.trace(
            this.patType + " - Sending request to browser extension"
        );
        this.l.tracePii(
            this.patType +
                ` - Sending request to browser extension: ${JSON.stringify(
                    req
                )}`
        );
        this.mc.port1.postMessage(req);

        const response: object = await new Promise((resolve, reject) => {
            this.res.set(req.responseId, { resolve, reject });
        });

        const validatedResponse: PlatformAuthResponse =
            this.validatePlatformBrokerResponse(response);

        return validatedResponse;
    }

    /**
     * Returns an instance of the MessageHandler that has successfully established a connection with an extension
     * @param {Logger} logger
     * @param {number} handshakeTimeoutMs
     * @param {IPerformanceClient} performanceClient
     * @param {ICrypto} crypto
     */
    static async createProvider(
        logger: Logger,
        handshakeTimeoutMs: number,
        performanceClient: IPerformanceClient
    ): Promise<PlatformAuthExtensionHandler> {
        logger.trace("PlatformAuthExtensionHandler - createProvider called.");

        try {
            const preferredProvider = new PlatformAuthExtensionHandler(
                logger,
                handshakeTimeoutMs,
                performanceClient,
                PlatformAuthConstants.PREFERRED_EXTENSION_ID
            );
            await preferredProvider.sendHandshakeRequest();
            return preferredProvider;
        } catch (e) {
            // If preferred extension fails for whatever reason, fallback to using any installed extension
            const backupProvider = new PlatformAuthExtensionHandler(
                logger,
                handshakeTimeoutMs,
                performanceClient
            );
            await backupProvider.sendHandshakeRequest();
            return backupProvider;
        }
    }

    /**
     * Send handshake request helper.
     */
    private async sendHandshakeRequest(): Promise<void> {
        this.l.trace(
            this.patType + " - sendHandshakeRequest called."
        );
        // Register this event listener before sending handshake
        window.addEventListener("message", this.wl, false); // false is important, because content script message processing should work first

        const req: NativeExtensionRequest = {
            channel: PlatformAuthConstants.CHANNEL_ID,
            extensionId: this.eId,
            responseId: createNewGuid(),
            body: {
                method: NativeExtensionMethod.HandshakeRequest,
            },
        };
        this.he.add({
            extensionId: this.eId,
            extensionHandshakeTimeoutMs: this.hsTO,
        });

        this.mc.port1.onmessage = (event) => {
            this.onChannelMessage(event);
        };

        window.postMessage(req, window.origin, [this.mc.port2]);

        return new Promise((resolve, reject) => {
            this.hsRes.set(req.responseId, { resolve, reject });
            this.tId = window.setTimeout(() => {
                /*
                 * Throw an error if neither HandshakeResponse nor original Handshake request are received in a reasonable timeframe.
                 * This typically suggests an event handler stopped propagation of the Handshake request but did not respond to it on the MessageChannel port
                 */
                window.removeEventListener(
                    "message",
                    this.wl,
                    false
                );
                this.mc.port1.close();
                this.mc.port2.close();
                this.he.end({
                    extensionHandshakeTimedOut: true,
                    success: false,
                });
                reject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.nativeHandshakeTimeout
                    )
                );
                this.hsRes.delete(req.responseId);
            }, this.hsTO); // Use a reasonable timeout in milliseconds here
        });
    }

    /**
     * Invoked when a message is posted to the window. If a handshake request is received it means the extension is not installed.
     * @param event
     */
    private onWindowMessage(event: MessageEvent): void {
        this.l.trace(this.patType + " - onWindowMessage called");
        // We only accept messages from ourselves
        if (event.source !== window) {
            return;
        }

        const request = event.data;

        if (
            !request.channel ||
            request.channel !== PlatformAuthConstants.CHANNEL_ID
        ) {
            return;
        }

        if (request.extensionId && request.extensionId !== this.eId) {
            return;
        }

        if (request.body.method === NativeExtensionMethod.HandshakeRequest) {
            const handshakeResolver = this.hsRes.get(
                request.responseId
            );
            /*
             * Filter out responses with no matched resolvers sooner to keep channel ports open while waiting for
             * the proper response.
             */
            if (!handshakeResolver) {
                this.l.trace(
                    this.patType +
                        `.onWindowMessage - resolver can't be found for request ${request.responseId}`
                );
                return;
            }

            // If we receive this message back it means no extension intercepted the request, meaning no extension supporting handshake protocol is installed
            this.l.verbose(
                request.extensionId
                    ? `Extension with id: ${request.extensionId} not installed`
                    : "No extension installed"
            );
            clearTimeout(this.tId);
            this.mc.port1.close();
            this.mc.port2.close();
            window.removeEventListener("message", this.wl, false);
            this.he.end({
                success: false,
                extensionInstalled: false,
            });
            handshakeResolver.reject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.nativeExtensionNotInstalled
                )
            );
        }
    }

    /**
     * Invoked when a message is received from the extension on the MessageChannel port
     * @param event
     */
    private onChannelMessage(event: MessageEvent): void {
        this.l.trace(
            this.patType + " - onChannelMessage called."
        );
        const request = event.data;

        const resolver = this.res.get(request.responseId);
        const handshakeResolver = this.hsRes.get(
            request.responseId
        );

        try {
            const method = request.body.method;

            if (method === NativeExtensionMethod.Response) {
                if (!resolver) {
                    return;
                }
                const response = request.body.response;
                this.l.trace(
                    this.patType +
                        " - Received response from browser extension"
                );
                this.l.tracePii(
                    this.patType +
                        ` - Received response from browser extension: ${JSON.stringify(
                            response
                        )}`
                );
                if (response.status !== "Success") {
                    resolver.reject(
                        createNativeAuthError(
                            response.code,
                            response.description,
                            response.ext
                        )
                    );
                } else if (response.result) {
                    if (
                        response.result["code"] &&
                        response.result["description"]
                    ) {
                        resolver.reject(
                            createNativeAuthError(
                                response.result["code"],
                                response.result["description"],
                                response.result["ext"]
                            )
                        );
                    } else {
                        resolver.resolve(response.result);
                    }
                } else {
                    throw createAuthError(
                        AuthErrorCodes.unexpectedError,
                        "Event does not contain result."
                    );
                }
                this.res.delete(request.responseId);
            } else if (method === NativeExtensionMethod.HandshakeResponse) {
                if (!handshakeResolver) {
                    this.l.trace(
                        this.patType +
                            `.onChannelMessage - resolver can't be found for request ${request.responseId}`
                    );
                    return;
                }
                clearTimeout(this.tId); // Clear setTimeout
                window.removeEventListener(
                    "message",
                    this.wl,
                    false
                ); // Remove 'No extension' listener
                this.eId = request.extensionId;
                this.eVer = request.body.version;
                this.l.verbose(
                    this.patType +
                        ` - Received HandshakeResponse from extension: ${this.eId}`
                );
                this.he.end({
                    extensionInstalled: true,
                    success: true,
                });

                handshakeResolver.resolve();
                this.hsRes.delete(request.responseId);
            }
            // Do nothing if method is not Response or HandshakeResponse
        } catch (err) {
            this.l.error("Error parsing response from WAM Extension");
            this.l.errorPii(
                `Error parsing response from WAM Extension: ${err as string}`
            );
            this.l.errorPii(`Unable to parse ${event}`);

            if (resolver) {
                resolver.reject(err as AuthError);
            } else if (handshakeResolver) {
                handshakeResolver.reject(err as AuthError);
            }
        }
    }

    /**
     * Validates native platform response before processing
     * @param response
     */
    private validatePlatformBrokerResponse(
        response: object
    ): PlatformAuthResponse {
        if (
            response.hasOwnProperty("access_token") &&
            response.hasOwnProperty("id_token") &&
            response.hasOwnProperty("client_info") &&
            response.hasOwnProperty("account") &&
            response.hasOwnProperty("scope") &&
            response.hasOwnProperty("expires_in")
        ) {
            return response as PlatformAuthResponse;
        } else {
            throw createAuthError(
                AuthErrorCodes.unexpectedError,
                "Response missing expected properties."
            );
        }
    }

    /**
     * Returns the Id for the browser extension this handler is communicating with
     * @returns
     */
    getExtensionId(): string | undefined {
        return this.eId;
    }

    /**
     * Returns the version for the browser extension this handler is communicating with
     * @returns
     */
    getExtensionVersion(): string | undefined {
        return this.eVer;
    }

    getExtensionName(): string | undefined {
        return this.getExtensionId() ===
            PlatformAuthConstants.PREFERRED_EXTENSION_ID
            ? "chrome"
            : this.getExtensionId()?.length
            ? "unknown"
            : undefined;
    }
}
