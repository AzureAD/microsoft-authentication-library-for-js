import React from 'react';
import { useMsal } from "../msal-react";

export const HomePage: React.FunctionComponent = () => {
    const { accounts } = useMsal();

    return (
        <React.Fragment>
            {accounts[0]?.username && (<h2>Welcome, {accounts[0].username}</h2>)}
            <p>Click one of the links above to demo MSAL.js 2.0 with Auth Code Flow, using React.</p>
        </React.Fragment>
    )}
