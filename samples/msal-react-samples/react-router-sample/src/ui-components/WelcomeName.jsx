import { useEffect, useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { EventType } from "@azure/msal-browser";
import Typography from "@mui/material/Typography";

const WelcomeName = () => {
    const { instance } = useMsal();
    const [name, setName] = useState(null);

    const updateName = useCallback(() => {
        const activeAccount = instance.getActiveAccount();
        if (activeAccount) {
            setName(activeAccount.name.split(' ')[0]);
        } else {
            setName(null);
        }
    }, [instance]);

    useEffect(() => {
        // Set the name from the current active account on mount
        updateName();

        // Subscribe to active account changes so the component updates when
        // setActiveAccount is called.
        const callbackId = instance.addEventCallback((event) => {
            if (event.eventType === EventType.ACTIVE_ACCOUNT_CHANGED) {
                updateName();
            }
        });

        return () => {
            if (callbackId) {
                instance.removeEventCallback(callbackId);
            }
        };
    }, [instance, updateName]);

    if (name) {
        return <Typography variant="h6">Welcome, {name}</Typography>;
    } else {
        return null;
    }
};

export default WelcomeName;