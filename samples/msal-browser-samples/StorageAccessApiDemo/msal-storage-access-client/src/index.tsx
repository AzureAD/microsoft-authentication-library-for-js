import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {
    Switch,
    Route,
    BrowserRouter
} from "react-router-dom";
import { Demo } from "./Demo";
import { PublicClientApplication, LogLevel } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";

const instance = new PublicClientApplication({
    auth: {
        clientId: "245e9392-c666-4d51-8f8a-bfd9e55b2456",
        redirectUri: "/demo"
    },
    system: {
        loggerOptions: {
            // logLevel: LogLevel.Verbose,
            piiLoggingEnabled: true,
            loggerCallback: (level, message) => {
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        break;

                    case LogLevel.Warning:
                        console.warn(message);
                        break;
                
                    default:
                        console.log(message);
                        break;
                }
            }
        }
    }
})

ReactDOM.render(
  <React.StrictMode>
      <MsalProvider instance={instance}>
        <BrowserRouter>
            <Switch>
                <Route path="/demo">
                    <Demo />
                </Route>
                <Route path="/" exact={true}>
                    <App />
                </Route>
            </Switch>
        </BrowserRouter>
      </MsalProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
