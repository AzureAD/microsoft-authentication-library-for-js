import { logout } from "~/actions/auth";
import { Button } from "./mui";

export default function LogoutServerActionButton() {
  return (
    <form action={logout}>
      <Button variant="contained" color="primary" type="submit">
        Logout using Server Action (experimental)
      </Button>
    </form>
  );
}
