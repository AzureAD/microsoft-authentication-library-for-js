const http = require("http");
const https = require("https");
const url = require("url");
const proxyConfig = require("./proxy.config");

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
    const domain = url.parse(proxyConfig.proxy).hostname;

    // Set CORS headers for all responses including OPTIONS
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, " + extraHeaders.join(", "),
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400", // 24 hours
    };

    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
        res.writeHead(204, corsHeaders);
        res.end();
        return;
    }

    if (reqUrl.pathname.startsWith(proxyConfig.localApiPath)) {
        const targetUrl = proxyConfig.proxy + reqUrl.pathname?.replace(proxyConfig.localApiPath, "") + (reqUrl.search || "");

        console.log("Incoming request -> " + req.url + " ===> " + reqUrl.pathname);

        const proxyReq = https.request(
            targetUrl,
            {
                method: req.method,
                headers: {
                    ...req.headers,
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
}).listen(proxyConfig.port, () => {
    console.log("CORS proxy running on http://localhost:3001");
    console.log("Proxying from " + proxyConfig.localApiPath + " ===> " + proxyConfig.proxy);
});
