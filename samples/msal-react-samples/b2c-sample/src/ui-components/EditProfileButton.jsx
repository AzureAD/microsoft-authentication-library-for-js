import { useMsal } from "@azure/msal-react";
import {b2cPolicies} from "../authConfig"
import Button from "@material-ui/core/Button";

export const EditProfileButton = () => {
    const { instance} = useMsal();
    
    if (b2cPolicies && b2cPolicies.authorities && b2cPolicies.authorities.editProfile && b2cPolicies.authorities.editProfile.authority && (typeof b2cPolicies.authorities.editProfile.authority==='string' && b2cPolicies.authorities.editProfile.authority.length>0))
        return (
            <div>
                <Button  variant="contained" color="primary"
                onClick={()=>instance.loginRedirect(b2cPolicies.authorities.editProfile).catch(error =>{ console.log(error)})} className="ml-auto">
                    Edit Profile
                </Button>
            </div>
        );
    else
        return (<></>);
};