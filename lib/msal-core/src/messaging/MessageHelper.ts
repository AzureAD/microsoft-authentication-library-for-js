/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { WindowUtils } from "./../utils/WindowUtils";
import { MessageCache } from "./MessageCache";
import { Logger } from "./../Logger";
import { MessageDispatcher } from "./MessageDispatcher";

// type of the message
export enum MessageType {
    REDIRECT_REQUEST = "REDIRECT_REQUEST",
    HASH = "HASH",
    URL_TOP_FRAME = "URL_TOP_FRAME",
    URL_NAVIGATE = "URL_NAVIGATE"
};

// helps differentiate topframe and iframe context
export enum WindowType {
    TOP_FRAME,
    IFRAME
};

// message payload
export type PAYLOAD = {
    type: MessageType,
    data?: string
};

export class MessageHelper {

    /**
     * returns the current window type: Top Frame app or Iframed app
     */
    static currentWindow(): WindowType {
        if(WindowUtils.isWindowOnTop()) {
            return WindowType.TOP_FRAME;
        }
        else if(WindowUtils.isInIframe()) {
            return WindowType.IFRAME;
        }
        else
            return null;
    }

    /**
     * Builds a message in the format: MESSAGE_SCHEMA
     *
     * @param messageType
     * @param contentType
     * @param messageData
     */
    static buildMessage(messageType: MessageType, messageData?: string): PAYLOAD {
        const message: PAYLOAD = {
            type: messageType,
            data: messageData
        };

        return message;
    }

    /**
     * utility to handle redirect(302) from the service on behalf of the iframed application
     *
     * @param messageCache
     * @param urlTopFrame
     * @param urlHash
     * @param logger
     */
    static handleTopFrameRedirect(messageCache: MessageCache, urlTopFrame: string, urlHash: string, logger: Logger) {
        // write the hash to the cache of the redirect URI, clear the cache(and hence the state) for the Top Frame delegation indication
        messageCache.write(MessageType.HASH, urlHash);
        messageCache.erase(MessageType.URL_TOP_FRAME);

        // navigate to the saved URL
        WindowUtils.navigateWindow(urlTopFrame, logger);
    }

    /**
     * Handle the redirect delegation at the topframe on behalf of the embedded (iframed) application
     *
     * @param messageCache
     * @param urlNavigate
     */
    static redirectDelegationRequest(messageCache: MessageCache, urlNavigate: string, topFrameOrigin: string) {
        // save the URL to navigate in the cache and send a request to the topframe
        messageCache.write(MessageType.URL_NAVIGATE, urlNavigate);

        // dispatch the message to the top window to start redirect flow by delegation
        const targetWindow = window.top;
        const message: PAYLOAD = MessageHelper.buildMessage(MessageType.REDIRECT_REQUEST);
        MessageDispatcher.dispatchMessage(targetWindow, message, topFrameOrigin);
    }
}
