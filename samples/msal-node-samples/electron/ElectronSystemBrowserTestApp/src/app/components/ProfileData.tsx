import React from "react";
import { UserInfo } from "../../GraphReponseTypes";

type PageLayoutProps = {
    graphData: UserInfo;
};

export const ProfileData = (props: PageLayoutProps) => {
    const tableRows = Object.entries(props.graphData).map((entry, index) => {
        return (
            <tr key={index}>
                <td>
                    <b>{entry[0]}: </b>
                </td>
                <td>{entry[1]}</td>
            </tr>
        );
    });

    return (
        <>
            <div className="data-area-div">
                <p>
                    Calling <strong>Microsoft Graph API</strong>...
                </p>
                <ul>
                    <li>
                        <strong>resource:</strong> <mark>User</mark> object
                    </li>
                    <li>
                        <strong>endpoint:</strong>{" "}
                        <mark>https://graph.microsoft.com/v1.0/me</mark>
                    </li>
                    <li>
                        <strong>scope:</strong> <mark>user.read</mark>
                    </li>
                </ul>
                <p>
                    Contents of the <strong>response</strong> is below:
                </p>
            </div>
            <div className="data-area-div">
                <table>
                    <thead></thead>
                    <tbody>{tableRows}</tbody>
                </table>
            </div>
        </>
    );
};
