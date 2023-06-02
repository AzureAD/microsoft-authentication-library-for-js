import { authProvider } from "~/services/auth";
import { SignInButton } from "./SignInButton";
import { SignOutButton } from "./SignOutButton";

export default async function SignInSignOutButton() {
  const account = await authProvider.getAccount();

  if (account) {
    return <SignOutButton />;
  } else {
    return <SignInButton />;
  }
}
