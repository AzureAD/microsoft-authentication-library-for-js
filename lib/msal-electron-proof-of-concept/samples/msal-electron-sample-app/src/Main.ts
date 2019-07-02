import { app, BrowserWindow } from 'electron';
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
}
