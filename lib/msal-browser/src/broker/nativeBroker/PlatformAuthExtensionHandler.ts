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
import { createGuid } from "../../utils/BrowserUtils.js";

type ResponseResolvers<T> = {
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (
        value: AuthError | Error | PromiseLike<Error> | PromiseLike<AuthError>
    ) => void;
    correlationId: string;
};

export class PlatformAuthExtensionHandler implements IPlatformAuthHandler {
    private extensionId: string | undefined;
    private extensionVersion: string | undefined;
    private logger: Logger;
    private readonly handshakeTimeoutMs: number;
    private timeoutId: number | undefined;
    private resolvers: Map<string, ResponseResolvers<object>>;
    private handshakeResolvers: Map<string, ResponseResolvers<void>>;
    private messageChannel: MessageChannel;
    private readonly windowListener: (event: MessageEvent) => void;
    private readonly performanceClient: IPerformanceClient;
    private readonly handshakeEvent: InProgressPerformanceEvent;
    private readonly correlationId: string;
    platformAuthType: string;

    constructor(
        logger: Logger,
        handshakeTimeoutMs: number,
        performanceClient: IPerformanceClient,
        extensionId?: string,
        correlationId?: string
    ) {
        this.logger = logger;
        this.handshakeTimeoutMs = handshakeTimeoutMs;
        this.extensionId = extensionId;
        this.resolvers = new Map(); // Used for non-handshake messages
        this.handshakeResolvers = new Map(); // Used for handshake messages
        this.messageChannel = new MessageChannel();
        this.windowListener = this.onWindowMessage.bind(this); // Window event callback doesn't have access to 'this' unless it's bound
        this.performanceClient = performanceClient;
        this.correlationId = correlationId || createNewGuid();
        this.handshakeEvent = this.performanceClient.startMeasurement(
            BrowserPerformanceEvents.NativeMessageHandlerHandshake
        );
        this.platformAuthType =
            PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER;
    }

