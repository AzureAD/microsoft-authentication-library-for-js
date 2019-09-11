/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { WindowUtils } from "./../utils/WindowUtils";
import { MessageCache } from "./MessageCache";
import { Logger } from "./../Logger";
import { MessageDispatcher } from "./MessageDispatcher";

export enum message_content {
    REDIRECT_REQUEST = "REDIRECT_REQUEST",
    URL_HASH = "URL_HASH",
    URL_TOP_FRAME = "URL_TOP_FRAME",
    URL_NAVIGATE = "URL_NAVIGATE"
};

export enum message_type {
    REDIRECT_REQUEST = "REDIRECT_REQUEST",
    URL = "URL",
    HASH = "HASH"
};

export enum window_type {
    TOP_FRAME,
    IFRAME
};

export type MESSAGE_SCHEMA = {
    type: message_type,
    content?: message_content,
    data?: string
};

export class MessageHelper {

    /**
     * returns the current window type: Top Frame app or Iframed app
     */
    static currentWindow(): window_type {
        if(WindowUtils.isWindowOnTop()) {
            return window_type.TOP_FRAME;
        }
        else if(WindowUtils.isInIframe()) {
            return window_type.IFRAME;
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
    static buildMessage(messageType: message_type, contentType?: message_content, messageData?: string): MESSAGE_SCHEMA {

        const message: MESSAGE_SCHEMA = {
            type: messageType,
            content: contentType,
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
        messageCache.write(message_content.URL_HASH, urlHash);
        messageCache.erase(message_content.URL_TOP_FRAME);

        // navigate to the saved URL
        WindowUtils.navigateWindow(urlTopFrame, logger);
    }

    /**
     * Handle the redirect delegation at the topframe on behalf of the embedded (iframed) application
     *
     * @param messageCache
     * @param urlNavigate
     */
    static redirectDelegationRequest(messageCache: MessageCache, urlNavigate: string) {
        // save the URL to navigate in the cache and send a request to the topframe
        messageCache.write(message_content.URL_NAVIGATE, urlNavigate);

        // dispatch the message to the top window to start redirect flow by delegation
        const message = MessageHelper.buildMessage(message_type.REDIRECT_REQUEST, message_content.REDIRECT_REQUEST, "true");
        const targetWindow = window.top;
        MessageDispatcher.dispatchMessage(targetWindow, message);
    }
}

