import { Button } from "./mui";

export default function LogoutButton() {
  return (
    <form action="/auth/logout" method="POST">
      <Button variant="contained" color="primary" type="submit">
        Logout using Route Handler
      </Button>
    </form>
  );
}
