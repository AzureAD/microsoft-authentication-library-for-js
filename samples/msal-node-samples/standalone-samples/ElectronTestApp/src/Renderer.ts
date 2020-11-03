// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { ipcRenderer } from 'electron';
import { UIManager } from "./UIManager";

const uiManager = new UIManager();

// UI event handlers
document.querySelector('#SignIn').addEventListener('click', () => {
    ipcRenderer.send('login');
});

document.querySelector('#seeProfile').addEventListener('click', () => {
    ipcRenderer.send('profile');
});

// Main process message subscribers
ipcRenderer.on('welcome', (event, account) => {
    uiManager.showWelcomeMessage(account);
});
