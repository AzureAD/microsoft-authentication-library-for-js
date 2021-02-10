import { Switch, Route, useHistory } from "react-router-dom";
// Material-UI imports
import Grid from "@material-ui/core/Grid";

// MSAL imports
import { MsalProvider } from "@azure/msal-react";

// Sample app imports
import { PageLayout } from "./ui-components/PageLayout";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";

// Class-based equivalents of "Profile" component
import { ProfileWithMsal } from "./pages/ProfileWithMsal";
import { ProfileRawContext } from "./pages/ProfileRawContext";

function App({ pca }) {
  const history = useHistory();

  // This config is optional. Use it if you want to take advantage of the router's client side navigation when msal redirects between pages in your app
  const config = {
    clientSideNavigate: async (path, search, hash) => {
      history.push(path);
      return true;
    }
  }

  return (
    <MsalProvider instance={pca} config={config}>
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
      <Route path="/profileWithMsal">
        <ProfileWithMsal />
      </Route>
      <Route path="/profileRawContext">
        <ProfileRawContext />
      </Route>
      <Route path="/">
        <Home />
      </Route>
    </Switch>
  )
}

export default App;
