import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
// Material-UI imports
import Grid from "@mui/material/Grid";

// MSAL imports
import { EventType, PromptValue } from "@azure/msal-browser";
import { MsalProvider, useMsal } from "@azure/msal-react";
import { CustomNavigationClient } from "./utils/NavigationClient";

// Sample app imports
import { PageLayout } from "./ui-components/PageLayout";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { Logout } from "./pages/Logout";

import { b2cPolicies, loginRequest } from "./authConfig";

function App({ pca }) {
  return (
    <ClientSideNavigation pca={pca}>
      <MsalProvider instance={pca}>
        <PageLayout>
          <Grid container justifyContent="center">
            <Pages />
          </Grid>
        </PageLayout>
      </MsalProvider>
    </ClientSideNavigation>
  );
}

/**
 *  This component is optional. This is how you configure MSAL to take advantage of the router's navigate functions when MSAL redirects between pages in your app
 */ 
function ClientSideNavigation({ pca, children }) {
  const navigate = useNavigate();
  const navigationClient = new CustomNavigationClient(navigate);
  pca.setNavigationClient(navigationClient);

  // react-router-dom v6 doesn't allow navigation on the first render - delay rendering of MsalProvider to get around this limitation
  const [firstRender, setFirstRender] = useState(true);
  useEffect(() => {
    setFirstRender(false);
  }, []);

  if (firstRender) {
    return null;
  }

  return children;
}

function Pages() {
  const { instance } = useMsal();
  const [status, setStatus] = useState(null);

  useEffect(() => {
      const callbackId = instance.addEventCallback((event) => {
        if ((event.eventType === EventType.LOGIN_SUCCESS || event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) && event.payload.account) {
            /**
             * For the purpose of setting an active account for UI update, we want to consider only the auth 
             * response resulting from SUSI flow. "tfp" claim in the id token tells us the policy (NOTE: legacy 
             * policies may use "acr" instead of "tfp"). To learn more about B2C tokens, visit:
             * https://docs.microsoft.com/en-us/azure/active-directory-b2c/tokens-overview
             */
            if (event.payload.idTokenClaims['tfp'] === b2cPolicies.names.editProfile) {
              // retrieve the account from initial sign-in to the app
              const originalSignInAccount = instance.getAllAccounts()
                  .find(account =>
                    account.idTokenClaims.oid === event.payload.idTokenClaims.oid
                    &&
                    account.idTokenClaims.sub === event.payload.idTokenClaims.sub
                    &&
                    account.idTokenClaims['tfp'] === b2cPolicies.names.signUpSignIn
                  );
              
              let signUpSignInFlowRequest = {
                  scopes: [...loginRequest.scopes],
                  authority: b2cPolicies.authorities.signUpSignIn.authority,
                  account: originalSignInAccount,
                  prompt: PromptValue.NONE
              };
              
              // To get the updated account information
              instance.acquireTokenPopup(signUpSignInFlowRequest).then(() => {
                setStatus("update success")
              });
            }
          }
      });

      return () => {
          if (callbackId) {
              instance.removeEventCallback(callbackId);
          }
      }
  // eslint-disable-next-line  
  }, []);

  return (
      <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/" element={<Home status={status} />} />
      </Routes>
  );
}

export default App;
