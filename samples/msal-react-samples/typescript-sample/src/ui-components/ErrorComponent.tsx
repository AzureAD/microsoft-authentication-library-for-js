import { Typography } from "@material-ui/core";
import { MsalAuthenticationResult } from "@azure/msal-react";

export const ErrorComponent: React.FC<MsalAuthenticationResult> = ({error}) => {
    return <Typography variant="h6">An Error Occurred: {error ? error.errorCode : "unknown error"}</Typography>;
}