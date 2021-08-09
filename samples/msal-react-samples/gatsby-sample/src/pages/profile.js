import React, { useEffect, useState } from "react";

// Msal imports
import { MsalAuthenticationTemplate, useMsal, useAccount } from "@azure/msal-react";
import { InteractionStatus, InteractionType, InteractionRequiredAuthError } from "@azure/msal-browser";
import { loginRequest } from "../authConfig";

// Sample app imports
import Layout from "../components/Layout";
import { ProfileData } from "../components/ProfileData";
import { Loading } from "../components/Loading";
import { ErrorComponent } from "../components/ErrorComponent";
import { callMsGraph } from "../utils/MsGraphApiCall";

// Material-ui imports
import Paper from "@material-ui/core/Paper";

const ProfileContent = () => {
    const { instance, accounts, inProgress } = useMsal();
    const account = useAccount(accounts[0] || {});
    const [graphData, setGraphData] = useState(null);

    useEffect(() => {
        if (account && !graphData && inProgress === InteractionStatus.None) {
            const request = {
                ...loginRequest,
                account: account
            };
            instance.acquireTokenSilent(request).then((response) => {
                callMsGraph(response.accessToken).then(response => setGraphData(response));
            }).catch((e) => {
                if (e instanceof InteractionRequiredAuthError) {
                    instance.acquireTokenRedirect(request);
                }
            });
        }
    }, [account, inProgress, instance, graphData]);
  
    return (
        <Paper>
            { graphData ? <ProfileData graphData={graphData} /> : null }
        </Paper>
    );
};

const Profile = () => {
    const authRequest = {
        ...loginRequest
    };

    return (
        <Layout>
            <MsalAuthenticationTemplate 
                interactionType={InteractionType.Redirect} 
                authenticationRequest={authRequest} 
                errorComponent={ErrorComponent} 
                loadingComponent={Loading}
            >
                <ProfileContent />
            </MsalAuthenticationTemplate>
        </Layout>
      )
};

export default Profile;