
const express = require('express');
const msal = require('@azure/msal-node');
const validateAccessToken = require('./validator');

const app = express();

require('dotenv').config();

// Before running the sample, you will need to replace the values in the .env file, 
const config = {
    auth: {
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
    }
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);

app.get('/getGraphAccessToken', async (req, res) => {

    // Ensure that the token is valid
    if (validateAccessToken(req.query.ssoToken)) {

        const oboRequest = {
            oboAssertion: req.query.ssoToken,
            scopes: [process.env.GRAPH_SCOPES],
        }

        try {
            let response = await cca.acquireTokenOnBehalfOf(oboRequest);
            console.log(response);
            return res.send(response);   
        } catch (error) {
            console.log(error)
            return res.send(error);
        }
    } else {
        return res.send(error);
    }
});

const port = process.env.PORT || 5000;

app.listen(port);

console.log('API server is listening on port ' + port);
