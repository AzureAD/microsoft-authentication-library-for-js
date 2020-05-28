import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { Provider as MsalProvider } from './msal-react';

import { Configuration } from "@azure/msal-browser";

const configuration: Configuration = {
    auth: {
        clientId: "3fba556e-5d4a-48e3-8e1a-fd57c12cb82e",
        authority: "https://login.windows-ppe.net/common/",
        navigateToLoginRequestUrl: false
    }
}

// TODO: guidance / mitigations for double renders in React.StrictMode
ReactDOM.render(
  <>
      <MsalProvider configuration={configuration}>
        <App />
      </MsalProvider>
  </>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
