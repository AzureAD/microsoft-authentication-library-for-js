// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { app, BrowserWindow } from 'electron';
import { PublicClientApplication } from 'msal-electron-poc';
import * as path from 'path';

export default class Main {
    static mainWindow: Electron.BrowserWindow;
    static application: Electron.App;

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
        Main.setupAuth();
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
    private static setupAuth(): void {
        const msalConfig = {
            auth: {
                clientId: '5b5a6ef2-d06c-4fdf-b986-805178ea4d2f',
            },
        };
        const msalApp = new PublicClientApplication(msalConfig);
        console.log('MSAL PublicClientApplication: ');
        console.dir(msalApp);
    }
}
