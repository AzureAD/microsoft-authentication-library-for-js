const http = require("http");
const https = require("https");
const url = require("url");
const argv = require("yargs")
    .usage(
        "Usage: $0 --tenantSubdomain [subdomain] --tenantId [id] --port [PORT]"
    )
    .alias("d", "tenantSubdomain")
    .alias("t", "tenantId")
    .alias("p", "port")
    .describe("tenantSubdomain", "Tenant subdomain")
    .describe("tenantId", "Tenant ID")
    .describe("port", "Port to run the proxy on")
    .default("port", 30001)
    .strict().argv;

const port = argv.port;
const apiPath = "/api";
const serviceUri = `https://${argv.tenantSubdomain}.ciamlogin.com/${argv.tenantId}`;

const extraHeaders = [
    "x-client-SKU",
    "x-client-VER",
    "x-client-OS",
    "x-client-CPU",
    "x-client-current-telemetry",
    "x-client-last-telemetry",
    "client-request-id",
];
http.createServer((req, res) => {
    const reqUrl = url.parse(req.url);
    const domain = url.parse(serviceUri).hostname;

    // Set CORS headers for all responses including OPTIONS
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
            "Content-Type, Authorization, " + extraHeaders.join(", "),
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400", // 24 hours
    };

    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
    }

    if (reqUrl.pathname.startsWith(apiPath)) {
        const targetUrl =
            serviceUri +
            reqUrl.pathname?.replace(apiPath, "") +
            (reqUrl.search || "");

        // console.log(
        //     "Incoming request -> " + req.url + " ===> " + reqUrl.pathname
        // );

        const newHeaders = {};
        for (let [key, value] of Object.entries(req.headers)) {
            if (key !='origin') {
                newHeaders[key] = value;
            }
        }

        const proxyReq = https.request(
            targetUrl, // CodeQL [SM04580] The newly generated target URL utilizes the configured proxy URL to resolve the CORS issue and will be used exclusively for demo purposes and run locally.
            {
                method: req.method,
                headers: {
                    ...newHeaders,
                    host: domain,
                },
            },
            (proxyRes) => {
                res.writeHead(proxyRes.statusCode, {
                    ...proxyRes.headers,
                    ...corsHeaders,
                });

                proxyRes.pipe(res);
            }
        );

        proxyReq.on("error", (err) => {
            console.error("Error with the proxy request:", err);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Proxy error.");
        });

        req.pipe(proxyReq);
    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
}).listen(port, () => {
    console.log("CORS proxy running on http://localhost:" + port);
    console.log("Proxying from " + apiPath + " ===> " + serviceUri);
});
