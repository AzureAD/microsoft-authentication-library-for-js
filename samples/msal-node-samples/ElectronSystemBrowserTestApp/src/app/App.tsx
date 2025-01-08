import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { AccountInfo } from "@azure/msal-node";
import { IpcMessages } from "../Constants";
import { Profile } from "./pages/Profile";
import { Home } from "./pages/Home";
import { PageLayout } from "./components/PageLayout";

import "./styles/App.css";

declare const window: any;

const Pages = () => {
    return (
        <Routes>
            <Route path="/profile" element={<Profile />} />
            <Route path="/" element={<Home />} />
        </Routes>
    );
};

const App = () => {
    const [account, setAccount] = useState(null);
    useEffect(() => {
        //leveraging IPC channels to communication between the Main React
        window.api.send(IpcMessages.GET_ACCOUNT);
        window.api.receive(
            IpcMessages.SHOW_WELCOME_MESSAGE,
            (account: AccountInfo) => {
                setAccount(account);
            }
        );
        /**
         * The IPC message GET_AUTH_CODE_URL is only used to listen to the auth code URL for test purposes.
         */
        window.api.receive(IpcMessages.GET_AUTH_CODE_URL, (url: string) => {
            console.log(url);
        });
        return () => {
            window.api.removeAllListeners(IpcMessages.GET_ACCOUNT);
            window.api.removeAllListeners(IpcMessages.SHOW_WELCOME_MESSAGE);
            window.api.removeAllListeners(IpcMessages.GET_AUTH_CODE_URL);
        };
    }, []);

    return (
        <>
            <PageLayout account={account}>
                <Pages />
            </PageLayout>
        </>
    );
};

export default App;
