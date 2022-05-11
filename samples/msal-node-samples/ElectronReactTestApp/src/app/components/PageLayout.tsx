import { AccountInfo } from '@azure/msal-common';
import React from 'react';
import { NavigationBar } from './NavigationBar';

type PageLayoutProps = {
    account: AccountInfo;
    children: JSX.Element;
};

function PageLayout(props: PageLayoutProps) {
    return (
        <>
            <NavigationBar account={props.account} />
            <br />
            <br />
            {props.children}
            <br />
        </>
    );
}

export default PageLayout;
