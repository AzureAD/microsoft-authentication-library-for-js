import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Typography from "@material-ui/core/Typography";
import { useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAppInsights } from "../AnalyticsProvider";

export function Home() {
  const appInsights = useAppInsights();
  const testInsights = useCallback(() => {
      appInsights?.track({ name:"customEvent" })
  }, [appInsights]);
  return (
      <>
          <AuthenticatedTemplate>
            <ButtonGroup orientation="vertical">
              <Button component={RouterLink} to="/profile" variant="contained" color="primary">Request Profile Information</Button>
            </ButtonGroup>
          </AuthenticatedTemplate>

          <UnauthenticatedTemplate>
            <Typography variant="h6" align="center">Please sign-in to see your profile information.</Typography>
          </UnauthenticatedTemplate>

          <Button onClick={testInsights}>Test Insights</Button>
      </>
  );
}