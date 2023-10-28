import { logout } from "~/actions/auth";
import Button from "@mui/material/Button";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <Button variant="contained" color="primary" type="submit">
        Logout
      </Button>
    </form>
  );
}