    /**
     * Sends a given message to the extension and resolves with the extension response
     * @param request
     */
    async sendMessage(
        request: PlatformAuthRequest
    ): Promise<PlatformAuthResponse> {
        const correlationId = request.correlationId || this.correlationId;
        const sendMessageMeasurement = this.performanceClient.startMeasurement(
            BrowserPerformanceEvents.PlatformAuthExtensionSendMessage,
            correlationId
        );
        this.logger.trace(
            `'${this.platformAuthType}' - sendMessage called.`,
            correlationId
        );

        try {
            // fall back to native calls
            const messageBody: NativeExtensionRequestBody = {
                method: NativeExtensionMethod.GetToken,
                request: request,
            };

            const req: NativeExtensionRequest = {
                channel: PlatformAuthConstants.CHANNEL_ID,
                extensionId: this.extensionId,
                responseId: createNewGuid(),
                body: messageBody,
            };

            this.logger.trace(
                `'${this.platformAuthType}' - Sending request to browser extension`,
                correlationId
            );
            this.logger.tracePii(
                `'${
                    this.platformAuthType
                }' - Sending request to browser extension: '${JSON.stringify(
                    req
                )}'`,
                correlationId
            );
            this.messageChannel.port1.postMessage(req);

            const response: object = await new Promise((resolve, reject) => {
                this.resolvers.set(req.responseId, {
                    resolve,
                    reject,
                    correlationId,
                });
            });

            const validatedResponse: PlatformAuthResponse =
                this.validatePlatformBrokerResponse(response, correlationId);
            sendMessageMeasurement.end({
                success: true,
                platformAuthProviderType: this.platformAuthType,
                platformAuthResponseCategory: "success",
            });
            return validatedResponse;
        } catch (e) {
            sendMessageMeasurement.end(
                {
                    success: false,
                    platformAuthProviderType: this.platformAuthType,
                    platformAuthResponseCategory: this.getResponseCategory(e),
                },
                e
            );
            throw e;
        }
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
        performanceClient: IPerformanceClient,
        correlationId: string
    ): Promise<PlatformAuthExtensionHandler> {
        logger.trace(
            "PlatformAuthExtensionHandler - createProvider called.",
            correlationId
        );
        const createProviderMeasurement = performanceClient.startMeasurement(
            BrowserPerformanceEvents.PlatformAuthExtensionCreateProvider,
            correlationId
        );

        try {
            const preferredProvider = new PlatformAuthExtensionHandler(
                logger,
                handshakeTimeoutMs,
                performanceClient,
                PlatformAuthConstants.PREFERRED_EXTENSION_ID,
                correlationId
            );
            await preferredProvider.sendHandshakeRequest(correlationId);
            createProviderMeasurement.end({
                success: true,
                platformAuthPreferredExtensionAttempted: true,
                platformAuthExtensionFallbackAttempted: false,
                platformAuthProviderAvailable: true,
                platformAuthProviderType:
                    PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER,
                platformAuthOutcome: "preferred_extension_selected",
            });
            return preferredProvider;
        } catch (e) {
            // If preferred extension fails for whatever reason, fallback to using any installed extension
            try {
                const backupProvider = new PlatformAuthExtensionHandler(
                    logger,
                    handshakeTimeoutMs,
                    performanceClient,
                    undefined,
                    correlationId
                );
                await backupProvider.sendHandshakeRequest(correlationId);
                createProviderMeasurement.end({
                    success: true,
                    platformAuthPreferredExtensionAttempted: true,
                    platformAuthExtensionFallbackAttempted: true,
                    platformAuthProviderAvailable: true,
                    platformAuthProviderType:
                        PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER,
                    platformAuthOutcome: "backup_extension_selected",
                });
                return backupProvider;
            } catch (backupError) {
                createProviderMeasurement.end(
                    {
                        success: false,
                        platformAuthPreferredExtensionAttempted: true,
                        platformAuthExtensionFallbackAttempted: true,
                        platformAuthProviderAvailable: false,
                        platformAuthProviderType:
                            PlatformAuthConstants.PLATFORM_EXTENSION_PROVIDER,
                        platformAuthOutcome: "extension_unavailable",
                    },
                    backupError
                );
                throw backupError;
            }
        }
    }

    /**
     * Send handshake request helper.
     */
    private async sendHandshakeRequest(correlationId: string): Promise<void> {
        this.logger.trace(
            `'${this.platformAuthType}' - sendHandshakeRequest called.`,
            correlationId
        );
        // Register this event listener before sending handshake
        window.addEventListener("message", this.windowListener, false); // false is important, because content script message processing should work first

        const req: NativeExtensionRequest = {
            channel: PlatformAuthConstants.CHANNEL_ID,
            extensionId: this.extensionId,
            responseId: createNewGuid(),
            body: {
                method: NativeExtensionMethod.HandshakeRequest,
            },
        };
        this.handshakeEvent.add({
            extensionId: this.extensionId,
            extensionHandshakeTimeoutMs: this.handshakeTimeoutMs,
        });

        this.messageChannel.port1.onmessage = (event) => {
            this.onChannelMessage(event);
        };

        window.postMessage(req, window.origin, [this.messageChannel.port2]);

        return new Promise((resolve, reject) => {
            this.handshakeResolvers.set(req.responseId, {
                resolve,
                reject,
                correlationId,
            });
            this.timeoutId = window.setTimeout(() => {
                /*
                 * Throw an error if neither HandshakeResponse nor original Handshake request are received in a reasonable timeframe.
                 * This typically suggests an event handler stopped propagation of the Handshake request but did not respond to it on the MessageChannel port
                 */
                window.removeEventListener(
                    "message",
                    this.windowListener,
                    false
                );
                this.messageChannel.port1.close();
                this.messageChannel.port2.close();
                this.handshakeEvent.end({
                    extensionHandshakeTimedOut: true,
                    success: false,
                });
                reject(
                    createBrowserAuthError(
                        BrowserAuthErrorCodes.nativeHandshakeTimeout,
                        ""
                    )
                );
                this.handshakeResolvers.delete(req.responseId);
            }, this.handshakeTimeoutMs); // Use a reasonable timeout in milliseconds here
        });
    }

