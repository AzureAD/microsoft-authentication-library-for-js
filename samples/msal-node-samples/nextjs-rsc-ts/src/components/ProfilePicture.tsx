import { authProvider } from "~/services/auth";
import { Avatar } from "./mui";

export default async function ProfilePicture() {
  if (!(await authProvider.getAccount())) {
    return null;
  }

  return <Avatar alt="Profile Picture" src="profile/picture" />;
}
