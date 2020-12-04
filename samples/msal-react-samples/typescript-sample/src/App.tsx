import React, { useState } from "react";
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal, useAccount } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./authConfig";
import { PageLayout } from "./ui";
import { ProfileData, callMsGraph } from "./graph";
import Button from "react-bootstrap/Button";
import "./styles/App.css";

const ProfileContent = () => {
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});
  const [graphData, setGraphData] = useState(null);

  function RequestProfileData() {
      if (account) {
        instance.acquireTokenSilent({
            ...loginRequest,
            account: account
        }).then((response) => {
            callMsGraph(response.accessToken).then(response => setGraphData(response));
        });
    };
  }

  return (
      <>
          <h5 className="card-title">Welcome {account ? account.name : "unknown"}</h5>
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