    /**
     * Invoked when a message is posted to the window. If a handshake request is received it means the extension is not installed.
     * @param event
     */
    private onWindowMessage(event: MessageEvent): void {
        let correlationId = createGuid();
        this.logger.trace(
            `'${this.platformAuthType}' - onWindowMessage called`,
            correlationId
        );
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

        if (request.extensionId && request.extensionId !== this.extensionId) {
            return;
        }

        if (request.body.method === NativeExtensionMethod.HandshakeRequest) {
            const handshakeResolver = this.handshakeResolvers.get(
                request.responseId
            );
            /*
             * Filter out responses with no matched resolvers sooner to keep channel ports open while waiting for
             * the proper response.
             */
            if (!handshakeResolver) {
                this.logger.trace(
                    `'${this.platformAuthType}'.onWindowMessage - resolver can't be found for request '${request.responseId}'`,
                    correlationId
                );
                return;
            }
            correlationId = handshakeResolver.correlationId;

            // If we receive this message back it means no extension intercepted the request, meaning no extension supporting handshake protocol is installed
            this.logger.verbose(
                request.extensionId
                    ? `Extension with id: ${request.extensionId} not installed`
                    : "No extension installed",
                correlationId
            );
            clearTimeout(this.timeoutId);
            this.messageChannel.port1.close();
            this.messageChannel.port2.close();
            window.removeEventListener("message", this.windowListener, false);
            this.handshakeEvent.end({
                success: false,
                extensionInstalled: false,
            });
            handshakeResolver.reject(
                createBrowserAuthError(
                    BrowserAuthErrorCodes.nativeExtensionNotInstalled,
                    correlationId
                )
            );
            this.handshakeResolvers.delete(request.responseId);
        }
    }

