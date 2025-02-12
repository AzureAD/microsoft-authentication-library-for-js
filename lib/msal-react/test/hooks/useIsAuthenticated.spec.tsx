import React from "react";
import { waitFor, screen } from '@testing-library/react';
import {act} from 'react';
import ReactDOMClient from 'react-dom/client';
import { clearNodeFolder } from 'broadcast-channel';

import "@testing-library/jest-dom";
import { Configuration, PublicClientApplication } from "@azure/msal-browser";
import { TEST_CONFIG, testAccount } from "../TestConstants";
import { MsalProvider, useIsAuthenticated, withMsal } from "../../src/index";

describe("useIsAuthenticated tests", () => {
    let pca: PublicClientApplication;
    const msalConfig: Configuration = {
        auth: {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID,
        },
        system: {
            allowPlatformBroker: false,
        },
    };

    let handleRedirectSpy: jest.SpyInstance;

    beforeEach(async () => {
        await clearNodeFolder();
        pca = new PublicClientApplication(msalConfig);
        handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        jest.spyOn(pca, "getAllAccounts").mockImplementation(() => []);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("useAuthenticated always returns true if user has an account", async () => {
        const invalidAuthStateCallback = jest.fn();

        const testComponent = ({ ...props }) => {
            const isAuth = useIsAuthenticated();
            const accounts = props.msalContext.accounts;

            if (accounts.length > 0 && !isAuth) {
                invalidAuthStateCallback();
            }

            return (
                <>
                    <p>This component has been wrapped by msal</p>
                    {accounts.length === 0 && <p>No accounts</p>}
                    {accounts.length > 0 && <p>Has accounts</p>}
                    {isAuth && <p>Is authed</p>}
                    {!isAuth && <p>Not authed</p>}
                </>
            );
        };

        const WrappedComponent = withMsal(testComponent);
        let container: ReactDOMClient.Container = document.createElement('div');
        document.body.appendChild(container);
        act(() => {
            ReactDOMClient.createRoot(container).render(
            <MsalProvider instance={pca}>
                <WrappedComponent />
            </MsalProvider>
        )});

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));

        expect(await screen.findByText("No accounts")).toBeInTheDocument();
        expect(await screen.findByText("Not authed")).toBeInTheDocument();

        // Clean up
        document.body.removeChild(container);

        const pcaWithAccounts = new PublicClientApplication(msalConfig);
        jest.spyOn(pcaWithAccounts, "getAllAccounts").mockImplementation(() => [
            testAccount,
        ]);

        container = document.createElement('div');
        document.body.appendChild(container);
        act(() => {
            ReactDOMClient.createRoot(container).render(
            <MsalProvider instance={pcaWithAccounts}>
                <WrappedComponent />
            </MsalProvider>
        )});

        expect(await screen.findByText("Has accounts")).toBeInTheDocument();
        expect(await screen.findByText("Is authed")).toBeInTheDocument();
        expect(invalidAuthStateCallback).toHaveBeenCalledTimes(1);

        // Clean up
        document.body.removeChild(container);
    });
});
