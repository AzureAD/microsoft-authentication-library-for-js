import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";

export function Logout() {
    const { instance } = useMsal();

    useEffect(() => {
        instance.logoutRedirect({
            account: instance.getActiveAccount(),
        })
    }, [ instance ]);

    return (
        <div>Logout</div>
    )
}