    /**
     * Invoked when a message is received from the extension on the MessageChannel port
     * @param event
     */
    private onChannelMessage(event: MessageEvent): void {
        const request = event.data;
        const responseId = request?.responseId;
        const resolver = responseId
            ? this.resolvers.get(responseId)
            : undefined;
        const handshakeResolver = responseId
            ? this.handshakeResolvers.get(responseId)
            : undefined;
        const correlationId =
            resolver?.correlationId ||
            handshakeResolver?.correlationId ||
            createGuid();
        this.logger.trace(
            `'${this.platformAuthType}' - onChannelMessage called.`,
            correlationId
        );

        try {
            const method = request.body.method;

            if (method === NativeExtensionMethod.Response) {
                if (!resolver) {
                    return;
                }
                try {
                    const response = request.body.response;
                    this.logger.trace(
                        `'${this.platformAuthType}' - Received response from browser extension`,
                        correlationId
                    );
                    this.logger.tracePii(
                        `'${
                            this.platformAuthType
                        }' - Received response from browser extension: '${JSON.stringify(
                            response
                        )}'`,
                        correlationId
                    );
                    if (response.status !== "Success") {
                        resolver.reject(
                            createNativeAuthError(
                                response.code,
                                correlationId,
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
                                    correlationId,
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
                            correlationId,
                            "Event does not contain result."
                        );
                    }
                } finally {
                    this.resolvers.delete(request.responseId);
                }
            } else if (method === NativeExtensionMethod.HandshakeResponse) {
                if (!handshakeResolver) {
                    this.logger.trace(
                        `'${this.platformAuthType}'.onChannelMessage - resolver can't be found for request '${request.responseId}'`,
                        correlationId
                    );
                    return;
                }
                clearTimeout(this.timeoutId); // Clear setTimeout
                window.removeEventListener(
                    "message",
                    this.windowListener,
                    false
                ); // Remove 'No extension' listener
                this.extensionId = request.extensionId;
                this.extensionVersion = request.body.version;
                this.logger.verbose(
                    `'${this.platformAuthType}' - Received HandshakeResponse from extension: '${this.extensionId}'`,
                    correlationId
                );
                this.handshakeEvent.end({
                    extensionInstalled: true,
                    success: true,
                });

                handshakeResolver.resolve();
                this.handshakeResolvers.delete(request.responseId);
            } else if (resolver) {
                this.resolvers.delete(request.responseId);
                resolver.reject(
                    createAuthError(
                        AuthErrorCodes.unexpectedError,
                        correlationId,
                        "Extension response contains an unexpected method."
                    )
                );
            }
        } catch (err) {
            this.logger.error(
                "Error parsing response from WAM Extension",
                correlationId
            );
            this.logger.errorPii(
                `Error parsing response from WAM Extension: '${err as string}'`,
                correlationId
            );
            this.logger.errorPii(`Unable to parse '${event}'`, correlationId);

            if (resolver) {
                this.resolvers.delete(responseId);
                resolver.reject(
                    err instanceof AuthError
                        ? err
                        : createAuthError(
                              AuthErrorCodes.unexpectedError,
                              correlationId,
                              "Unable to parse extension response."
                          )
                );
            } else if (handshakeResolver) {
                this.handshakeResolvers.delete(responseId);
                handshakeResolver.reject(err as AuthError);
            }
        }
    }

    /**
     * Validates native platform response before processing
     * @param response
     */
    private validatePlatformBrokerResponse(
        response: object,
        correlationId: string = this.correlationId
    ): PlatformAuthResponse {
        const validationMeasurement = this.performanceClient.startMeasurement(
            BrowserPerformanceEvents.PlatformAuthExtensionValidateResponse,
            correlationId
        );
        if (
            response &&
            Object.prototype.hasOwnProperty.call(response, "access_token") &&
            Object.prototype.hasOwnProperty.call(response, "id_token") &&
            Object.prototype.hasOwnProperty.call(response, "client_info") &&
            Object.prototype.hasOwnProperty.call(response, "account") &&
            Object.prototype.hasOwnProperty.call(response, "scope") &&
            Object.prototype.hasOwnProperty.call(response, "expires_in")
        ) {
            validationMeasurement.end({
                success: true,
                platformAuthProviderType: this.platformAuthType,
                platformAuthResponseCategory: "success",
            });
            return response as PlatformAuthResponse;
        } else {
            const error = createAuthError(
                AuthErrorCodes.unexpectedError,
                correlationId,
                "Response missing expected properties."
            );
            validationMeasurement.end(
                {
                    success: false,
                    platformAuthProviderType: this.platformAuthType,
                    platformAuthResponseCategory: "invalid_response",
                },
                error
            );
            throw error;
        }
    }

    private getResponseCategory(error: unknown): string {
        if (!(error instanceof Error)) {
            return "message_port_error";
        }
        if (error.message.includes("Unable to parse extension response")) {
            return "parse_error";
        }
        if (error.name === "NativeAuthError") {
            return "broker_error";
        }
        if (error instanceof AuthError) {
            if (error.errorCode === BrowserAuthErrorCodes.userCancelled) {
                return "cancelled";
            }
            return error.errorCode === AuthErrorCodes.unexpectedError
                ? "invalid_response"
                : "broker_error";
        }
        return "message_port_error";
    }

    /**
     * Returns the Id for the browser extension this handler is communicating with
     * @returns
     */
    getExtensionId(): string | undefined {
        return this.extensionId;
    }

    /**
     * Returns the version for the browser extension this handler is communicating with
     * @returns
     */
    getExtensionVersion(): string | undefined {
        return this.extensionVersion;
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
