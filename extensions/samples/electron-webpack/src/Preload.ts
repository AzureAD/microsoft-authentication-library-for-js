// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";
import { AccountInfo } from "@azure/msal-node";
import { UIManager } from "./UIManager";



contextBridge.exposeInMainWorld("api", {
    sendLoginMessage: () => {
        ipcRenderer.send("LOGIN");
    },
    startUiManager: () => {
        /**
         * The UI Manager is declared within this API because
         * although it's used in the listeners below, it must be initialized by the Renderer
         * process in order for the DOM to be accessible through JavaScript.
         */
        const uiManager = new UIManager();

        ipcRenderer.on(
            "SHOW_WELCOME_MESSAGE",
            (event: any, account: AccountInfo) => {
                uiManager.showWelcomeMessage(account);
            }
        );
    }
})