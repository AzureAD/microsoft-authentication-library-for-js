import { app, BrowserWindow, ipcMain } from 'electron';
import AuthProvider from './AuthProvider';
import { FetchManager } from './FetchManager';
import path from 'path';
import { IpcMessages, GRAPH_CONFIG } from './Constants';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

export default class Main {
    static application: Electron.App;
    static mainWindow: Electron.BrowserWindow;
    static authProvider: AuthProvider;
    static networkModule: FetchManager;
    static main(): void {
        Main.application = app;
        Main.application.on('window-all-closed', Main.onWindowAllClosed);
        Main.application.on('ready', Main.onReady);
    }

    private static async loadBaseUI(): Promise<void> {
        await Main.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
    }

    private static publish(message: string, payload: any): void {
        Main.mainWindow.webContents.send(message, payload);
    }

    private static onWindowAllClosed(): void {
        // Windows and Linux will quit the application when all windows are closed
        if (process.platform !== 'darwin') {
            // macOS requires explicit quitting
            Main.application.quit();
        }
    }

    private static onClose(): void {
        Main.mainWindow = null;
    }

    private static onReady(): void {
        Main.createMainWindow();
        // load the index.html of the app.
        Main.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
        Main.mainWindow.on('closed', Main.onClose);
        Main.authProvider = new AuthProvider();
        Main.networkModule = new FetchManager();
        Main.registerSubscriptions();
    }

    private static createMainWindow(): void {
        // Create the browser window.
        this.mainWindow = new BrowserWindow({
            height: 600,
            width: 800,
            title: 'MSAL Node Electron Sample App',
            webPreferences: {
                preload: path.join(__dirname, '../renderer/main_window/preload.js'),
            },
        });
    }

    private static async login(): Promise<void> {
        const account = await Main.authProvider.login();
        await Main.loadBaseUI();
        Main.publish(IpcMessages.SHOW_WELCOME_MESSAGE, account);
    }

    private static async logout(): Promise<void> {
        await Main.authProvider.logout();
        await Main.loadBaseUI();
        Main.publish(IpcMessages.REMOVE_ACCOUNT, null);
    }

    private static async getProfile(): Promise<void> {
        const token = await Main.authProvider.getProfileToken();
        const graphResponse = await Main.networkModule.callEndpointWithToken(GRAPH_CONFIG.GRAPH_ME_ENDPT, token);
        Main.publish(IpcMessages.SET_PROFILE, graphResponse);
    }

    private static async getAccount(): Promise<void> {
        const account = Main.authProvider.currentAccount;
        if (account) {
            Main.publish(IpcMessages.SHOW_WELCOME_MESSAGE, account);
        }
    }

    private static registerSubscriptions(): void {
        ipcMain.on(IpcMessages.LOGIN, Main.login);
        ipcMain.on(IpcMessages.LOGOUT, Main.logout);
        ipcMain.on(IpcMessages.GET_PROFILE, Main.getProfile);
        ipcMain.on(IpcMessages.GET_ACCOUNT, Main.getAccount);
    }
}
