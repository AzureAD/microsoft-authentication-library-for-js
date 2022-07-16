import { useMsal } from "@azure/msal-react";
import { b2cPolicies } from "../authConfig";
import Button from "@mui/material/Button";

export const EditProfileButton = () => {
  const { instance } = useMsal();

  return (
      <Button
        variant="contained" 
        color="primary"
        onClick={() =>
          instance
            .loginRedirect(b2cPolicies.authorities.editProfile)
            .catch((error) => {
              console.log(error);
            })
        }
      >
        Edit Profile
      </Button>
  );
};
