// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

const { contextBridge, ipcRenderer } = require('electron');

/**
 * This preload script exposes a "renderer" API to give
 * the Renderer process controlled access to some Node APIs
 * by leveraging IPC channels that have been configured for
 * communication between the Main and Renderer processes.
 */
contextBridge.exposeInMainWorld('renderer', {
    sendLoginMessage: () => {
        ipcRenderer.send('LOGIN');
    },
    sendSignoutMessage: () => {
        ipcRenderer.send('LOGOUT');
    },
    sendSeeProfileMessage: () => {
        ipcRenderer.send('GET_PROFILE');
    },
    handleProfileData: (func) => {
        ipcRenderer.on('SET_PROFILE', (event, ...args) => func(event, ...args));
    },
    showWelcomeMessage: (func) => {
        ipcRenderer.on('SHOW_WELCOME_MESSAGE', (event, ...args) => func(event, ...args));
    },
});