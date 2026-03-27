import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
// Material-UI imports
import Grid from "@material-ui/core/Grid";

// MSAL imports
import { MsalProvider } from "@azure/msal-react";
import { CustomNavigationClient } from "./utils/NavigationClient";

// Sample app imports
import { PageLayout } from "./ui-components/PageLayout";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";
import { Logout } from "./pages/Logout";
import { Redirect } from "./pages/Redirect";

// Class-based equivalents of "Profile" component
import { ProfileWithMsal } from "./pages/ProfileWithMsal";
import { ProfileRawContext } from "./pages/ProfileRawContext";
import { ProfileUseMsalAuthenticationHook } from "./pages/ProfileUseMsalAuthenticationHook";

function App({ pca }) {
    // The next 3 lines are optional. This is how you configure MSAL to take advantage of the router's navigate functions when MSAL redirects between pages in your app
    const navigate = useNavigate();
    const location = useLocation();
    const navigationClient = new CustomNavigationClient(navigate);
    pca.setNavigationClient(navigationClient);

    // Don't wrap redirect page in MsalProvider to prevent MSAL from consuming the auth response
    const isRedirectPage = location.pathname === '/redirect';

    if (isRedirectPage) {
        return <Redirect />;
    }

    return (
        <MsalProvider instance={pca}>
            <PageLayout>
                <Grid container justifyContent="center">
                    <Pages />
                </Grid>
            </PageLayout>
        </MsalProvider>
    );
}

function Pages() {
    return (
        <Routes>
            <Route path="/profile" element={<Profile />} />
            <Route path="/profileWithMsal" element={<ProfileWithMsal />} />
            <Route path="/profileRawContext" element={<ProfileRawContext />} />
            <Route
                path="/profileUseMsalAuthenticationHook"
                element={<ProfileUseMsalAuthenticationHook />}
            />
            <Route path="/logout" element={<Logout />} />
            <Route path="/" element={<Home />} />
        </Routes>
    );
}

export default App;
