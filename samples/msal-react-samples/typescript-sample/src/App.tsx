import { Switch, Route, useHistory } from "react-router-dom";
// Material-UI imports
import Grid from "@material-ui/core/Grid";

// MSAL imports
import { MsalProvider } from "@azure/msal-react";
import { IPublicClientApplication } from "@azure/msal-browser";
import { CustomNavigationClient } from "./utils/NavigationClient";

// Sample app imports
import { PageLayout } from "./ui-components/PageLayout";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";

type AppProps = {
    pca: IPublicClientApplication
};

function App({ pca }: AppProps) {
    // The next 3 lines are optional. This is how you configure MSAL to take advantage of the router's navigate functions when MSAL redirects between pages in your app
    const history = useHistory();
    const navigationClient = new CustomNavigationClient(history);
    pca.setNavigationClient(navigationClient);
  
    return (
      <MsalProvider instance={pca}>
        <PageLayout>
          <Grid container justify="center">
            <Pages />
          </Grid>
        </PageLayout>
      </MsalProvider>
    );
}
  
function Pages() {
    return (
        <Switch>
            <Route path="/profile">
                <Profile />
            </Route>
            <Route path="/">
                <Home />
            </Route>
        </Switch>
    )
}

export default App;
