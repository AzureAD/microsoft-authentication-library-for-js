// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { ipcRenderer } from 'electron';

function showUserInfo(userInfo: any): void {
    document.querySelector('#UserInfo').innerHTML = `User Information:\n${JSON.stringify(userInfo, null, '\t')}`; 
}

// Set listener on 'AcquireToken' button
document.querySelector('#AcquireTokenButton').addEventListener('click', () => {
    ipcRenderer.send('AcquireToken');
});

// Set listener on 'Request User Info' button
document.querySelector('#UserInfoButton').addEventListener('click', () => {
    ipcRenderer.send('UserInfo');
});

// Set listener to display user information
ipcRenderer.on('UserInfo', (event, userInfo) => {
    showUserInfo(userInfo);
});
