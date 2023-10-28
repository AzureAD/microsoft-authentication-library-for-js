"use client"; // Error components must be Client Components

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ConsentButton from "~/components/ConsentButton";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  if (error.message === "InteractionRequiredAuthError") {
    return (
      <Paper>
        <Typography>Please consent to see your calendar events.</Typography>
        <ConsentButton />
      </Paper>
    );
  }

  return (
    <Paper>
      <Typography>An error occured while getting events.</Typography>
      <Typography>{error.message}</Typography>
    </Paper>
  );
}
