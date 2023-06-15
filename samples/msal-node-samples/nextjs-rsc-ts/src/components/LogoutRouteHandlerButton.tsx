import { Button } from "./mui";

// calls src/app/auth/logout/route.ts
export default function LogoutRouteHandlerButton() {
  return (
    <form action="/auth/logout" method="POST">
      <Button variant="contained" color="primary" type="submit">
        Logout using Route Handler
      </Button>
    </form>
  );
}
