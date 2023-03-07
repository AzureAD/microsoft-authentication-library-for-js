/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const path = require("path");
const { app, ipcMain, BrowserWindow } = require("electron");

const AuthProvider = require("./AuthProvider");
const { IPC_MESSAGES } = require("./constants");
const { msalConfig } = require("./authConfig");

let authProvider;
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: { preload: path.join(__dirname, "preload.js") },
    });

    authProvider = new AuthProvider(msalConfig);
}

app.on("ready", () => {
    createWindow();
    mainWindow.loadFile(path.join(__dirname, "./index.html"));
});

app.on("window-all-closed", () => {
    app.quit();
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


// Event handlers
ipcMain.on(IPC_MESSAGES.LOGIN, async () => {
    const account = await authProvider.login();
    await mainWindow.loadFile(path.join(__dirname, "./index.html"));
    mainWindow.webContents.send(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
});

ipcMain.on(IPC_MESSAGES.LOGOUT, async () => {
    await authProvider.logout();
    await mainWindow.loadFile(path.join(__dirname, './index.html')); 
});

ipcMain.on(IPC_MESSAGES.SIGNUP, async () => {
    const account = await authProvider.signUp();
    await mainWindow.loadFile(path.join(__dirname, './index.html'));
    mainWindow.webContents.send(IPC_MESSAGES.SHOW_WELCOME_MESSAGE, account);
});