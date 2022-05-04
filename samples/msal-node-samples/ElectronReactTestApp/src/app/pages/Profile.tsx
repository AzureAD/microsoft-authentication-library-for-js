import React from 'react';
import { useEffect, useState } from 'react';
import { IpcMessages } from '../../Constants';
import { ProfileData } from '../components/ProfileData';

const { ipcRenderer } = window.require('electron');

export const Profile = () => {
    const [graphData, setGraphData] = useState(null);
    useEffect(() => {
        ipcRenderer.send(IpcMessages.GET_PROFILE);
        ipcRenderer.on(IpcMessages.SET_PROFILE, (event, graphResponse) => {
            setGraphData(graphResponse);
        });

        return () => {
            ipcRenderer.removeAllListeners(IpcMessages.SET_PROFILE);
        };
    }, []);

    return <>{graphData ? <ProfileData graphData={graphData} /> : null}</>;
};
