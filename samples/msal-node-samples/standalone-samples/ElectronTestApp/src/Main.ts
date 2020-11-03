import { app, BrowserWindow, ipcMain } from "electron";
import { AccountInfo } from "@azure/msal-node";
import AuthProvider from "./AuthProvider";
import * as path from "path";
import { UIManager } from "./UIManager";

export default class Main {
    static application: Electron.App;
    static mainWindow: Electron.BrowserWindow;
    static authProvider: AuthProvider;
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
        Main.authProvider = new AuthProvider();
        Main.listenForLogin();
    }

    // Creates main application window
    private static createMainWindow(): void {
        this.mainWindow = new BrowserWindow({
            width: 800,
            height: 800,
            webPreferences: {
                nodeIntegration: true
            },
        });
    }

    // Sets a listener for the AcquireToken event that when triggered
    // performs the authorization code grant flow
    private static listenForLogin(): void {
        ipcMain.on('login', async () => {
            const account = await Main.login();
            await Main.mainWindow.loadFile(path.join(__dirname, '../index.html'));
            Main.mainWindow.webContents.send('Account', account);
        });
    }

    private static async login(): Promise<AccountInfo> {
        return await Main.authProvider.login(Main.mainWindow);
    }

}