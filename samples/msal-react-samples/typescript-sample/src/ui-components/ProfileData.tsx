import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import Avatar from "@material-ui/core/Avatar";
import PersonIcon from '@material-ui/icons/Person';
import WorkIcon  from "@material-ui/icons/Work";
import MailIcon from '@material-ui/icons/Mail';
import PhoneIcon from '@material-ui/icons/Phone';
import LocationOnIcon from '@material-ui/icons/LocationOn';

export type GraphData = {
    displayName: string,
    jobTitle: string,
    mail: string,
    businessPhones: string[],
    officeLocation: string
};

export const ProfileData: React.FC<{graphData: GraphData}> = ({graphData}) => {
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

const NameListItem: React.FC<{name: string}> = ({name}) => (
    <ListItem>
        <ListItemAvatar>
            <Avatar>
                <PersonIcon />
            </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Name" secondary={name}/>
    </ListItem>
);

const JobTitleListItem: React.FC<{jobTitle: string}> = ({jobTitle}) => (
    <ListItem>
        <ListItemAvatar>
            <Avatar>
                <WorkIcon />
            </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Title" secondary={jobTitle}/>
    </ListItem>
);

const MailListItem: React.FC<{mail: string}> = ({mail}) => (
    <ListItem>
        <ListItemAvatar>
            <Avatar>
                <MailIcon />
            </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Mail" secondary={mail}/>
    </ListItem>
);

const PhoneListItem: React.FC<{phone: string}> = ({phone}) => (
    <ListItem>
        <ListItemAvatar>
            <Avatar>
                <PhoneIcon />
            </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Phone" secondary={phone}/>
    </ListItem>
);

const LocationListItem: React.FC<{location: string}> = ({location}) => (
    <ListItem>
        <ListItemAvatar>
            <Avatar>
                <LocationOnIcon />
            </Avatar>
        </ListItemAvatar>
        <ListItemText primary="Location" secondary={location}/>
    </ListItem>
);