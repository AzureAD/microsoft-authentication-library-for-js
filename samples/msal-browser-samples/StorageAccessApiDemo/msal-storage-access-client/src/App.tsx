import { Checkbox, MessageBar, MessageBarType, PrimaryButton, ProgressIndicator } from '@fluentui/react';
import { initializeIcons } from '@fluentui/react/lib/Icons';
import React, { useState } from 'react';
import './App.css';
import { checkStorageAccess, getServerUrl } from "./storage-access";
import { Status } from "./Status";

initializeIcons();

function App() {
    const params = new URLSearchParams(document.location.search);
    const defaultRequestBidirectional = params.get("bidirectional") === "true";

    const [ showIframe, setShowIframe ] = useState<boolean>(false);
    const [ storageAccessInProgress, setStorageAccessInProgress ] = useState<boolean>(false);
    const [ hasStorageAccess, setHasStorageAccess ] = useState<boolean | null>(null);
    const [forwardDeclared, setForwardDeclared] = useState<boolean | null>(null);
    const [ requestBirectional, setRequestBirectional ] = useState<boolean | undefined>(defaultRequestBidirectional);
    const [ canWriteCookies, setCanWriteCookies ] = useState<boolean | null>(null);

    // @ts-ignore
    const storageAccessEnabled = typeof document.requestStorageAccess === "function";

    // @ts-ignore
    const forwardDeclaredAvailable = typeof document.completeStorageAccessRequestFromSite === "function";

    const serverUrl = getServerUrl();
  return (
    <div className="App">
        <h1>1st Party Origin (Relying Party)</h1>
        <p>This client application serves as the first-party application which would be embeddeding eSTS in iframe ("3rd party origin" below).</p>
        {!storageAccessEnabled && (
            <MessageBar messageBarType={MessageBarType.blocked}>This prototype requires the Storage Access API, which is not enabled.</MessageBar>
        )}
        <MessageBar
            messageBarType={MessageBarType.warning}
        >
            This prototype is intended to demonstrate and test the mechanics of the Storage Access API. It does not reflect the end-to-end UX that will be shipped in MSAL.js.
        </MessageBar>
        <MessageBar>
            This prototype is best viewed in Safari or Firefox, which have shipped stable implementations of the Storage Access API. 
        </MessageBar>
        <h2>Glossary</h2>
        <dl>
            <dt>Storage Access API</dt>
            <dd>Browser API that prompts the user to allow a 3rd-party origin access to browser storage (namely cookies) set in a first-party context.</dd>

            <dt>1st Party Origin</dt>
            <dd>Origin running in the top-most frame in the browser. In the context of MSAL.js, this is the client application which uses MSAL.js. (e.g. <code>teams.microsoft.com</code>).</dd>

            <dt>3rd Party Origin</dt>
            <dd>Origin running in an iframe as a child of the client application. In the context of MSAL.js, this is the origin for eSTS (e.g. <code>login.microsoftonline.com</code>).</dd>
        </dl>
        <h2>Scenarios</h2>
        <p>This application demonstrates the following scenarios:</p>
        <ul>
            <li>Silently checking if Storage Access is available for the embedded origin.</li>
            <li>Interactively prompting for Storage Access for the embedded origin.</li>
            <li>Test ability for embedded origin to write 3p cookies.</li>
        </ul>
        <h2>Checking and Prompting for Storage Access</h2>
        <p>In order to check and grant for Storage Access, the top-frame application must open the application it wishes to embedded in an iframe to a page that invokes the Storage Access APIs.</p>
        <h3>Checking for existing Storage Access</h3>
        <p>An application can silently check for existing Storage Access by opening a hidden iframe to a page on the 3rd party domain that invokes <code>document.hasStorageAccess()</code> and returns the result to the 1st party origin.</p>
        <p>Click the button below to silently check if the 3rd party origin has Storage Access in the context of the current 1st party origin.</p>
        <PrimaryButton
            onClick={async () => {
                setStorageAccessInProgress(true);

                const {
                    hasStorageAccess,
                    canWriteCookies
                } = await checkStorageAccess(serverUrl);

                setHasStorageAccess(hasStorageAccess);
                setCanWriteCookies(canWriteCookies);

                setStorageAccessInProgress(false);

            }}
            disabled={storageAccessInProgress || !storageAccessEnabled}
        >
            Silently check for Storage Access
        </PrimaryButton>
        <Status status={hasStorageAccess} />
        {!canWriteCookies && hasStorageAccess && (
            <div style={{ width: "250px" }}>
                <MessageBar messageBarType={MessageBarType.warning}>
                    Storage Access has been granted, however, 3rd party is unable to write cookies. This means cookies have not been set in a 1st party context for the 3rd party origin.
                </MessageBar>
            </div>
        )}
        <div style={{ width: "250px", height: "1rem" }}>
            {storageAccessInProgress && (
                <ProgressIndicator />
            )}
        </div>

        <h2>Forward Declared</h2>
        <p>The Forward Declared enhancements to the Storage Access API enable the Storage Access API prompts to be shown when the user is visiting the embedded domain (i.e. the domain where Storage Access is needed) in the top frame, instead of inside an iframe.</p>
        <p>Requesting bidirectional storage access will request storage access both for when this application is the embedder and the embeddee, which is need for to fix front-channel logout.</p>
        <PrimaryButton
            disabled={!forwardDeclaredAvailable}
            onClick={() => {
                Promise.allSettled([
                    // @ts-ignore
                    document.completeStorageAccessRequestFromSite(serverUrl),
                    // @ts-ignore
                    requestBirectional && document.requestStorageAccessUnderSite(serverUrl)
                ])
                .then(async (results) => {
                    switch (results[0].status) {
                        case "fulfilled":
                            setForwardDeclared(true);

                            const {
                                hasStorageAccess,
                                canWriteCookies
                            } = await checkStorageAccess(serverUrl);
            
                            setHasStorageAccess(hasStorageAccess);
                            setCanWriteCookies(canWriteCookies);

                            break;
                        case "rejected":
                            setForwardDeclared(false);
                            window.location.href = `${serverUrl}?bidirectional=${requestBirectional}`;
                            break;
                    }
                })
            }}
        >
            Request Forward Declared Storage Access (for {serverUrl})
        </PrimaryButton>
        <Checkbox
            label="Bidirectional (front-channel logout)"
            disabled={!forwardDeclaredAvailable}
            onChange={(e, checked) => {
                setRequestBirectional(checked);
            }}
            defaultChecked={defaultRequestBidirectional}
        />
        <Status status={forwardDeclared} />

        <h3>Interactively prompting for Storage Access</h3>
        <p>In order to grant Storage Access, the user <strong>must</strong> interactively invoke the <code>document.requestStorageAccess()</code> API in the embedded application, such as through a button click.</p>
        <p>Click the button below to display the interactive page that will allow the user to interactively prompt for Storage Access.</p>
        <div>
            {showIframe ? (
                <PrimaryButton
                    onClick={() => {
                        setShowIframe(false);
                    }}
                    disabled={!storageAccessEnabled}
                >
                    Hide interactive prompts
                </PrimaryButton>
            ) : (
                <PrimaryButton
                    onClick={() => {
                        setShowIframe(true);
                    }}
                    disabled={!storageAccessEnabled}
                >
                    Display interactive prompts
                </PrimaryButton>
            )}
        </div>
        {showIframe && (
            <iframe 
                src={serverUrl}
                id="server-iframe" 
                title="MSAL Server"
            ></iframe>
        )}
    </div>
  );
}

export default App;
