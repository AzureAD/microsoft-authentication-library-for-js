import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import React from 'react';
import { IpcMessages } from '../Constants';
import PageLayout from './components/PageLayout';
import { Profile } from './pages/Profile';
import './styles/App.css';

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
        ipcRenderer.send(IpcMessages.GET_ACCOUNT);
        ipcRenderer.on(IpcMessages.SHOW_WELCOME_MESSAGE, (event, res) => {
            setAccount(res);
        });

        ipcRenderer.on(IpcMessages.REMOVE_ACCOUNT, () => {
            setAccount(null);
        });
    }, []);

    return (
        <PageLayout account={account}>
            <Pages />
        </PageLayout>
    );
}

export default App;
