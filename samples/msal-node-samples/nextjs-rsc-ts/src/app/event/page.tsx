import { InteractionRequiredAuthError } from "@azure/msal-node";
import { acquireCalendarTokenInteractive } from "~/actions/auth";
import { CalendarEvent, GraphCalendarEvent } from "~/components/CalendarEvent";
import { Button, Paper, Typography } from "~/components/mui";
import { graphConfig } from "~/serverConfig";
import { authProvider } from "~/services/auth";

async function getEvent() {
  const { account, instance } = await authProvider.authenticate();

  if (!account) {
    throw new Error("No Account logged in");
  }

  const token = await instance.acquireTokenSilent({
    account,
    scopes: ["Calendars.Read"],
  });

  if (!token) {
    throw new Error("Token null");
  }

  const response = await fetch(graphConfig.eventEndpoint, {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  const data: { value: GraphCalendarEvent[] } = await response.json();

  return data.value[0];
}

export default async function EventPage() {
  try {
    const event = await getEvent();

    return <CalendarEvent event={event} />;
  } catch (error: unknown) {
    if (error instanceof InteractionRequiredAuthError) {
      return (
        <Paper>
          <Typography>Please consent to see your calendar events.</Typography>
          <form action={acquireCalendarTokenInteractive}>
            <Button type="submit">Consent</Button>
          </form>
        </Paper>
      );
    }
  }
}
