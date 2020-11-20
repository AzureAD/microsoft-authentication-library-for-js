import React from "react";
import { List, ListItem, ListItemText, ListItemAvatar, Avatar } from "@material-ui/core";
import PersonIcon from '@material-ui/icons/Person';
import WorkIcon  from "@material-ui/icons/Work";
import MailIcon from '@material-ui/icons/Mail';
import PhoneIcon from '@material-ui/icons/Phone';
import LocationOnIcon from '@material-ui/icons/LocationOn';

export const ProfileData = ({graphData}) => {
    return (
        <List className="profileData">
            <NameListItem name={graphData.displayName} />
            <JobTitleListItem jobTitle={graphData.jobTitle} />
            <MailListItem mail={graphData.mail} />
            <PhoneListItem phone={graphData.businessPhones[0]} />
            <LocationListItem location={graphData.officeLocation} />
        </List>
    );
};

const NameListItem = ({name}) => (
    <ListItem>
        <ListItemAvatar>
            <Avatar>
                <PersonIcon />
            </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Name" secondary={name}/>
    </ListItem>
);

const JobTitleListItem = ({jobTitle}) => (
    <ListItem>
        <ListItemAvatar>
            <Avatar>
                <WorkIcon />
            </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Title" secondary={jobTitle}/>
    </ListItem>
);

const MailListItem = ({mail}) => (
    <ListItem>
        <ListItemAvatar>
            <Avatar>
                <MailIcon />
            </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Mail" secondary={mail}/>
    </ListItem>
);

const PhoneListItem = ({phone}) => (
    <ListItem>
        <ListItemAvatar>
            <Avatar>
                <PhoneIcon />
            </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Phone" secondary={phone}/>
    </ListItem>
);

const LocationListItem = ({location}) => (
    <ListItem>
        <ListItemAvatar>
            <Avatar>
                <LocationOnIcon />
            </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Location" secondary={location}/>
    </ListItem>
);
