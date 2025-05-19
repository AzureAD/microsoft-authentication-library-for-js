import React from "react";
import { AccountInfo } from "@azure/msal-node";
import { NavigationBar } from "./NavigationBar";

type PageLayoutProps = {
    account: AccountInfo;
    children: JSX.Element;
};

export const PageLayout = (props: PageLayoutProps) => {
    return (
        <>
            <NavigationBar account={props.account} />
            <br />
            <br />
            {props.children}
            <br />
        </>
    );
};
