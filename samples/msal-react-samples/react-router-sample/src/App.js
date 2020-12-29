import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
// Material-UI imports
import { ThemeProvider } from '@material-ui/core/styles';
import Grid from "@material-ui/core/Grid";
import { theme } from "./styles/theme";

// MSAL imports
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";

// Sample app imports
import { PageLayout } from "./ui-components/PageLayout";
import { Home } from "./pages/Home";
import { Profile } from "./pages/Profile";

function App() {
  const msalInstance = new PublicClientApplication(msalConfig);

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <MsalProvider instance={msalInstance}>
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
      <Route path="/">
        <Home />
      </Route>
    </Switch>
  )
}

export default App;
