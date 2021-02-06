// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import React, { useEffect } from 'react';
import './App.css';
import * as microsoftTeams from "@microsoft/teams-js";
import { EventType, PublicClientApplication } from "@azure/msal-browser";
import { useMsal } from '@azure/msal-react';

/**
 * This component is loaded when the Azure implicit grant flow has completed.
 */
function ClosePopup() {
    const { instance } = useMsal();

    // When the redirect has been processed, notify tab
    useEffect(() => {
        const callbackId = instance.addEventCallback((event) => {
            switch (event.eventType) {
                case EventType.LOGIN_SUCCESS:
                case EventType.ACQUIRE_TOKEN_SUCCESS:
                    microsoftTeams.authentication.notifySuccess(event.payload.accessToken);
                    break;

                case EventType.LOGIN_FAILURE:
                case EventType.ACQUIRE_TOKEN_FAILURE:
                    microsoftTeams.authentication.notifyFailure("Consent failed");
                default:
                    break;
            }
        })

        return () => {
            instance.removeEventCallback(callbackId);
        }
    }, [])       
    
      return (
        <div>
          <h1>Consent flow complete.</h1>
        </div>
      );
}

export default ClosePopup;
