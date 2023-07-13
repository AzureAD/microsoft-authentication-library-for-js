import styles from "./page.module.css";
import { authProvider } from "~/services/auth";
import Link from "next/link";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import LoginRouteHandlerButton from "~/components/LoginRouteHandlerButton";
import LoginServerActionButton from "~/components/LoginServerActionButton";
import LogoutRouteHandlerButton from "~/components/LogoutRouteHandlerButton";
import LogoutServerActionButton from "~/components/LogoutServerActionButton";

export default async function Home() {
  const account = await authProvider.getAccount();

  if (!account) {
    return (
      <main className={styles.main}>
        <ButtonGroup orientation="vertical">
          <Button
            component={Link}
            href="/forced"
            variant="contained"
            color="primary"
          >
            Go to forced login page
          </Button>
          <LoginRouteHandlerButton />
          <LoginServerActionButton />
        </ButtonGroup>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <ButtonGroup orientation="vertical">
        <Button
          component={Link}
          href="/profile"
          variant="contained"
          color="primary"
        >
          Request Profile Information
        </Button>
        <Button
          component={Link}
          href="/event"
          variant="contained"
          color="primary"
        >
          Consent extra permissions and fetch event
        </Button>
        <LogoutRouteHandlerButton />
        <LogoutServerActionButton />
      </ButtonGroup>
    </main>
  );
}
