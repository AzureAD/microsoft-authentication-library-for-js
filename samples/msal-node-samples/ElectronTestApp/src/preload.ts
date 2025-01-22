// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

import { contextBridge, ipcRenderer } from "electron";
import { UIManager } from "./UIManager";

import { GRAPH_CONFIG, IpcMessages } from "./Constants";

/**
 * This preload script exposes a "renderer" API to give
 * the Renderer process controlled access to some Node APIs
 * by leveraging IPC channels that have been configured for
 * communication between the Main and Renderer processes.
 */
contextBridge.exposeInMainWorld("renderer", {
    sendLoginMessage: () => {
        ipcRenderer.send(IpcMessages.LOGIN);
    },
    sendSignoutMessage: () => {
        ipcRenderer.send(IpcMessages.LOGOUT);
    },
    sendSeeProfileMessage: () => {
        ipcRenderer.send(IpcMessages.GET_PROFILE);
    },
    sendReadMailMessage: () => {
        ipcRenderer.send(IpcMessages.GET_MAIL);
    },
    /**
     * This method will be called by the Renderer
     * to give the preload script access to the UI manager
     */
    startUiManager: () => {
        /**
         * The UI Manager is declared within this API because
         * although it's used in the listeners below, it must be initialized by the Renderer
         * process in order for the DOM to be accessible through JavaScript.
         */
        const uiManager = new UIManager();

        // Main process message subscribers
        ipcRenderer.on(IpcMessages.SHOW_WELCOME_MESSAGE, (event, account) => {
            uiManager.showWelcomeMessage(account);
        });

        ipcRenderer.on(IpcMessages.SET_PROFILE, (event, graphResponse) => {
            uiManager.updateUI(graphResponse, GRAPH_CONFIG.GRAPH_ME_ENDPT);
        });

        ipcRenderer.on(IpcMessages.SET_MAIL, (event, graphResponse) => {
            uiManager.updateUI(graphResponse, GRAPH_CONFIG.GRAPH_MAIL_ENDPT);
        });
    },
});
