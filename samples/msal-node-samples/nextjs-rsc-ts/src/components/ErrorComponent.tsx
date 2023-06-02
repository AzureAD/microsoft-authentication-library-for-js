import { AuthError } from "@azure/msal-node";
import Typography from "@mui/material/Typography";

export default function ErrorComponent({ error }: { error: AuthError }) {
  return (
    <Typography variant="h6">An Error Occurred: {error.errorCode}</Typography>
  );
}
