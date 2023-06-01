import { useNavigate } from "react-router-dom";
// Material-UI imports

// MSAL imports
import { AuthenticatedTemplate, MsalProvider, UnauthenticatedTemplate } from "@azure/msal-react";
import { IPublicClientApplication } from "@azure/msal-browser";
import { CustomNavigationClient } from "./utils/NavigationClient";

// Sample app imports
import { useEffect } from "react";
import { Typography } from "@mui/material";

type AppProps = {
    pca: IPublicClientApplication;
};

function App({ pca }: AppProps) {
    // The next 3 lines are optional. This is how you configure MSAL to take advantage of the router's navigate functions when MSAL redirects between pages in your app
    const navigate = useNavigate();
    const navigationClient = new CustomNavigationClient(navigate);
    pca.setNavigationClient(navigationClient);

    useEffect(() => {
        pca.handleRedirectPromise().then(() => {
            if (pca.getActiveAccount()) {
                navigate("/profile");
            }
            else {
                pca.loginPopup().then(() => {
                    navigate("/profile");
                }
                ).catch(() => {
                    navigate("/");
                });
            }
        });
    }, [pca, navigate]);

    return (
        <MsalProvider instance={pca}>
            <>
                <AuthenticatedTemplate>
                    Authenticated
                </AuthenticatedTemplate>
                <UnauthenticatedTemplate>
                    <Typography variant="h6" align="center">Please sign-in to see your profile information.</Typography>
                </UnauthenticatedTemplate>
            </>
        </MsalProvider>
    );
}

export default App;