import { authProvider } from "~/services/auth";
import { Typography } from "./mui";

export default async function WelcomeName() {
  const account = await authProvider.getAccount();

  if (account?.name) {
    return <Typography variant="h6">Welcome, {account?.name}</Typography>;
  } else {
    return null;
  }
}
