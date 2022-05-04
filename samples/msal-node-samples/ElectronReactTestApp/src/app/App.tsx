import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import React from 'react';
import { IpcMessages } from '../Constants';
import PageLayout from './components/PageLayout';
import { Profile } from './pages/Profile';
import './styles/App.css';

//The ipcRenderer module is an EventEmitter. It provides a few methods so you can send synchronous and asynchronous messages
const { ipcRenderer } = window.require('electron');

const Pages = () => {
    return (
        <Routes>
            <Route path="/profile" element={<Profile />} />
        </Routes>
    );
};

function App() {
    const [account, setAccount] = useState(null);

    useEffect(() => {
        //leveraging IPC channels to communication between the Main React
        ipcRenderer.send(IpcMessages.GET_ACCOUNT);
        ipcRenderer.on(IpcMessages.SHOW_WELCOME_MESSAGE, (event, res) => {
            setAccount(res);
        });

        ipcRenderer.on(IpcMessages.REMOVE_ACCOUNT, () => {
            setAccount(null);
        });

        return () => {
            ipcRenderer.removeAllListeners(IpcMessages.GET_ACCOUNT);
            ipcRenderer.removeAllListeners(IpcMessages.REMOVE_ACCOUNT);
        };
    }, []);

    return (
        <PageLayout account={account}>
            <Pages />
        </PageLayout>
    );
}

export default App;
