import { useEffect, useState } from "react";

// Msal imports
import { MsalAuthenticationTemplate, useMsal, useAccount } from "@azure/msal-react";
import { InteractionType, InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "../authConfig";

// Sample app imports
import { Loading } from "../ui-components/Loading";
import { ErrorComponent } from "../ui-components/ErrorComponent";
import { ProtectedData } from "../ui-components/ProtectedData";

// Material-ui imports
import Paper from "@material-ui/core/Paper";

const ProtectedContent = () => {
    const { instance, accounts, inProgress } = useMsal();
    const account = useAccount(accounts[0] || {});
    const [atsResponse, setAtsResponse] = useState(null);

    useEffect(() => {
        if (!atsResponse && account && inProgress === InteractionStatus.None) {
            instance.acquireTokenSilent({
                ...loginRequest,
                account: account
            }).then((response) => {
                setAtsResponse(response);
            });
        }
    }, [account, inProgress, instance, atsResponse]);

    return (
        <Paper>
            { atsResponse ? <ProtectedData responseData={atsResponse} /> : null}
        </Paper>
    );
};

export function Protected() {
    const authRequest = {
        ...loginRequest
    };

    return (
        <MsalAuthenticationTemplate
            interactionType={InteractionType.Popup}
            authenticationRequest={authRequest}
            errorComponent={ErrorComponent}
            loadingComponent={Loading}
        >
            <ProtectedContent />
        </MsalAuthenticationTemplate>
    )
};