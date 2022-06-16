/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { testAccount, TEST_CONFIG } from "../TestConstants";
import { MsalProvider, UnauthenticatedTemplate } from "../../src/index";
import { PublicClientApplication, IPublicClientApplication, Configuration, InteractionType, EventType, EventMessage } from "@azure/msal-browser";

describe("UnauthenticatedTemplate tests", () => {
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

    test("Does not show child component if an account is signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <UnauthenticatedTemplate>
                    <span>No user is authenticated!</span>
                </UnauthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("No user is authenticated!")).not.toBeInTheDocument();
    });

    test("Shows child component if no account is signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <UnauthenticatedTemplate>
                    <span>No user is authenticated!</span>
                </UnauthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("No user is authenticated!")).toBeInTheDocument();
    });

    test("Does not show child component if specific username is signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <UnauthenticatedTemplate username={testAccount.username}>
                    <span>This user is not authenticated!</span>
                </UnauthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("This user is not authenticated!")).not.toBeInTheDocument();
    });

    test("Does not show child component if specific homeAccountId is signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <UnauthenticatedTemplate homeAccountId={testAccount.homeAccountId}>
                    <span>This user is authenticated!</span>
                </UnauthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("This user is not authenticated!")).not.toBeInTheDocument();
    });

    test("Does not show child component if specific localAccountId is signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <UnauthenticatedTemplate localAccountId={testAccount.localAccountId}>
                    <span>This user is authenticated!</span>
                </UnauthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("This user is not authenticated!")).not.toBeInTheDocument();
    });

    test("Shows child component if specific username is not signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <UnauthenticatedTemplate username={"test@example.com"}>
                    <span>This user is not authenticated!</span>
                </UnauthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("This user is not authenticated!")).toBeInTheDocument();
    });

    test("Shows child component if specific homeAccountId is not signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <UnauthenticatedTemplate homeAccountId={"homeAccountId_does_not_exist"}>
                    <span>This user is not authenticated!</span>
                </UnauthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("This user is not authenticated!")).toBeInTheDocument();
    });

    test("Shows child component if specific localAccountId is not signed in", async () => {        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise");
        const getAllAccountsSpy = jest.spyOn(pca, "getAllAccounts");
        getAllAccountsSpy.mockImplementation(() => [testAccount]);
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <UnauthenticatedTemplate localAccountId={"localAccountId_does_not_exist"}>
                    <span>This user is not authenticated!</span>
                </UnauthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("This user is not authenticated!")).toBeInTheDocument();
    });

    test("Does not show child component if inProgress value is startup", async () => {        
        let handleRedirectPromiseResolve = () => {};        
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise").mockImplementation(() => {
            // Prevent handleRedirectPromise from raising an event or resolving and updating inProgress
            return new Promise((resolve) => {
                handleRedirectPromiseResolve = resolve;
            });
        });
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <UnauthenticatedTemplate>
                    <span>No user is authenticated!</span>
                </UnauthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("No user is authenticated!")).not.toBeInTheDocument();

        handleRedirectPromiseResolve();
        await waitFor(() => expect(screen.queryByText("No user is authenticated!")).toBeInTheDocument());
    });

    test("Does not show child component if inProgress value is handleRedirect", async () => {        
        const eventCallbacks: Array<Function> = [];
        let eventId = 0;
        jest.spyOn(pca, "addEventCallback").mockImplementation((callbackFn) => {
            eventCallbacks.push(callbackFn);
            eventId += 1;
            return eventId.toString();
        });
        const handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise").mockImplementation(() => {
            const eventMessage: EventMessage = {
                eventType: EventType.HANDLE_REDIRECT_START,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            };

            eventCallbacks.forEach((callback) => {
                callback(eventMessage);
            });
            return Promise.resolve(null);
        });
        render(
            <MsalProvider instance={pca}>
                <p>This text will always display.</p>
                <UnauthenticatedTemplate>
                    <span>No user is authenticated!</span>
                </UnauthenticatedTemplate>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(screen.queryByText("This text will always display.")).toBeInTheDocument();
        expect(screen.queryByText("No user is authenticated!")).not.toBeInTheDocument();
    });
});
