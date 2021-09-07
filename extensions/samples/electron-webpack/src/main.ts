import { app, BrowserWindow } from "electron";
import * as path from "path";
import {
  ElectronAuthenticator,
  MsalElectronConfig,
 } from '@microsoft/mgt-electron-provider/dist/Authenticator';
 import { 
  DataProtectionScope,
  PersistenceCreator,
  PersistenceCachePlugin,
  IPersistence
} from "@azure/msal-node-extensions";

// You can use the helper functions provided through the Environment class to construct your cache path
// The helper functions provide consistent implementations across Windows, Mac and Linux.
const cachePath = "./cache.json";

const persistenceConfiguration = {
  cachePath,
  dataProtectionScope: DataProtectionScope.CurrentUser,
  serviceName: "test-msal-electron-service",
  accountName: "test-msal-electron-account",
  usePlaintextFileOnLinux: false,
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    width: 800,
  });

  PersistenceCreator
  .createPersistence(persistenceConfiguration)
  .then(async (persistence: IPersistence) => {
    // Initialize the electron authenticator
    const config: MsalElectronConfig = {
      clientId: '<CLIENT_ID>',
      mainWindow: mainWindow, //BrowserWindow instance that requires auth
      scopes: [
        'user.read',
        'people.read',
        'user.readbasic.all',
        'contacts.read',
        'presence.read.all',
        'presence.read',
        'user.read.all',
        'calendars.read',
        'Sites.Read.All',
        'Sites.ReadWrite.All',
      ],
      cachePlugin: new PersistenceCachePlugin(persistence),
    };

    ElectronAuthenticator.initialize(config);

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, "../index.html"));

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
