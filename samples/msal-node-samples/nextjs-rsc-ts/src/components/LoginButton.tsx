import { login } from "~/actions/auth";
import Button from "@mui/material/Button";

export default function LoginButton() {
  return (
    <form action={login}>
      <Button variant="contained" color="primary" type="submit">
        Login
      </Button>
    </form>
  );
}
