import { useState, useEffect } from "react";

import { useMsal } from "./MsalProvider";
import { isAuthenticated } from "./utilities";

export function useIsAuthenticated(username?: string): boolean {
    const {
        state: { accounts },
        instance,
    } = useMsal();
    const [hasAuthenticated, setHasAuthenticated] = useState<boolean>(
        isAuthenticated(instance, username)
    );

    useEffect(() => {
        const result = isAuthenticated(instance, username);
        setHasAuthenticated(result);
    }, [accounts, username, instance]);

    return hasAuthenticated;
}
