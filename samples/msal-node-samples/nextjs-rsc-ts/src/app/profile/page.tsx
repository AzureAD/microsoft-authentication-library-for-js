import { redirect } from "next/navigation";
import { GraphData, ProfileData } from "~/components/ProfileData";
import { authProvider } from "~/services/auth";

async function getUserInfo() {
  const { account, instance } = await authProvider.authenticate();

  if (!account) {
    return null;
  }

  const token = await instance.acquireTokenSilent({
    account,
    scopes: ["User.Read"],
  });

  if (!token) {
    return null;
  }

  const response = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  return (await response.json()) as GraphData;
}

export default async function ProfilePage() {
  const profile = await getUserInfo();

  if (!profile) {
    return redirect("/");
  }

  return <ProfileData graphData={profile} />;
}
