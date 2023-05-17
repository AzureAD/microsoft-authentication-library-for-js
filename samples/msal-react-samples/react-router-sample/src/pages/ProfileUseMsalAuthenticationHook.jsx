import { useEffect, useState } from "react";

// Msal imports
import { useMsalAuthentication } from "@azure/msal-react";
import { InteractionType } from "@azure/msal-browser";
import { loginRequest } from "../authConfig";

// Sample app imports
import { ProfileData } from "../ui-components/ProfileData";
import { ErrorComponent } from "../ui-components/ErrorComponent";
import { callMsGraph } from "../utils/MsGraphApiCall";

// Material-ui imports
import Paper from "@mui/material/Paper";

const ProfileContent = () => {
    const [graphData, setGraphData] = useState(null);
    const { result, error } = useMsalAuthentication(InteractionType.Popup, {
        ...loginRequest,
        redirectUri: process.env.REACT_APP_POPUP_REDIRECT_URI, // e.g. /redirect
    });

    useEffect(() => {
        if (!!graphData) {
            // We already have the data, no need to call the API
            return;
        }

        if (!!error) {
            // Error occurred attempting to acquire a token, either handle the error or do nothing
            return;
        }

        if (result) {
            callMsGraph().then(response => setGraphData(response));
        }
    }, [error, result, graphData]);
  
    if (error) {
        return <ErrorComponent error={error} />;
    }

    return (
        <Paper>
            { graphData ? <ProfileData graphData={graphData} /> : null }
        </Paper>
    );
};

export function ProfileUseMsalAuthenticationHook() {
    return <ProfileContent />
};