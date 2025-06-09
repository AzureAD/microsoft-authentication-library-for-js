/**
 * Proxy configuration for local development
 * entryPath: The path to the API on the react app ex. /api
 * proxy: The URL to proxy the requests
 */
const tenantSubdomain = "MSIDLABCIAM6";
const tenantId = "fe362aec-5d43-45d1-b730-9755e60dc3b9";

const config = {
    localApiPath: "/api",
    port: 3001,
    proxy: `https://${tenantSubdomain}.ciamlogin.com/${tenantId}`,
};
module.exports = config;
