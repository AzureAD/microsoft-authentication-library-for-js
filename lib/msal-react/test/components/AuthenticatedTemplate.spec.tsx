/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { testAccount, TEST_CONFIG } from "../TestConstants";
import { MsalProvider, AuthenticatedTemplate } from "../../src/index";
import { PublicClientApplication, IPublicClientApplication, Configuration } from "@azure/msal-browser";

describe("AuthenticatedTemplate tests", () => {
    let pca: IPublicClientApplication;
    const msalConfig: Configuration = {
        auth: {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID
        }
    };

    beforeEach(() => {
        pca = new PublicClientApplication(msalConfig);
    });

    afterEach(() => {
    // cleanup on exiting
        jest.clearAllMocks();
    });

    test("Does not show child component if no account is signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <AuthenticatedTemplate>
                    <span> A user is authenticated!</span>
                </AuthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).not.toBeInTheDocument();
    });

    test("Shows child component if any account is signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <AuthenticatedTemplate>
                    <span> A user is authenticated!</span>
                </AuthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).toBeInTheDocument();
    });

    test("Shows child component if specific username is signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <AuthenticatedTemplate username={testAccount.username}>
                    <span> A user is authenticated!</span>
                </AuthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).toBeInTheDocument();
    });

    test("Shows child component if specific homeAccountId is signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <AuthenticatedTemplate homeAccountId={testAccount.homeAccountId}>
                    <span> A user is authenticated!</span>
                </AuthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).toBeInTheDocument();
    });

    test("Shows child component if specific localAccountId is signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <AuthenticatedTemplate localAccountId={testAccount.localAccountId}>
                    <span> A user is authenticated!</span>
                </AuthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).toBeInTheDocument();
    });

    test("Does not show child component if specific username is not signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <AuthenticatedTemplate username={"test@example.com"}>
                    <span> A user is authenticated!</span>
                </AuthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).not.toBeInTheDocument();
    });

    test("Does not show child component if specific homeAccountId is not signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <AuthenticatedTemplate homeAccountId={"homeAccountId_does_not_exist"}>
                    <span> A user is authenticated!</span>
                </AuthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).not.toBeInTheDocument();
    });

    test("Does not show child component if specific localAccountId is not signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <AuthenticatedTemplate localAccountId={"localAccountId_does_not_exist"}>
                    <span> A user is authenticated!</span>
                </AuthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).not.toBeInTheDocument();
    });

    test("Does not show child component if inProgress value is startup", async () => {
        let handleRedirectPromiseResolve = () => {};        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise").mockImplementation(() => {
            // Prevent handleRedirectPromise from raising an event or resolving and updating inProgress
            return new Promise((resolve) => {
                handleRedirectPromiseResolve = resolve;
            });
        });
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <AuthenticatedTemplate>
                    <span> A user is authenticated!</span>
                </AuthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("A user is authenticated!")).not.toBeInTheDocument();

        handleRedirectPromiseResolve();
        await waitFor(() => expect(screen.queryByText("A user is authenticated!")).toBeInTheDocument());
    });
});
