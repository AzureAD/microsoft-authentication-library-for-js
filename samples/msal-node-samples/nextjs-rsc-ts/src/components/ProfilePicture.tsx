import { authProvider } from "~/services/auth";
import Avatar from "@mui/material/Avatar";

export default async function ProfilePicture() {
  if (!(await authProvider.getAccount())) {
    return null;
  }

  return <Avatar alt="Profile Picture" src="profile/picture" />;
}
