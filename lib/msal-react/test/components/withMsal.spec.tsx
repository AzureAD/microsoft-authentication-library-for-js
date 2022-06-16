import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AccountInfo, Configuration, EventCallbackFunction, EventMessage, EventType, InteractionType, PublicClientApplication } from "@azure/msal-browser";
import { TEST_CONFIG } from '../TestConstants';
import { MsalProvider, withMsal } from "../../src/index";

describe("withMsal tests", () => {
    let pca: PublicClientApplication;
    const msalConfig: Configuration = {
        auth: {
            clientId: TEST_CONFIG.MSAL_CLIENT_ID
        }
    };

    let eventCallback: EventCallbackFunction;
    let handleRedirectSpy: jest.SpyInstance;
    const accounts: AccountInfo[] = []

    beforeEach(() => {
        pca = new PublicClientApplication(msalConfig);
        jest.spyOn(pca, "addEventCallback").mockImplementation((callbackFn) => {
            eventCallback = callbackFn;
            return "callbackId";
        });
        handleRedirectSpy = jest.spyOn(pca, "handleRedirectPromise").mockImplementation(() => {
            const eventMessage: EventMessage = {
                eventType: EventType.HANDLE_REDIRECT_END,
                interactionType: InteractionType.Redirect,
                payload: null,
                error: null,
                timestamp: 10000
            }
            eventCallback(eventMessage);
            return Promise.resolve(null);
        });

        jest.spyOn(pca, "getAllAccounts").mockImplementation(() => accounts);
    });

    afterEach(() => {
        // cleanup on exiting
        jest.clearAllMocks();
    });

    test("withMsal wraps returns component with msal context values added to props", async () => {  
        const testComponent = ({...props}) => {
            return (
                <>
                    <p>This component has been wrapped by msal</p>
                    {props.msalContext.instance && (<p>Msal instance passed as prop!</p>)}
                    {props.msalContext.accounts && (<p>Accounts passed as prop!</p>)}
                    {props.msalContext.inProgress && (<p>inProgress passed as prop!</p>)}
                </>
            )
        }      
        
        const WrappedComponent = withMsal(testComponent);
        render(
            <MsalProvider instance={pca}>
                <WrappedComponent>
                </WrappedComponent>
            </MsalProvider>
        );

        await waitFor(() => expect(handleRedirectSpy).toHaveBeenCalledTimes(1));
        expect(await screen.findByText("This component has been wrapped by msal")).toBeInTheDocument();
        expect(screen.queryByText("Msal instance passed as prop!")).toBeInTheDocument();
        expect(screen.queryByText("Accounts passed as prop!")).toBeInTheDocument();
        expect(screen.queryByText("inProgress passed as prop!")).toBeInTheDocument();
    });
});
