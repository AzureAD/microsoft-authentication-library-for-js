import React from 'react';
import { Navbar, Button } from 'react-bootstrap';
import { IpcMessages } from '../../Constants';
import { Link } from 'react-router-dom';
import '../styles/Nav.css';
import { AccountInfo } from '@azure/msal-common';

type NavigationBarProps = {
    account: AccountInfo;
};

declare const window: any;

export const NavigationBar = (props: NavigationBarProps) => {
    const login = () => {
        window.api.send(IpcMessages.LOGIN);
    };

    const logout = () => {
        window.api.send(IpcMessages.LOGOUT);
    };
    return (
        <>
            <Navbar bg="primary" variant="dark">
                <Link className="navbar-brand" to="/">
                    Microsoft identity platform
                </Link>
                {props.account ? (
                    <>
                        <Link className="nav-link test-link" to="/profile">
                            Profile
                        </Link>
                        <Button variant="warning" className="ml-auto" as="button" onClick={logout}>
                            {' '}
                            Sign out{' '}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="secondary" className="ml-auto" as="button" onClick={login}>
                            Sign in
                        </Button>
                    </>
                )}
            </Navbar>
        </>
    );
};
