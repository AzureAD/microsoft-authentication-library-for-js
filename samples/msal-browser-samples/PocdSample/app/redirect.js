/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

broadcastResponseToMainFrame().catch((error) => {
    console.error("Redirect bridge failed:", error);
    document.getElementById(
        "status"
    ).textContent = `Authentication could not complete: ${error.message}`;
});
