import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { BrowserUtils } from "@azure/msal-browser";

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
