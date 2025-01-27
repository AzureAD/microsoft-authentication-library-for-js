// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { contextBridge, ipcRenderer } from "electron";
import { IpcMessages } from "./Constants";

const validChannels = [
    IpcMessages.LOGIN,
    IpcMessages.LOGOUT,
    IpcMessages.GET_PROFILE,
    IpcMessages.GET_ACCOUNT,
    IpcMessages.SHOW_WELCOME_MESSAGE,
    IpcMessages.SET_PROFILE,
    IpcMessages.GET_AUTH_CODE_URL,
];

/**
 * This preload script exposes a "renderer" API to give
 * the Renderer process controlled access to some Node APIs
 * by leveraging IPC channels that have been configured for
 * communication between the Main and Renderer processes.
 */
contextBridge.exposeInMainWorld("api", {
    send: (channel: IpcMessages) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel);
        }
    },
    receive: (channel: IpcMessages, func: (...args: any) => any) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    removeAllListeners: (channel: IpcMessages) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.removeAllListeners(channel);
        }
    },
});
