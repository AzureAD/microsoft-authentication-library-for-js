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

/**
 * Comment the line above and uncomment the line below for a 
 * Class-based equivalent of "Profile" component wrapped with "withMsal" HOC
 */

// import { ProfileWithMsal } from "./pages/ProfileClassComponent";

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
      <Route path="/">
        <Home />
      </Route>
    </Switch>
  )
}

export default App;
