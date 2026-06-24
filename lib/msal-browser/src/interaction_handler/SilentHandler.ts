/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Logger,
    IPerformanceClient,
    Authority,
    CommonAuthorizationUrlRequest,
} from "@azure/msal-common/browser";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError.js";
import { BrowserConfiguration } from "../config/Configuration.js";
import { getCodeForm, getEARForm } from "../protocol/Authorize.js";

/**
 * Navigates the given hidden iframe to the provided URL.
 * @param frame
 * @param requestUrl
 */
export async function initiateCodeRequest(
    frame: HTMLIFrameElement,
    requestUrl: string,
    logger: Logger,
    correlationId: string
): Promise<HTMLIFrameElement> {
    if (!requestUrl) {
        // Throw error if request URL is empty.
        logger.info("Navigate url is empty", correlationId);
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.emptyNavigateUri,
            correlationId
        );
    }

    frame.src = requestUrl;
    return frame;
}

export async function initiateCodeFlowWithPost(
    frame: HTMLIFrameElement,
    config: BrowserConfiguration,
    authority: Authority,
    request: CommonAuthorizationUrlRequest,
    logger: Logger,
    performanceClient: IPerformanceClient
): Promise<HTMLIFrameElement> {
    if (!frame.contentDocument) {
        throw "No document associated with iframe!";
    }
    const form = await getCodeForm(
        frame.contentDocument,
        config,
        authority,
        request,
        logger,
        performanceClient
    );
    form.submit();
    return frame;
}

export async function initiateEarRequest(
    frame: HTMLIFrameElement,
    config: BrowserConfiguration,
    authority: Authority,
    request: CommonAuthorizationUrlRequest,
    logger: Logger,
    performanceClient: IPerformanceClient
): Promise<HTMLIFrameElement> {
    if (!frame.contentDocument) {
        throw "No document associated with iframe!";
    }
    const form = await getEARForm(
        frame.contentDocument,
        config,
        authority,
        request,
        logger,
        performanceClient
    );
    form.submit();
    return frame;
}

/**
 * @hidden
 * Creates a new hidden iframe for silent token renewal. Callers navigate it
 * (set `src` or submit a form) after registering the response listener.
 * @ignore
 */
export function createHiddenIframe(): HTMLIFrameElement {
    const authFrame = document.createElement("iframe");

    authFrame.className = "msalSilentIframe";
    authFrame.title = "Microsoft Authentication";
    authFrame.style.visibility = "hidden";
    authFrame.style.position = "absolute";
    authFrame.style.width = authFrame.style.height = "0";
    authFrame.style.border = "0";
    authFrame.setAttribute(
        "sandbox",
        "allow-scripts allow-same-origin allow-forms"
    );
    authFrame.setAttribute("allow", "local-network-access *");
    document.body.appendChild(authFrame);

    return authFrame;
}

/**
 * @hidden
 * Removes a hidden iframe from `document.body` if it is a direct child.
 * @param iframe - The iframe element to remove.
 */
export function removeHiddenIframe(iframe: HTMLIFrameElement): void {
    if (document.body === iframe.parentNode) {
        document.body.removeChild(iframe);
    }
}
