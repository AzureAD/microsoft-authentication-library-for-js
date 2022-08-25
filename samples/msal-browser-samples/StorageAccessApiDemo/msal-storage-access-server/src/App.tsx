import React, { useState, useEffect } from 'react';
import { PrimaryButton, MessageBar, MessageBarType, DefaultButton, Checkbox } from '@fluentui/react';
import { initializeIcons } from '@fluentui/react/lib/Icons';
import './App.css';
import { Status } from './Status';

initializeIcons();

function getClientUrl() {
    if (window.location.href.includes("azurestaticapps")) {
        return "https://icy-ocean-083803b1e.1.azurestaticapps.net/";
    }

    return "http://localhost:3000";
}

function App() {
    const params = new URLSearchParams(document.location.search);
    const defaultRequestBidirectional = params.get("bidirectional") === "true";

    const [hasStorageAccess, setStorageAccess] = useState<boolean | null>(null);
    const [grantedStorageAccess, setGrantedStorageAccess] = useState<boolean | null>(null);
    const [canWriteCookies, setCanWriteCookies] = useState<boolean | null>(null);
    const [forwardDeclared, setForwardDeclared] = useState<boolean | null>(null);
    const [ requestBirectional, setRequestBirectional ] = useState<boolean | undefined>(defaultRequestBidirectional);
    const [currentCookies, setCurrentCookies] = useState<string>(document.cookie);

    const isInIframe = window !== window.top;
    const clientUrl = getClientUrl();

    // @ts-ignore
    const storageAccessEnabled = typeof document.requestStorageAccess === "function";

    // @ts-ignore
    const forwardDeclaredAvailable = typeof document.requestStorageAccessUnderSite === "function";
    
    function checkStorageAccess() {
        // @ts-ignore
        document.hasStorageAccess().then(result => {
            console.log('hasStorageAccess', result);
            setStorageAccess(result);
        });
    }

    function requestStorageAccess() {
        // @ts-ignore
        document.requestStorageAccess()
            .then(() => {
                console.log('grantedStorageAccess', true);
                setGrantedStorageAccess(true);
                setStorageAccess(true);
                writeTestCookie();
            })
            .catch(() => {
                console.log('grantedStorageAccess', false);
                setGrantedStorageAccess(false);
                setStorageAccess(false);
                writeTestCookie();
            })
    }

    function writeTestCookie() {
        const cookieValue = "test-cookie=test-value";
        const testCookie = `${cookieValue}; SameSite=None; Secure`;
        document.cookie = testCookie;
        setCanWriteCookies(document.cookie.includes(cookieValue));
        setCurrentCookies(document.cookie);
    }

    useEffect(() => {
        checkStorageAccess();
    }, [])

    return (
        <div className="App" style={{
            padding: "1rem"
        }}>
            <h1>3rd Party Origin (IDP) {!isInIframe && "(loaded in 1p context)"}</h1>
            <p>
                {isInIframe ? (
                    <DefaultButton target="_parent" href="/">Open in top frame (1p context)</DefaultButton>
                ) : (
                    <DefaultButton href={clientUrl}>Open in iframe (3p context)</DefaultButton>
                )}
            </p>
            <DefaultButton href="/">Refresh</DefaultButton>

            {!storageAccessEnabled ? (
                <div style={{ margin: "1rem 0" }}>
                    <MessageBar messageBarType={MessageBarType.blocked}>Storage Access API not enabled.</MessageBar>
                </div>
            ) : (
                <div>
                    <section>
                        <h2>Storage Access</h2>
                        {isInIframe ? (
                            <>
                                <h3>Check Storage Access</h3>
                                <h4>Notes</h4>
                                <ul>
                                    <li>Storage access should always granted when an app is running in a 1p context.</li>
                                    <li>Browsers may silently grant storage access based on previous interactions with the origin in question.</li>
                                </ul>
                                <PrimaryButton onClick={() => {
                                    checkStorageAccess();
                                }}>Check Storage Access</PrimaryButton>
                                <Status status={hasStorageAccess} />
        
                                <h3>Request Storage Access</h3>
                                <h4>Notes</h4>
                                <ul>
                                    <li>In Safari, if requesting storage access fails without a prompt, it means you need to interact with this site in a 1p context. This is a known limitation in Safari.</li>
                                    <li>In Firefox, if storage access is blocked via the browser prompt, further requests may fail without a prompt until the page is refreshed. This is a known limitation in Firefox.</li>
                                    <li>If requesting storage access succeeds without a prompt, it means consent was auto-granted. Browsers will use varying heuristics to determine whether or not to show a second browser prompt to the user allow/block access.</li>
                                </ul>
                                <PrimaryButton onClick={() => {
                                    requestStorageAccess();
                                }}>Request Storage Access</PrimaryButton>
                                <Status status={grantedStorageAccess} />
                            </>
                        ) : (
                            <>
                                <h2>Forward Declared</h2>
                                <p>The Forward Declared enhancements to the Storage Access API enable the Storage Access API prompts to be shown when the user is visiting the embedded domain (i.e. the domain where Storage Access is needed) in the top frame, instead of inside an iframe.</p>
                                <p>Requesting bidirectional storage access will request storage access both for when this application is the embedder and the embeddee, which is need for to fix front-channel logout.</p>
                                <PrimaryButton
                                    disabled={!forwardDeclaredAvailable}
                                    onClick={() => {
                                        Promise.allSettled([
                                            // @ts-ignore
                                            document.requestStorageAccessUnderSite(clientUrl),
                                            // @ts-ignore
                                            requestBirectional && document.completeStorageAccessRequestFromSite(clientUrl)
                                        ])
                                            .then(results => {
                                                switch (results[0].status) {
                                                    case "fulfilled": 
                                                        setForwardDeclared(true);
                                                        window.location.href = `${clientUrl}?bidirectional=${requestBirectional}`;
                                                        break;
                                                    case "rejected":
                                                        setForwardDeclared(false);
                                                        break;
                                                }
                                            });
                                    }}
                                >
                                    Grant Forward Declared Storage Access (for {clientUrl})
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
                            </>
                        )}
                    </section>
                    <section>
                        <h2>Cookies</h2>
                        <h3>Ability to write/read 3p cookies</h3>
                        <h4>Notes</h4>
                        <ul>
                            <li>If writing a test cookie fails after storage access has been granted, it means this origin needs to write cookies in a 1p context before it can write in a 3p context. This is a known limitation of Safari.</li>
                            <li>In this scenario, eSTS should return an <code>interaction_required</code> error, to trigger the application to invoke eSTS UX in a 1p context (the eSTS UX writes 1p cookies when visited). This will enable subsequent iframe-based request to succeed.</li>
                        </ul>
                        <PrimaryButton onClick={() => {
                            writeTestCookie();
                        }}>Write Test Cookie</PrimaryButton>
                        <Status status={canWriteCookies} />
                        <h4>Current Cookies</h4>
                        <DefaultButton onClick={() => {
                            const cookies = document.cookie.split(";");
                            for (var i = 0; i < cookies.length; i++) {
                                var cookie = cookies[i];
                                var eqPos = cookie.indexOf("=");
                                var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
                            }
                            setCurrentCookies(document.cookie);
                        }}>Clear Cookies</DefaultButton>
                        {currentCookies.length > 0 && (
                            <pre>
                                <ul>
                                    {currentCookies.split(";").map((cookie) => (
                                        <li key={cookie}>{cookie.trim()}</li>
                                    ))}
                                </ul>
                            </pre>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}

export default App;
