import React, { useState } from "react";
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./authConfig";
import { PageLayout } from "./ui.jsx";
import { ProfileData, callMsGraph } from "./graph.jsx";
import Button from "react-bootstrap/Button";
import "./styles/App.css";

const ProfileContent = () => {
    const { instance, accounts } = useMsal();
    const [graphData, setGraphData] = useState(null);

    function RequestProfileData() {
        instance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0]
        }).then((response) => {
            callMsGraph(response.accessToken).then(response => setGraphData(response));
        });
    }

    return (
        <>
            <h5 className="card-title">Welcome {accounts[0].name}</h5>
            {graphData ? 
                <ProfileData graphData={graphData} />
                :
                <Button variant="secondary" onClick={RequestProfileData}>Request Profile Information</Button>
            }
        </>
    );
};

const MainContent = () => {    
    return (
        <div className="App">
            <AuthenticatedTemplate>
                <ProfileContent />
            </AuthenticatedTemplate>

            <UnauthenticatedTemplate>
                <h5 className="card-title">Please sign-in to see your profile information.</h5>
            </UnauthenticatedTemplate>
        </div>
    );
};

export default function App() {
    const msalInstance = new PublicClientApplication(msalConfig);

    return (
        <MsalProvider instance={msalInstance}>
            <PageLayout>
                <MainContent />
            </PageLayout>
        </MsalProvider>
    );
}
