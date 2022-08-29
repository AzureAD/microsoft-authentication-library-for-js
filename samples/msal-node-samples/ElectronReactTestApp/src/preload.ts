const { ipcRenderer, contextBridge } = require('electron');
import { IpcMessages } from './Constants';
const validChannels = [
    IpcMessages.LOGIN,
    IpcMessages.LOGOUT,
    IpcMessages.GET_PROFILE,
    IpcMessages.GET_ACCOUNT,
    IpcMessages.SHOW_WELCOME_MESSAGE,
    IpcMessages.SET_PROFILE,
];

contextBridge.exposeInMainWorld('api', {
    send: (channel: IpcMessages) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel);
        }
    },
    receive: (channel: IpcMessages, func: (...args: any) => any) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    },
    removeAllListeners: (channel: IpcMessages) => {
        if (validChannels.includes(channel)) {
            ipcRenderer.removeAllListeners(channel);
        }
    },
});
