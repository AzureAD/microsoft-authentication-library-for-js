import { InteractionStatus } from "@azure/msal-browser";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { b2cPolicies } from "../authConfig";
import Button from "@mui/material/Button";

export const EditProfileButton = () => {
    const isAuthenticated = useIsAuthenticated();
    const { inProgress, instance } = useMsal();

    const handleProfileEdit = () => {
        if (isAuthenticated && inProgress === InteractionStatus.None) {
            instance.acquireTokenRedirect(b2cPolicies.authorities.editProfile);
        }
    }

    return (
        <Button
            id="editProfileButton"
            variant="contained"
            color="primary"
            onClick={handleProfileEdit}
        >
            Edit Profile
        </Button>
    );
};
