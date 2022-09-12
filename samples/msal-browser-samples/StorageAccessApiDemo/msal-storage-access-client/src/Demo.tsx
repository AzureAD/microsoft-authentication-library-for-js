import React, { useEffect, useState } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { PrimaryButton, ProgressIndicator } from "@fluentui/react";
import { checkStorageAccess, promptForStorageAccess } from "./storage-access";
import { EventMessage, EventType } from "@azure/msal-browser";
import { Status } from "./Status";

export function Demo() {
    const [ hasStorageAccess, setHasStorageAccess ] = useState<boolean | null>(null);
    const [ storageAccessCheckInProgress, setStorageAccessCheckInProgress ] = useState<boolean>(false);
    const [ storageAccessPromptInProgress, setStorageAccessPromptInProgress ] = useState<boolean>(false);

    const { instance } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    const silentStorageAccessCheck = async () => {
        setStorageAccessPromptInProgress(true);
        const result = await checkStorageAccess();
        setHasStorageAccess(result.hasStorageAccess);
        setStorageAccessPromptInProgress(false);
    };

    const interactiveStorageAccessCheck = async () => {
        setStorageAccessPromptInProgress(true);
        const result = await promptForStorageAccess();
        setHasStorageAccess(result.hasStorageAccess);
        setStorageAccessPromptInProgress(false);
    };
    
    useEffect(() => {
        // This will be run on component mount
        const callbackId = instance.addEventCallback((message: EventMessage) => {
            // This will be run every time an event is emitted after registering this callback
            if (message.eventType === EventType.LOGIN_SUCCESS) {
                const result = message.payload;    
                if (result) {
                    promptForStorageAccess();
                }
            }
        });

        silentStorageAccessCheck();

        return () => {
            // This will be run on component unmount
            if (callbackId) {
                instance.removeEventCallback(callbackId);
            }
        }
        
    }, [ instance ]);

    const checkStorageAccessComponents = (
        <>
            <h3>Silent Check</h3>
            <PrimaryButton
                disabled={storageAccessCheckInProgress}
                onClick={silentStorageAccessCheck}
            >
                Check for Storage Access
            </PrimaryButton>
            <Status status={hasStorageAccess} />
            <div style={{ width: "250px", height: "1rem" }}>
                {storageAccessCheckInProgress && (
                    <ProgressIndicator />
                )}
            </div>
        </>
    );

    return (
        <div>
            <h1>MSAL.js Storage Access Demo</h1>
            <p>This page demonstrates how the Storage Access API could be used with MSAL.js to prompt the user after logging in.</p>
            {isAuthenticated ? (
                <div>
                    <h2>Logout</h2>
                    <PrimaryButton
                        onClick={() => {
                            instance.logoutRedirect();
                        }}
                    >
                        Logout
                    </PrimaryButton>
                    <h2>Storage Access</h2>
                    {checkStorageAccessComponents}
                    <h3>Interactive Prompt</h3>
                    <PrimaryButton
                        disabled={storageAccessPromptInProgress}
                        onClick={interactiveStorageAccessCheck}
                    >
                        Prompt for Storage Access
                    </PrimaryButton>
                    <div style={{ width: "250px", height: "1rem" }}>
                        {storageAccessPromptInProgress && (
                            <ProgressIndicator />
                        )}
                    </div>
                </div>
            ) : (
                <div>
                    <h2>Login</h2>
                    <PrimaryButton
                        onClick={() => {
                            instance.loginRedirect();
                        }}
                    >
                        Login
                    </PrimaryButton>
                    {checkStorageAccessComponents}
                </div>
            )}
        </div>
    )
}
