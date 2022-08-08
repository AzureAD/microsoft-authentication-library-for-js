import React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

export const TokenClaims = ({tokenClaims}) => {
    return (
        <List id="idTokenClaims">
            {Object.entries(tokenClaims).map(claim => {
                return (
                    <ListItem key={`claim-${claim[0]}`}>
                        <ListItemText primary={claim[0]} secondary={claim[1]}/>
                    </ListItem>
                );
            })}
        </List>
    );
};