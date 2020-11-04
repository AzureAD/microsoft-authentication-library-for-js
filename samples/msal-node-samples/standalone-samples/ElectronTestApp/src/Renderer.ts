// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { ipcRenderer } from 'electron';
import { UIManager } from "./UIManager";

import { GRAPH_CONFIG, IPC_MESSAGES } from "./Constants";

const uiManager = new UIManager();

// UI event handlers
document.querySelector('#SignIn').addEventListener('click', () => {
    ipcRenderer.send(IPC_MESSAGES.LOGIN);
});

document.querySelector('#SignOut').addEventListener('click', () => {
    ipcRenderer.send(IPC_MESSAGES.LOGOUT);
});

document.querySelector('#seeProfile').addEventListener('click', () => {
    ipcRenderer.send(IPC_MESSAGES.GET_PROFILE);
});

document.querySelector('#readMail').addEventListener('click', () => {
    ipcRenderer.send(IPC_MESSAGES.GET_MAIL);
});


// Main process message subscribers
ipcRenderer.on(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, (event, account) => {
    uiManager.showWelcomeMessage(account);
});

ipcRenderer.on(IPC_MESSAGES.SET_PROFILE, (event, graphResponse) => {
    uiManager.updateUI(graphResponse, GRAPH_CONFIG.GRAPH_ME_ENDPT);
})

ipcRenderer.on(IPC_MESSAGES.SET_MAIL, (event, graphResponse) => {
    uiManager.updateUI(graphResponse, GRAPH_CONFIG.GRAPH_MAIL_ENDPT);
})