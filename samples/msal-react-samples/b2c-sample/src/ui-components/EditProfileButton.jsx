import { useMsal } from "@azure/msal-react";
import {b2cPolicies} from "../authConfig"
import Button from "@material-ui/core/Button";

export const EditProfileButton = () => {
    const { instance } = useMsal();

    if (b2cPolicies && b2cPolicies.authorities && b2cPolicies.authorities.editProfile && b2cPolicies.authorities.editProfile.authority &&  b2cPolicies.authorities.editProfile.authority != '')
        return (
            <div>
                <Button  variant="contained" color="primary"
                onClick={() => instance.loginPopup(b2cPolicies.authorities.editProfile).catch(error => console.log(error))} className="ml-auto">
                    Edit Profile
                </Button>
            </div>
        );
    else
        return (<></>);
};