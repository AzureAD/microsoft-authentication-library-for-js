/**
 * Proxy configuration for local development
 * entryPath: The path to the API on the react app ex. /api
 * proxy: The URL to proxy the requests
 */
const tenantSubdomain = "ciamtestlocal";
const tenantId = "cd97f2df-f1e9-4ee6-8dc0-d036accad626";

const config = {
    localApiPath: "/api",
    port: 30001,
    proxy: `https://${tenantSubdomain}.ciamlogin.com/${tenantId}`,
};
module.exports = config;