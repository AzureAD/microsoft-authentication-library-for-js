/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { app, BrowserWindow, ipcMain } from "electron";
import AuthProvider from "./AuthProvider";
import * as path from "path";
import { FetchManager } from "./FetchManager";

import { GRAPH_CONFIG, IPC_MESSAGES } from "./Constants";

export default class Main {
    static application: Electron.App;
    static mainWindow: Electron.BrowserWindow;
    static authProvider: AuthProvider;
    static accessToken: string;
    static networkModule: FetchManager;

    static main(): void {
        Main.application = app;
        Main.application.on('window-all-closed', Main.onWindowAllClosed);
        Main.application.on('ready', Main.onReady);
    }

    private static async loadBaseUI(): Promise<void> {
        await Main.mainWindow.loadFile(path.join(__dirname, '../index.html'));
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
        Main.authProvider = new AuthProvider();
        Main.networkModule = new FetchManager();
        Main.registerSubscriptions();

        Main.attemptSSOSilent();
    }

    // Creates main application window
    private static createMainWindow(): void {
        this.mainWindow = new BrowserWindow({
            width: 1000,
            height: 1000,
            webPreferences: {
                nodeIntegration: true
            }
        });
    }


    // Creates main application window
    private static createAuthWindow(): BrowserWindow {
        return new BrowserWindow({
            width: 400,
            height: 600
        });
    }

    private static publish(message: string, payload: any): void {
        Main.mainWindow.webContents.send(message, payload);
    }

    private static async attemptSSOSilent(): Promise<void> {
        const account = await Main.authProvider.loginSilent();
        await Main.loadBaseUI();
        
        if (account) {
            console.log("Successful silent account retrieval");
            Main.publish(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
        }
    }

    private static async login(): Promise<void> {
        const authWindow = Main.createAuthWindow();
        const account = await Main.authProvider.login(authWindow)
        await Main.loadBaseUI();
        Main.publish(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
        authWindow.close();
    }

    private static async getProfile(): Promise<void> {
        const token = await Main.authProvider.getProfileToken(Main.mainWindow);
        const account = Main.authProvider.currentAccount;
        await Main.loadBaseUI();
        Main.publish(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
        const graphResponse = await Main.networkModule.callEndpointWithToken(GRAPH_CONFIG.GRAPH_ME_ENDPT, token);
        Main.publish(IPC_MESSAGES.SET_PROFILE, graphResponse);
    }

    private static async getMail(): Promise<void> {
        const token = await Main.authProvider.getMailToken(Main.mainWindow);
        const account = Main.authProvider.currentAccount;
        await Main.loadBaseUI();
        Main.publish(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
        const graphResponse = await Main.networkModule.callEndpointWithToken(GRAPH_CONFIG.GRAPH_MAIL_ENDPT, token);
        Main.publish(IPC_MESSAGES.SET_MAIL, graphResponse);
    }

    private static async logout(): Promise<void> {
        await Main.authProvider.logout();
        await Main.loadBaseUI();
    }


    // Router that maps callbacks/actions to specific messages received from the Renderer
    private static registerSubscriptions(): void {
        ipcMain.on(IPC_MESSAGES.LOGIN, Main.login);
        ipcMain.on(IPC_MESSAGES.GET_PROFILE, Main.getProfile);
        ipcMain.on(IPC_MESSAGES.GET_MAIL, Main.getMail);
        ipcMain.on(IPC_MESSAGES.LOGOUT, Main.logout);
    }

}