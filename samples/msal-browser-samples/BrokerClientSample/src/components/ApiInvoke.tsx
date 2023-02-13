/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { useState } from "react";
import { Button } from "react-bootstrap";
import DropdownItem from "react-bootstrap/esm/DropdownItem";
import DropdownMenu from "react-bootstrap/esm/DropdownMenu";
import Dropdown from "react-bootstrap/esm/Dropdown";
import DropdownToggle from "react-bootstrap/esm/DropdownToggle";
import { MsIdentity } from "../services/msIdentity";
import { invokeRestMsGraphAsync } from "../graph";
import { InteractionRequiredAuthError, AccountInfo } from "@azure/msal-common";
import { PopupRequest } from "@azure/msal-browser";

interface ApiInvokeProps {
    identity: MsIdentity;
}

export const ApiInvoke = (props: ApiInvokeProps) => {
    const[activeAccount, setActiveAccount] = useState(null as AccountInfo | null)
    const[interactionNeeded, setInteractionNeeded] = useState(false)
    const[baseUri] = useState('https://graph.microsoft.com/')
    const[verb, setVerb] = useState('GET')
    const[version, setVersion] = useState('v1.0')
    const[uri, setUri] = useState('/users')
    const[scopes, setScopes] = useState('User.Read.All')
    const[requestBody, setRequestBody] = useState('')
    const[responseBody, setResponseBody] = useState('')
    
    async function invokeApiSilent() {
        let token = await acquireTokenSilentAsync();
        if (token !== null)
        {
            const response = await invokeRestMsGraphAsync(verb, token as string, new Headers(), baseUri + version + uri, verb === 'POST' ? requestBody : null);
            setResponseBody(JSON.stringify(response, null, 2));
        }
    }

    async function invokeApiPopup() {
        let token = await acquireTokenPopupAsync();
        if (token !== null)
        {
            const response = await invokeRestMsGraphAsync(verb, token as string, new Headers(), baseUri + version + uri, verb === 'POST' ? requestBody : null);
            setResponseBody(JSON.stringify(response, null, 2));
        }
    }

    async function acquireTokenPopupAsync(): Promise<string | null> {
        try
        {
            let request: PopupRequest;

            if (activeAccount !== null) {
                request = {
                    scopes: scopes.split(' '),
                    prompt: "consent",
                    account: activeAccount,
                    sid: activeAccount.idTokenClaims?.sid
                };
            }
            else {
                request = {
                    scopes: scopes.split(' '),
                    prompt: "login"
                };
            }

            let authResult = await props.identity.client?.acquireTokenPopup(request);
            setActiveAccount(authResult?.account as AccountInfo);
            setInteractionNeeded(false);
            return authResult?.accessToken as string;
        }
        catch (error: any) {
            setResponseBody(JSON.stringify(error, null, 2));
            return null;
        }
    }

    async function acquireTokenSilentAsync(): Promise<string | null> {
        try
        {
            if (activeAccount === null)
            {
                let account = props.identity.client?.getActiveAccount();

                if (account === null) {
                    throw new InteractionRequiredAuthError('No active account was found, interaction needed');
                }

                setActiveAccount(account as AccountInfo);
            }

            const authResult =
                await props.identity.client?.acquireTokenSilent(
                    {
                        scopes: scopes.split(' '),
                        account: activeAccount as AccountInfo
                    });

            return authResult?.accessToken as string;
        }
        catch (error: any) {
            if (error.name === "InteractionRequiredAuthError")
            {
                setInteractionNeeded(true);
            }

            setResponseBody(JSON.stringify(error));
            return null;
        }
    }

    return (
        <>
        <table>
            <tr>
                <td colSpan={4}>
                    <Button hidden={!interactionNeeded} onClick={invokeApiPopup} style={{width: '100%', backgroundColor: 'pink', color: 'black'}}>User input needed to authenticate, click to continue</Button>
                </td>
            </tr>
            <tr>
                <td colSpan={4}>
                    <hr style={{width: '100%'}}/>
                </td>
            </tr>
            <tr>
                <td >
                    <Dropdown>
                        <DropdownToggle id='verb' style={{width: '120px'}}>{verb}</DropdownToggle>
                        <DropdownMenu>
                            <DropdownItem link onClick={() => setVerb('GET')}>GET</DropdownItem>
                            <DropdownItem link onClick={() => setVerb('POST')}>POST</DropdownItem>
                            <DropdownItem link onClick={() => setVerb('DELETE')}>DELETE</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </td>
                <td>
                    <h5>{baseUri}</h5>
                </td>
                <td>
                    <Dropdown>
                        <DropdownToggle id='version'>{version}</DropdownToggle>
                        <DropdownMenu>
                            <DropdownItem link onClick={() => setVersion('v1.0')}>v1.0</DropdownItem>
                            <DropdownItem link onClick={() => setVersion('beta')}>beta</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </td>
                <td>
                    <input style={{width: '400px'}} value={uri} onChange={e => setUri(e.target.value)}></input>
                </td>
            </tr>
            <tr>
                <td style={{width: '150px'}}>
                    <span>Required Scopes:</span>
                </td>
                <td colSpan={3}>
                    <input style={{width: '100%'}} id="scopes" value={scopes} onChange={e => setScopes(e.target.value)}></input>
                </td>
            </tr>
            <tr hidden={verb != 'POST'}>
                <td colSpan={4}>
                    <textarea aria-multiline='true' style={{width: '100%', minHeight: '200px'}} value={requestBody}/>
                </td>
            </tr>
            <tr>
                <td colSpan={3}></td>
                <td align='right'>
                    <Button id="go" onClick={invokeApiSilent}>Invoke</Button>
                </td>
            </tr>
            <tr>
                <td colSpan={4}>
                    <hr style={{width: '100%'}}/>
                </td>
            </tr>
            <tr>
                <td colSpan={4}>
                    <textarea aria-multiline='true' style={{width: '100%', minHeight: '400px'}} readOnly value={responseBody}/>
                </td>
            </tr>
        </table>
        </>
    );
};

