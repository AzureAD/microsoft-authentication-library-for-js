import React from 'react';
import './App.css';

import { 
    IPublicClientApplication, 
    IPublicClientApplicationPropType, 
    AuthenticatedComponent, 
    UnauthenticatedComponent,
    Consumer,
    useHandleRedirect
} from './msal-react';

type AppPropTypes = {
    msal: IPublicClientApplication
}

function App() {
    // const [ redirectResult ] = useHandleRedirect();
    // console.log('redirectResult', redirectResult);
  return (
    <div className="App">
        <Consumer>
            {msal => (
                <div>
                    <AuthenticatedComponent>
                        <div>
                            <p>Account:</p>
                            <pre>{JSON.stringify(msal?.getAccount(), null, 4)}</pre>
                            <button
                                onClick={e => {
                                    e.preventDefault();
                                    msal?.logout();
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    </AuthenticatedComponent>
                    <UnauthenticatedComponent>
                        <button
                            onClick={e => {
                                e.preventDefault();
                                msal?.loginPopup({});
                            }}
                        >
                            Login
                        </button>
                    </UnauthenticatedComponent>
                    {/*
                    {!msal?.getAccount() ? (
                        <button
                            onClick={e => {
                                e.preventDefault();
                                msal?.loginPopup({});
                            }}
                        >
                            Login
                        </button>
                    ) : (
                        <button
                            onClick={e => {
                                e.preventDefault();
                                msal?.logout();
                            }}
                        >
                            Logout
                        </button>
                    )}*/}
                </div>
            )}
        </Consumer>

        {/* <div>
            <p>Account:</p>
            <pre>{JSON.stringify(props.msal?.getAccount(), null, 4)}</pre>
            {!props.msal?.getAccount() ? (
                <button
                    onClick={e => {
                        e.preventDefault();
                        props.msal?.loginPopup({});
                    }}
                >
                    Login
                </button>
            ) : (
                <button
                    onClick={e => {
                        e.preventDefault();
                        props.msal?.logout();
                    }}
                >
                    Logout
                </button>
            )}
        </div> */}
    </div>
  );
}

/*
App.propTypes = {
    msal: IPublicClientApplicationPropType
}*/

export default App;
