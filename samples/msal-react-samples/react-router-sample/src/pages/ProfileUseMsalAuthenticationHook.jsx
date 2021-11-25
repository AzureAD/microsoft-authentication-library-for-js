import { useEffect, useState } from "react";

// Msal imports
import { useMsal, useMsalAuthentication } from "@azure/msal-react";
import { InteractionStatus, InteractionType } from "@azure/msal-browser";
import { loginRequest } from "../authConfig";

// Sample app imports
import { ProfileData } from "../ui-components/ProfileData";
import { ErrorComponent } from "../ui-components/ErrorComponent";
import { callMsGraph } from "../utils/MsGraphApiCall";

// Material-ui imports
import Paper from "@material-ui/core/Paper";

const ProfileContent = () => {
    const { inProgress } = useMsal();
    const [graphData, setGraphData] = useState(null);
    const { result, error, acquireToken } = useMsalAuthentication(InteractionType.Popup, loginRequest);

    useEffect(() => {
        if (!graphData && result && result.accessToken) {
            callMsGraph(result.accessToken).then(response => setGraphData(response)).catch((e) => {
                // Since acquireToken can invoke interaction, make sure no other interaction is already in progress
                if (inProgress === InteractionStatus.None) {
                    acquireToken();
                }
            });
        }
    }, [graphData, result, acquireToken, inProgress]);
  
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