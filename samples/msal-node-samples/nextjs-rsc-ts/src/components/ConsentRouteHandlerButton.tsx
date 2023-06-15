import { Button } from "./mui";

// calls src/app/auth/eventConsent/route.ts
export default function ConsentRouteHandlerButton() {
  return (
    <form action="/auth/eventConsent" method="POST">
      <Button type="submit">Consent with Route Handler</Button>
    </form>
  );
}
