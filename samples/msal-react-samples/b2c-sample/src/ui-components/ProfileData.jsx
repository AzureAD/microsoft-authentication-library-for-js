import React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import PersonIcon from '@mui/icons-material/Person';

export const ProfileData = ({apiData}) => {
    return (
        <List className="profileData">
            <NameListItem name={apiData.name} />
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
