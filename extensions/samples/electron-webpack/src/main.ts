/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { app, BrowserWindow, ipcMain } from "electron";
import AuthProvider from "./AuthProvider";
import { authConfig } from "./authConfig";
import { Configuration } from "@azure/msal-node"

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export default class Main {
    static application: Electron.App;
    static mainWindow: Electron.BrowserWindow;
    static authProvider: AuthProvider;
    static authConfig: Configuration;

    static main(): void {
        Main.application = app;
        Main.application.on("window-all-closed", Main.onWindowAllClosed);
        Main.application.on("ready", Main.onReady);
        Main.authConfig = authConfig;
    }

    private static onWindowAllClosed(): void {
        // Windows and Linux will quit the application when all windows are closed
        if (process.platform !== "darwin") {
            Main.application.quit();
        }
    }

    private static async onReady(): Promise<void> {
        try {
            Main.createMainWindow();
            Main.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
            Main.mainWindow.on("closed", Main.onClose);
            Main.authProvider = await AuthProvider.build(Main.authConfig);
            Main.registerSubscriptions();
        } catch (error) {
            console.log(error);
        }
    }

    private static createMainWindow(): void {
        this.mainWindow = new BrowserWindow({
            width: 800,
            height: 600,
            webPreferences: {
                preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
            },
        });
    }

    private static onClose(): void {
        Main.mainWindow = null;
    }

    private static publish(message: string, payload: any): void {
        Main.mainWindow.webContents.send(message, payload);
    }

    private static async loadBaseUI(): Promise<void> {
        await Main.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    }

    private static async login(): Promise<void> {
        try {
            const account = await Main.authProvider.login();
            if (account) {
                await Main.loadBaseUI();
                Main.publish("SHOW_WELCOME_MESSAGE", account);
                Main.mainWindow.setAlwaysOnTop(true);
                Main.mainWindow.show();
                Main.mainWindow.setAlwaysOnTop(false);

            }
        } catch (error) {
            console.log(error);
        }
    }

    // Router that maps callbacks/actions to specific messages received from the Renderer
    private static registerSubscriptions(): void {
        ipcMain.on("LOGIN", Main.login);
    }
}

Main.main();