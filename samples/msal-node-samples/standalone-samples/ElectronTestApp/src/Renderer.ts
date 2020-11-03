// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { ipcRenderer } from 'electron';
import { UIManager } from "./UIManager";

const uiManager = new UIManager();

// Set listener on 'AcquireToken' button
document.querySelector('#SignIn').addEventListener('click', () => {
    ipcRenderer.send('login');
});

document.querySelector('#seeProfile').addEventListener('click', () => {
    ipcRenderer.send('seeProfile');
});

ipcRenderer.on('Account', (event, account) => {
    uiManager.showWelcomeMessage(account);
});
