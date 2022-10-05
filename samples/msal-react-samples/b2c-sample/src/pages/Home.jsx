import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from "@azure/msal-react";
import { Link as RouterLink } from "react-router-dom";

import Stack from '@mui/material/Stack';
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Typography from "@mui/material/Typography";

import { EditProfileButton } from "../ui-components/EditProfileButton";
import { TokenClaims } from "../ui-components/TokenClaims";

export function Home(props) {
  const { instance } = useMsal();

  return (
      <>
          <AuthenticatedTemplate>
          <Typography id="interactionStatus" variant="h6">
              <center>{props.status}</center>
          </Typography>
          <Stack direction="column" spacing={2}>
          <ButtonGroup orientation="vertical">
              <Button component={RouterLink} to="/profile" variant="contained" color="primary" id="callApiButton">Call Hello API</Button>
              <EditProfileButton />
            </ButtonGroup>
            <Typography variant="body1">Claims in your ID token are shown below: </Typography>
            <Paper>
              { instance.getActiveAccount() ? <TokenClaims tokenClaims={instance.getActiveAccount().idTokenClaims} /> : null }
            </Paper>
          </Stack>
          </AuthenticatedTemplate>

          <UnauthenticatedTemplate>
            <Typography variant="h6">
              <center>Please sign-in to see your profile information.</center>
            </Typography>
          </UnauthenticatedTemplate>
      </>
  );
}