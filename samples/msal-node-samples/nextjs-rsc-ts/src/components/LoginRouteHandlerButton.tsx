import { Button } from "./mui";

// calls src/app/auth/login/route.ts
export default function LoginRouteHandlerButton() {
  return (
    <form action="/auth/login" method="POST">
      <Button variant="contained" color="primary" type="submit">
        Login using Route Handler
      </Button>
    </form>
  );
}
