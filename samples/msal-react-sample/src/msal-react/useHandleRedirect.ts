import { AuthenticationResult } from "@azure/msal-browser";
import { useState, useEffect } from "react";

import { useMsal } from "./MsalProvider";

export function useHandleRedirect(): AuthenticationResult | null {
    const msal = useMsal();
    const [ redirectResponse, setRedirectResponse ] = useState<AuthenticationResult | null>(null);

    useEffect(() => {
        msal.handleRedirectPromise()
            .then(response => {
                if (response) {
                    setRedirectResponse(response);
                }
            });
            // TODO: error handling
    }, [msal]);

    return redirectResponse;
}