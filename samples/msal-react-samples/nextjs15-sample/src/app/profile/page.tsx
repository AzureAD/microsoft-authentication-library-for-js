"use client";
import { MsalAuthenticationTemplate, useMsal } from "@azure/msal-react";
import { InteractionStatus, InteractionType, InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "../../authConfig";
import React, { useEffect, useState } from "react";
import { ProfileData } from "../../ui-components/ProfileData";
import { callMsGraph } from "../../utils/MsGraphApiCall";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

const ProfileContent: React.FC = () => {
    const { instance, inProgress } = useMsal();
    const [graphData, setGraphData] = useState<any>(null);

    useEffect(() => {
        if (!graphData && inProgress === InteractionStatus.None) {
            callMsGraph().then(response => setGraphData(response)).catch((e) => {
                if (e instanceof InteractionRequiredAuthError) {
                    instance.acquireTokenRedirect({
                        ...loginRequest,
                        account: instance.getActiveAccount() || undefined
                    });
                }
            });
        }
    }, [inProgress, graphData, instance]);
  
    return (
        <Paper>
            { graphData ? <ProfileData graphData={graphData} /> : null }
        </Paper>
    );
};

const ErrorComponent: React.FC<{ error: any }> = ({ error }) => {
    return (
        <Typography variant="h6" color="error">
            {error.message}
        </Typography>
    );
};

const ProfilePage: React.FC = () => {
    return (
        <MsalAuthenticationTemplate interactionType={InteractionType.Redirect} errorComponent={ErrorComponent} authenticationRequest={loginRequest}>
            <ProfileContent />
        </MsalAuthenticationTemplate>
    );
};

export default ProfilePage;