import React from 'react';
import { NavigationBar } from './NavigationBar';
import { IpcMessages } from '../../Constants';
import { useEffect, useState } from 'react';

const { ipcRenderer } = window.require('electron');

function PageLayout(props: any) {
    return (
        <>
            <NavigationBar account={props.account} />
            <br />
            <h5 className="text-center">Microsoft Authentication Library For React - Tutorial</h5>
            <br />
            {props.children}
            <br />
        </>
    );
}

export default PageLayout;
