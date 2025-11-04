/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Performs cleanup operations after popup authentication.
 * Closes the popup window and removes the 'beforeunload' event listener from the parent window.
 *
 * @param popupWindow - The popup window to be closed.
 * @param popupWindowParent - The parent window from which the event listener will be removed.
 * @param unloadWindow - The event handler function to remove from the parent window's 'beforeunload' event.
 */
export function cleanPopup(
    popupWindow: Window,
    popupWindowParent: Window,
    unloadWindow: (e: Event) => void
): void {
    // Close window.
    popupWindow.close();

    // Remove window unload function
    popupWindowParent.removeEventListener("beforeunload", unloadWindow);
}
