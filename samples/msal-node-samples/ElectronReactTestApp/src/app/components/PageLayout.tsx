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
            <h5 className="text-center">Microsoft Authentication Library For React - Tutorial</h5>
            <br />
            {props.children}
            <br />
        </>
    );
}

export default PageLayout;
