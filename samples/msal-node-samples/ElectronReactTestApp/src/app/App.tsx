import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import React from 'react';
import { IpcMessages } from '../Constants';
import PageLayout from './components/PageLayout';
import { Profile } from './pages/Profile';
import { Home } from './pages/Home';
import { AccountInfo } from '@azure/msal-node';
import './styles/App.css';

declare const window: any;

const Pages = () => {
    return (
        <Routes>
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Home />} />
        </Routes>
    );
};

function App() {
    const [account, setAccount] = useState(null);

    useEffect(() => {
        //leveraging IPC channels to communication between the Main React
        window.api.send(IpcMessages.GET_ACCOUNT);
        window.api.receive(IpcMessages.SHOW_WELCOME_MESSAGE, (account: AccountInfo) => {
            setAccount(account);
        });

        return () => {
            window.api.removeAllListeners(IpcMessages.GET_ACCOUNT);
            window.api.removeAllListeners(IpcMessages.REMOVE_ACCOUNT);
        };
    }, []);

    return (
        <PageLayout account={account}>
            <Pages />
        </PageLayout>
    );
}

export default App;
