import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
// Material-UI imports
import { ThemeProvider } from '@material-ui/core/styles';
import Grid from "@material-ui/core/Grid";
import { theme } from "./styles/theme";

// MSAL imports
import { MsalProvider } from "@azure/msal-react";

// Sample app imports
import { PageLayout } from "./ui-components/PageLayout";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";

// Class-based equivalents of "Profile" component
import { ProfileWithMsal } from "./pages/ProfileWithMsal";
import { ProfileRawContext } from "./pages/ProfileRawContext";

function App({pca}) {

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <MsalProvider instance={pca}>
            <PageLayout>
              <Grid container justify="center">
                <Pages />
              </Grid>
            </PageLayout>
        </MsalProvider>
      </ThemeProvider>
    </Router>
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
