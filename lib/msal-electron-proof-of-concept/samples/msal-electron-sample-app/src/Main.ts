// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { app, BrowserWindow } from 'electron';
import { PublicClientApplication } from 'msal-electron-poc';
import * as path from 'path';

export default class Main {
    static application: Electron.App;
    static mainWindow: Electron.BrowserWindow;
    static msalApp: PublicClientApplication;

    static main(): void {
        Main.application = app;
        Main.application.on('window-all-closed', Main.onWindowAllClosed);
        Main.application.on('ready', Main.onReady);
    }

    private static onWindowAllClosed(): void {
        Main.application.quit();
    }

    private static onClose(): void {
        Main.mainWindow = null;
    }

    private static onReady(): void {
        Main.createMainWindow();
        Main.mainWindow.loadFile(path.join(__dirname, '../index.html'));
        Main.mainWindow.on('closed', Main.onClose);

        // Once appplication is ready, configure MSAL Public Client App
        Main.configureAuthentication();
    }

    private static createMainWindow(): void {
        this.mainWindow = new BrowserWindow({
            width: 1000,
            height: 800,
            webPreferences: {
                nodeIntegration: true,
            },
        });
    }

    // This is where MSAL set up and configuration happens.
    private static configureAuthentication(): void {
<<<<<<< HEAD
        const msalAuthConfig = {
            authority: 'https://login.microsoftonline.com/common',
            clientId: '5b5a6ef2-d06c-4fdf-b986-805178ea4d2f',
            redirectUri: 'https://localhost:3000',
        };

        this.msalApp = new PublicClientApplication(msalAuthConfig);
=======
        const msalConfig = {
            auth: {
                authority: 'https://login.microsoftonline.com/common',
                clientId: '5b5a6ef2-d06c-4fdf-b986-805178ea4d2f',
                redirectUri: 'https://localhost:3000',
            },
        };
        this.msalApp = new PublicClientApplication(msalConfig);
>>>>>>> ebae38930bf4af8f9a32b692d87ca044d1f8f75c
        console.dir(this.msalApp);
    }
}
