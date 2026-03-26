import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Typography from "@mui/material/Typography";
import { Link as RouterLink } from "react-router-dom";

export function Home() {
  return (
      <>
          <AuthenticatedTemplate>
            <ButtonGroup orientation="vertical">
              <Button component={RouterLink} to="/profile" variant="contained" color="primary">Request Profile Information</Button>
              <Button component={RouterLink} to="/profileUseMsalAuthenticationHook" variant="contained" color="primary">Request Access Token (using useMsalAuthentication hook)</Button>
              <Button component={RouterLink} to="/profileWithMsal" variant="contained" color="primary">Request Profile Information (using withMsal HOC)</Button>
              <Button component={RouterLink} to="/profileRawContext" variant="contained" color="primary">Request Profile Information (using raw context)</Button>
            </ButtonGroup>
          </AuthenticatedTemplate>

          <UnauthenticatedTemplate>
            <Typography variant="h6">
              <center>Please sign-in to see your profile information.</center>
            </Typography>
          </UnauthenticatedTemplate>
      </>
  );
}