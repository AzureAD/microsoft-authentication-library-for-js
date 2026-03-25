import { useEffect, useState, useCallback } from "react";

// Msal imports
import { MsalAuthenticationTemplate, useMsal } from "@azure/msal-react";
import { EventType, InteractionType, InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "../authConfig";

// Sample app imports
import { ProfileData } from "../ui-components/ProfileData";
import { Loading } from "../ui-components/Loading";
import { ErrorComponent } from "../ui-components/ErrorComponent";
import { callMsGraph } from "../utils/MsGraphApiCall";

// Material-ui imports
import Paper from "@material-ui/core/Paper";

const ProfileContent = () => {
    const { instance } = useMsal();
    const [graphData, setGraphData] = useState(null);

    const fetchProfile = useCallback(() => {
        if (!instance.getActiveAccount()) {
            return;
        }
        callMsGraph().then(response => setGraphData(response)).catch((e) => {
            if (e instanceof InteractionRequiredAuthError) {
                instance.acquireTokenRedirect({
                    ...loginRequest,
                    account: instance.getActiveAccount()
                });
            }
        });
    }, [instance]);

    useEffect(() => {
        // Attempt to fetch profile data immediately
        fetchProfile();

        // Subscribe to active account changes so the Graph call is retried
        // once setActiveAccount has been called. In React 16/17 the render
        // triggered by ACQUIRE_TOKEN_SUCCESS fires before the LOGIN_SUCCESS
        // handler sets the active account, so getActiveAccount() returns null
        // on the first attempt.
        const callbackId = instance.addEventCallback((event) => {
            if (event.eventType === EventType.ACTIVE_ACCOUNT_CHANGED) {
                fetchProfile();
            }
        });

        return () => {
            if (callbackId) {
                instance.removeEventCallback(callbackId);
            }
        };
    }, [instance, fetchProfile]);
  
    return (
        <Paper>
            { graphData ? <ProfileData graphData={graphData} /> : null }
        </Paper>
    );
};

export function Profile() {
    const authRequest = {
        ...loginRequest
    };

    return (
        <MsalAuthenticationTemplate 
            interactionType={InteractionType.Popup} 
            authenticationRequest={authRequest} 
            errorComponent={ErrorComponent} 
            loadingComponent={Loading}
        >
            <ProfileContent />
        </MsalAuthenticationTemplate>
      )
};