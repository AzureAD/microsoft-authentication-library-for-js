/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export enum IpcMessages {
    SHOW_WELCOME_MESSAGE = 'SHOW_WELCOME_MESSAGE',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    REMOVE_ACCOUNT = 'REMOVE_ACCOUNT',
    GET_PROFILE = 'GET_PROFILE',
    SET_PROFILE = 'SET_PROFILE',
    GET_ACCOUNT = 'GET_ACCOUNT',
}

// Add here the endpoints for MS Graph API services you would like to use.
export const GRAPH_CONFIG = {
    GRAPH_ME_ENDPT: 'https://graph.microsoft.com/v1.0/me',
};

export const CACHE_LOCATION = './data/cache.json';
