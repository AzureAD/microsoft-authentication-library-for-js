import React from "react";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import PersonIcon from '@material-ui/icons/Person';
import ScheduleIcon from '@material-ui/icons/Schedule';
import MailIcon from '@material-ui/icons/Mail';
import LockOpenIcon from '@material-ui/icons/LockOpen';

export const ProtectedData = ({responseData}) => {
    return (
        <List className="protectedData">
            <NameListItem name={responseData.account.name} />
            <MailListItem mail={responseData.account.username} />
            <AccessTokenExpiresListItem expiresOn={responseData.expiresOn} />
            <ScopesListItem scopes={responseData.scopes} />
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

const AccessTokenExpiresListItem = ({expiresOn}) => (
    <ListItem>
        <ListItemAvatar>
            <Avatar>
                <ScheduleIcon />
            </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Access Token Expires At" secondary={expiresOn.toString()}/>
    </ListItem>
);

const MailListItem = ({mail}) => (
    <ListItem>
        <ListItemAvatar>
            <Avatar>
                <MailIcon />
            </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Username" secondary={mail}/>
    </ListItem>
);

const ScopesListItem = ({scopes}) => (
    <ListItem>
        <ListItemAvatar>
            <Avatar>
                <LockOpenIcon />
            </Avatar>
        </ListItemAvatar>
        <List>
            {scopes.map((scope, index) => (
                index === 0 ? <ListItemText primary="Scopes" secondary={scope} key={scope}/> : <ListItemText secondary={scope} />
            ))}
        </List>
    </ListItem>
);
