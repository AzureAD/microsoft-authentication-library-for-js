import styles from "./page.module.css";
import { authProvider } from "~/services/auth";
import Link from "next/link";
import { Button, ButtonGroup } from "~/components/mui";
import { login, logout } from "~/actions/auth";
import LogoutButton from "~/components/LogoutButton";

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
          <form action="/auth/login" method="POST">
            <Button variant="contained" color="primary" type="submit">
              Login using Route Handler
            </Button>
          </form>
          <form action={login}>
            <Button variant="contained" color="primary" type="submit">
              Login using Server Action (experimental)
            </Button>
          </form>
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
        <LogoutButton />
        <form action={logout}>
          <Button variant="contained" color="primary" type="submit">
            Logout using Server Action (experimental)
          </Button>
        </form>
      </ButtonGroup>
    </main>
  );
}
