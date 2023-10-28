import { acquireCalendarTokenInteractive } from "~/actions/auth";
import Button from "@mui/material/Button";

export default function ConsentButton() {
  return (
    <form action={acquireCalendarTokenInteractive}>
      <Button type="submit">Consent event permissions</Button>
    </form>
  );
}
