// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import React, { useEffect } from 'react';

import crypto from 'crypto';
import * as microsoftTeams from "@microsoft/teams-js";
import { useMsal } from '@azure/msal-react';


/**
 * This component is used to redirect the user to the Azure authorization endpoint from a popup
 */
function ConsentPopup(){
    const { instance } = useMsal();

    // On page load, invoke login redirect
    useEffect(() => {
        instance.loginRedirect({
            scopes: [
                "https://graph.microsoft.com/User.Read"
            ]
        });
    }, [])

    return (
        <div>
            <h1>Redirecting to consent page...</h1>
        </div>
    );
}

export default ConsentPopup;
