import { login } from "~/actions/auth";
import Button from "@mui/material/Button";

export default function LoginServerActionButton() {
  return (
    <form action={login}>
      <Button variant="contained" color="primary" type="submit">
        Login using Server Action (experimental)
      </Button>
    </form>
  );
}
