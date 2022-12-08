/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import "bootstrap";
import "./index.scss";

declare const window: any;

window.api.startUiManager();

document.querySelector("#SignIn").addEventListener("click", () => {
    window.api.sendLoginMessage();
});

