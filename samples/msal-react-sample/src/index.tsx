import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from "react-router-dom";

import { MsalProvider } from './msal-react';
import { configuration } from './config';
import App from './App';

import './index.css';

// TODO: guidance / mitigations for double renders in React.StrictMode
ReactDOM.render(
  <Router>
      <MsalProvider configuration={configuration}>
        <App />
      </MsalProvider>
  </Router>,
  document.getElementById('root')
);
