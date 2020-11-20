"use strict";
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_LOCATION = exports.IPC_MESSAGES = exports.GRAPH_CONFIG = void 0;
// Add here the endpoints for MS Graph API services you would like to use.
exports.GRAPH_CONFIG = {
    GRAPH_ME_ENDPT: "https://graph.microsoft.com/v1.0/me",
    GRAPH_MAIL_ENDPT: "https://graph.microsoft.com/v1.0/me/messages"
};
exports.IPC_MESSAGES = {
    SHOW_WELCOME_MESSAGE: "SHOW_WELCOME_MESSAGE",
    LOGIN: "LOGIN",
    LOGOUT: "LOGOUT",
    GET_PROFILE: "GET_PROFILE",
    SET_PROFILE: "SET_PROFILE",
    GET_MAIL: "GET_MAIL",
    SET_MAIL: "SET_MAIL"
};
exports.CACHE_LOCATION = "./data/cache.json";
//# sourceMappingURL=Constants.js.map