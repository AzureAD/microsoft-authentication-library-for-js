const { app } = require("@azure/functions");
const  axios = require('axios');

const tenantSubdomain = process.env.TENANT_SUBDOMAIN || '';

async function MyProxyFunction(request, context) {
    try {
        const hostName = `${tenantSubdomain}.ciamlogin.com`;
        const baseURL = `https://${hostName}/${tenantSubdomain}.onmicrosoft.com`;
        const incomingPath = request.params.path || '';

        const options = {
            url: `${baseURL}/${incomingPath}`,
            method: request.method,
            headers: {
                ...request.headers,
                host: hostName,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            maxRedirects: 0,
            decompress: false,
            responseType: 'text',
            validateStatus: function (status) {
                return 1; // No HTTP Code trigger error-handling, we want to proxy all through
            }
        };

        const requestData = await request.text();
        options.data = requestData;

        const response = await axios.request(options);
        const corsResponseHeaders = {}
        if (request.method === 'OPTIONS') {
            if (request.headers["access-control-request-headers"] && request.headers["access-control-request-headers"].length > 0) {
                corsResponseHeaders["Access-Control-Allow-Headers"] =  request.headers["access-control-request-headers"];
            }
        }
        return {
            status: response.status,
            body: response.data,
            headers: {
                ...response.headers,
                ...corsResponseHeaders
                   }
        };
    } catch (error) {
        return {
            status: 500,
            body: `Error: ${error.message || error}`
        };
    }
};

config = {
    methods: ['POST', 'OPTIONS'],
    route: "{*path}",
    authLevel: 'anonymous'
}

if (tenantSubdomain) {
    config.handler = MyProxyFunction
} else {
    config.handler = async (req, context) => {
        return {
            status: 400,
            body: "Tenant subdomain is not set"
        }
    }
}

app.http('httpProxyFunction', config);