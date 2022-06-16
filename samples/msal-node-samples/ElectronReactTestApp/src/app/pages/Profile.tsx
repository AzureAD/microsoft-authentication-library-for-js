import React from 'react';
import { useEffect, useState } from 'react';
import { IpcMessages } from '../../Constants';
import { ProfileData } from '../components/ProfileData';
import { UserInfo } from '../../GraphReponseTypes';

declare const window: any;

export const Profile = () => {
    const [graphData, setGraphData] = useState(null);
    useEffect(() => {
        window.api.send(IpcMessages.GET_PROFILE);
        window.api.receive(IpcMessages.SET_PROFILE, (graphData: UserInfo) => {
            setGraphData(graphData);
        });

        return () => {
            window.api.removeAllListeners(IpcMessages.SET_PROFILE);
        };
    }, []);

    return <>{graphData ? <ProfileData graphData={graphData} /> : null}</>;
};
