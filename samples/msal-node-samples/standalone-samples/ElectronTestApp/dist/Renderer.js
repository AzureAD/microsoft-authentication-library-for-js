"use strict";
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var UIManager_1 = require("./UIManager");
var uiManager = new UIManager_1.UIManager();
// function showUserInfo(userInfo: any): void {
//     document.querySelector('#UserInfo').innerHTML = `User Information:\n${JSON.stringify(userInfo, null, '\t')}`; 
// }
// Set listener on 'AcquireToken' button
document.querySelector('#SignIn').addEventListener('click', function () {
    electron_1.ipcRenderer.send('login');
});
electron_1.ipcRenderer.on('Account', function (event, account) {
    uiManager.showWelcomeMessage(account);
});
//# sourceMappingURL=Renderer.js.map