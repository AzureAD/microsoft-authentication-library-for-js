"use client";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import EventNote from "@mui/icons-material/EventNote";
import Schedule from "@mui/icons-material/Schedule";
import Paper from "@mui/material/Paper";

export type GraphCalendarEvent = {
  subject: string;
  start: {
    dateTime: string;
    timezone: string;
  };
};

export const CalendarEvent = ({ event }: { event: GraphCalendarEvent }) => {
  if (!event) {
    return (<div>Could not found any events</div>);
  }
  return (
    <Paper>
      <List>
        <EventTitleListItem title={event.subject} />
        <StartTimeListItem startTime={event.start.dateTime} />
      </List>
    </Paper>
  );
};

const EventTitleListItem = ({ title }: { title: string }) => (
  <ListItem>
    <ListItemAvatar>
      <Avatar>
        <EventNote />
      </Avatar>
    </ListItemAvatar>
    <ListItemText primary="Title" secondary={title} />
  </ListItem>
);

const StartTimeListItem = ({ startTime }: { startTime: string }) => (
  <ListItem>
    <ListItemAvatar>
      <Avatar>
        <Schedule />
      </Avatar>
    </ListItemAvatar>
    <ListItemText primary="Start Time" secondary={startTime} />
  </ListItem>
);
