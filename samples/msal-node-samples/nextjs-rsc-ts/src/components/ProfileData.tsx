"use client";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import PersonIcon from "@mui/icons-material/Person";
import WorkIcon from "@mui/icons-material/Work";
import MailIcon from "@mui/icons-material/Mail";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import Paper from "@mui/material/Paper";

export type GraphProfile = {
  displayName: string;
  jobTitle: string;
  mail: string;
  businessPhones: string[];
  officeLocation: string;
};

export const ProfileData = ({ graphData }: { graphData: GraphProfile }) => {
  return (
    <Paper>
      <List className="profileData">
        <NameListItem name={graphData.displayName} />
        <JobTitleListItem jobTitle={graphData.jobTitle} />
        <MailListItem mail={graphData.mail} />
        <PhoneListItem phone={graphData.businessPhones[0]} />
        <LocationListItem location={graphData.officeLocation} />
      </List>
    </Paper>
  );
};

const NameListItem = ({ name }: { name: string }) => (
  <ListItem>
    <ListItemAvatar>
      <Avatar>
        <PersonIcon />
      </Avatar>
    </ListItemAvatar>
    <ListItemText primary="Name" secondary={name} />
  </ListItem>
);

const JobTitleListItem = ({ jobTitle }: { jobTitle: string }) => (
  <ListItem>
    <ListItemAvatar>
      <Avatar>
        <WorkIcon />
      </Avatar>
    </ListItemAvatar>
    <ListItemText primary="Title" secondary={jobTitle} />
  </ListItem>
);

const MailListItem = ({ mail }: { mail: string }) => (
  <ListItem>
    <ListItemAvatar>
      <Avatar>
        <MailIcon />
      </Avatar>
    </ListItemAvatar>
    <ListItemText primary="Mail" secondary={mail} />
  </ListItem>
);

const PhoneListItem = ({ phone }: { phone: string }) => (
  <ListItem>
    <ListItemAvatar>
      <Avatar>
        <PhoneIcon />
      </Avatar>
    </ListItemAvatar>
    <ListItemText primary="Phone" secondary={phone} />
  </ListItem>
);

const LocationListItem = ({ location }: { location: string }) => (
  <ListItem>
    <ListItemAvatar>
      <Avatar>
        <LocationOnIcon />
      </Avatar>
    </ListItemAvatar>
    <ListItemText primary="Location" secondary={location} />
  </ListItem>
);
