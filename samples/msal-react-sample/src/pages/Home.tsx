import React from 'react';
import { useMsal } from "../msal-react";

export const HomePage: React.FunctionComponent = () => {
    const { account } = useMsal();

    return (
        <React.Fragment>
            {account?.name && <h2>Welcome, {account.name}</h2>}
            <p>Click one of the links above to demo MSAL.js 2.0 with Auth Code Flow, using React.</p>
        </React.Fragment>
    )}
