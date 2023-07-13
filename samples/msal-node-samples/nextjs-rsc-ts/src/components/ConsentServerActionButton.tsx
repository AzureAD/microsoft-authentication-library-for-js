import { acquireCalendarTokenInteractive } from "~/actions/auth";
import Button from "@mui/material/Button";

export default function ConsentServerActionButton() {
  return (
    <form action={acquireCalendarTokenInteractive}>
      <Button type="submit">Consent with Server Action (experimental)</Button>
    </form>
  );
}
