import { Button } from "./mui";
import { login } from "~/actions/auth";

export async function SignInButton() {
  return (
    <div>
      <form action={login}>
        <Button color="inherit" type="submit">
          Login
        </Button>
      </form>
    </div>
  );
}
