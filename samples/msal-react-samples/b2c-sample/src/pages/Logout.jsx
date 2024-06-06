import React, { useEffect } from "react";
import { BrowserUtils } from "@azure/msal-browser";
import { useMsal } from "@azure/msal-react";

export function Logout() {
    const { instance } = useMsal();

    useEffect(() => {
        instance.logoutRedirect({
            account: instance.getActiveAccount(),
            onRedirectNavigate: () => !BrowserUtils.isInIframe()
        })
    }, [ instance ]);

    return (
        <div>Logout</div>
    )
}
