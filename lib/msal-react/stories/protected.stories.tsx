import * as React from 'react';
import { MsalProvider, MsalAuthentication } from '../src';

import { msalInstance } from './msalInstance';

export default {
    title: 'MSAL React/MsalAuthentication',
};

export const Example = () => {
    return (
        <MsalProvider instance={msalInstance}>
            <p>This page has a component that will only render if you are authenticated.</p>
            <MsalAuthentication>
                <ProtectedComponent />
            </MsalAuthentication>
        </MsalProvider>
    )
};

const ProtectedComponent: React.FunctionComponent = () => {
    return <b>You are authenticated, which means you can see this content.</b>
}
