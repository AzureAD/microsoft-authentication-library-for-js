// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { app, BrowserWindow, ipcMain } from 'electron';
import { PublicClientApplication } from 'msal-electron-poc';
import * as path from 'path';

import { Graph } from './Graph';

export default class Main {
    static application: Electron.App;
    static mainWindow: Electron.BrowserWindow;
    static msalApp: PublicClientApplication;
    static accessToken: string;

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

        // Listen for AcquireToken button call
        Main.listenForAcquireToken();
        // Listen for UserInfo button call
        Main.listenForUserInfo();
    }

    // Creates main application window
    private static createMainWindow(): void {
        this.mainWindow = new BrowserWindow({
            width: 800,
            height: 800,
            webPreferences: {
                nodeIntegration: true,
            },
        });
    }

    // This is where MSAL set up and configuration happens.
    private static configureAuthentication(): void {
        const msalAuthConfig = {
            clientId: '5b5a6ef2-d06c-4fdf-b986-805178ea4d2f',
        };
        this.msalApp = new PublicClientApplication(msalAuthConfig);
    }

    // Sets a listener for the AcquireToken event that when triggered
    // performs the authorization code grant flow
    private static listenForAcquireToken(): void {
        ipcMain.on('AcquireToken', () => {
            Main.getAccessToken();
        });
    }

    // Uses MSAL PublicClientApplication object to obtain an access
    // token for Microsoft Graph API access
    private static async getAccessToken(): Promise<void> {
        const tokenRequest = {
            scopes: ['user.read', 'mail.read'],
        };

        try {
            Main.accessToken = await this.msalApp.acquireToken(tokenRequest);
        } catch (error) {
            console.error(error);
        }
    }

    // Sets a listener for the UserInfo event that when triggered
    // requests user info from Graph API
    private static listenForUserInfo(): void {
        ipcMain.on('UserInfo', () => {
            if (Main.accessToken) {
                Main.showUserInfo();
            } else {
                this.mainWindow.webContents.send('UserInfo', 'You must acquire a Token first.');
            }
        });
    }

    // Gets user info from Graph API and sends it to the renderer
    // for display
    private static async showUserInfo(): Promise<void> {
        const userInfo = await Graph.fetchUserData(Main.accessToken);
        this.mainWindow.webContents.send('UserInfo', userInfo);
    }
}
