import { InteractionRequiredAuthError } from "@azure/msal-node";
import { CalendarEvent, GraphCalendarEvent } from "~/components/CalendarEvent";
import { graphConfig } from "~/serverConfig";
import { authProvider } from "~/services/auth";

async function getEvent() {
  const { account, instance } = await authProvider.authenticate();

  if (!account) {
    throw new Error("No Account logged in");
  }

  try {
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
  } catch (error: unknown) {
    // rethrow with a message that can be serialized and read by a client component
    // https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-server-errors
    if (error instanceof InteractionRequiredAuthError) {
      throw new Error("InteractionRequiredAuthError");
    }
    throw error;
  }
}

export default async function EventPage() {
  const event = await getEvent();

  return <CalendarEvent event={event} />;
}
