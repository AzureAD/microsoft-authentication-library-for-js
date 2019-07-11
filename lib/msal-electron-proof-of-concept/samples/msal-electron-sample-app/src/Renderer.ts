// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { ipcRenderer } from 'electron';

// Set listener on 'AcquireToken' button
document.querySelector('#AcquireTokenButton').addEventListener('click', () => {
    ipcRenderer.send('AcquireToken');
});
