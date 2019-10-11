/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { WindowType, MessageHelper } from "./MessageHelper";
import { WindowUtils } from "./../utils/WindowUtils";
import { MessageType, PAYLOAD } from "./MessageHelper";
import { MessageCache } from "./MessageCache";
import { MessageDispatcher } from "./MessageDispatcher";
import { Logger } from "./../Logger";
import { iframeRedirectCallback } from "./../UserAgentApplication";

export class MessageListener {

    private messageCache: MessageCache;
    private logger: Logger;
    private topFrameOrigin: string;
    private embeddedFrameOrigin: string;
    private consentNeeded: boolean;
    private iframeRedirectCallback: iframeRedirectCallback;

    /**
     * initialize the message listener, and register the callback to process messages
     */
    constructor(messageCache: MessageCache, logger: Logger, topFrameOrigin?: string, embeddedFrameOrigin?: string) {
        this.messageCache = messageCache;
        this.logger = logger;
        this.topFrameOrigin = topFrameOrigin;
        this.embeddedFrameOrigin = embeddedFrameOrigin;

        // listen to all incoming messages
        window.addEventListener("message", this.receiveMessage, false);
    }

    public setCallBack(consentNeeded: boolean, callback: iframeRedirectCallback) {
        this.consentNeeded = consentNeeded;
        this.iframeRedirectCallback = callback;
    }

    /**
     * top frame application calls this function to ack to proceed
     * @param message
     */
    processIframeRedirectCallback(url: string) {
        return () => WindowUtils.navigateWindow(url, this.logger);
    }

    /**
     * Parses the messages receieved
     * This will be a unique handler per message, we will allow only one active request at a time
     * @param event
     */
    private receiveMessage(event: any) {

        const windowType = MessageHelper.currentWindow();
        const receivedMessage: PAYLOAD = { ...event.data};

        switch(windowType) {

            // Top framed application: handles the delegation on behalf of the iframed app
            case WindowType.TOP_FRAME: {

                switch(receivedMessage.type) {

                    case MessageType.REDIRECT_REQUEST: {
                        // acknowlege the redirect on behalf of the iframed app by sending the current location
                        const message = MessageHelper.buildMessage(MessageType.URL_TOP_FRAME, window.location.href);
                        MessageDispatcher.dispatchMessage(event.source, message, this.embeddedFrameOrigin);
                        break;
                    }

                    case MessageType.URL_NAVIGATE: {
                        // if the response is the URL to navigate for token acquisition, navigate to STS
                        if (receivedMessage.type === MessageType.URL_NAVIGATE) {
                            this.logger.info("navigating to the Service on behalf of the iframed app");

                            if(this.consentNeeded) {
                                this.iframeRedirectCallback(this.processIframeRedirectCallback(receivedMessage.data));
                            }
                            else {
                                WindowUtils.navigateWindow(receivedMessage.data, this.logger);
                            }
                        }
                        break;
                    }
                }
            }

            // embedded (in an iframe) application
            case WindowType.IFRAME: {

                // check the origin, should match window.top always; message channel may be more secure
                if (window.top != event.source) {
                    this.logger.warning("The message origin is not verified");
                    return;
                }

                if (receivedMessage.type === MessageType.URL_TOP_FRAME) {
                    // record the ack from the top frame - store the URL
                    this.messageCache.write(MessageType.URL_TOP_FRAME, receivedMessage.data);

                    // respond with the URL to navigate for token acquisition
                    const urlNavigate = this.messageCache.read(MessageType.URL_NAVIGATE);
                    const message = MessageHelper.buildMessage(MessageType.URL_NAVIGATE, urlNavigate);
                    MessageDispatcher.dispatchMessage(event.source, message, this.topFrameOrigin);
                }

                break;
            }
        }
    }
}
