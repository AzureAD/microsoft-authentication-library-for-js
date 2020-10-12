import { AuthenticationResult, AuthError } from "@azure/msal-browser";
import { useState, useEffect } from "react";

import { useMsal } from "./MsalProvider";

export function useHandleRedirect(): [AuthenticationResult|null, AuthError|null] {
    const { instance } = useMsal();
    const [
        [redirectResponse, redirectError],
        setRedirectResponse,
    ] = useState<[AuthenticationResult|null, AuthError|null]>([null, null]);

    useEffect(() => {
        instance.handleRedirectPromise().then(response => {
            if (response) {
                setRedirectResponse([response, null]);
            }
        }).catch(e => {
            setRedirectResponse([null, e]);
        });
    }, [instance]);

    return [redirectResponse, redirectError];
}
