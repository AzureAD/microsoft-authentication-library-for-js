import React from "react";
import { graphConfig } from "./authConfig";

export async function callMsGraph(accessToken: string) {
    const headers = new Headers();
    const bearer = `Bearer ${accessToken}`;

    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers: headers
    };

    return fetch(graphConfig.graphMeEndpoint, options)
        .then(response => response.json())
        .catch(error => console.log(error));
}

export const ProfileData = (props: any) => {
    return (
        <div id="profile-div">
            <p><strong>Title: </strong> {props.graphData.jobTitle}</p>
            <p><strong>Mail: </strong> {props.graphData.mail}</p>
            <p><strong>Phone: </strong> {props.graphData.businessPhones[0]}</p>
            <p><strong>Location: </strong> {props.graphData.officeLocation}</p>
        </div>
    );
};
