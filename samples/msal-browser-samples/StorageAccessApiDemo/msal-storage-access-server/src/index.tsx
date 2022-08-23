import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {
    Switch,
    Route,
    BrowserRouter
} from "react-router-dom";
import { Silent } from './Silent';
import { Interactive } from "./Interactive";

ReactDOM.render(
  <React.StrictMode>
      <BrowserRouter>
        <Switch>
            <Route path="/silent">
                <Silent />
            </Route>
            <Route path="/interactive">
                <Interactive />
            </Route>
            <Route path="/" exact={true}>
                <App />
            </Route>
        </Switch>
      </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

