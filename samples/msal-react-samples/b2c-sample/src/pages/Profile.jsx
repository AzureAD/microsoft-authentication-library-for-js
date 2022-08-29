import { useEffect, useState } from "react";

// Msal imports
import { MsalAuthenticationTemplate, useMsal } from "@azure/msal-react";
import { InteractionStatus, InteractionType, InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "../authConfig";

// Sample app imports
import { ProfileData } from "../ui-components/ProfileData";
import { Loading } from "../ui-components/Loading";
import { ErrorComponent } from "../ui-components/ErrorComponent";
import { callApi } from "../utils/ApiCall";

// Material-ui imports
import Paper from "@mui/material/Paper";

const ProfileContent = () => {
    const { instance, inProgress } = useMsal();
    const [apiData, setApiData] = useState(null);

    useEffect(() => {
        if (!apiData && inProgress === InteractionStatus.None) {
            callApi().then(response => setApiData(response)).catch((e) => {
                if (e instanceof InteractionRequiredAuthError) {
                    instance.acquireTokenRedirect({
                        ...loginRequest,
                        account: instance.getActiveAccount()
                    });
                }
            });
        }
    }, [inProgress, apiData, instance]);
  
    return (
        <Paper>
            { apiData ? <ProfileData apiData={apiData} /> : null }
        </Paper>
    );
};

export function Profile() {
    const authRequest = {
        ...loginRequest
    };

    return (
        <MsalAuthenticationTemplate 
            interactionType={InteractionType.Redirect} 
            authenticationRequest={authRequest} 
            errorComponent={ErrorComponent} 
            loadingComponent={Loading}
        >
            <ProfileContent />
        </MsalAuthenticationTemplate>
      )
};