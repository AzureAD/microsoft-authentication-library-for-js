import { authProvider } from "~/services/auth";

export default async function ProfilePage() {
  const account = await authProvider.getAccount();

  if (!account) {
    return <div></div>;
  }

  return <div></div>;
}
