/*
 * Central configuration for the Nested Auth App sample.
 *
 * The dev-server launcher (`server.js`), the two Vite configs, and the e2e Jest
 * setup/teardown + spec all need to agree on the ports the host and nested apps
 * are served on. Define them here once and import everywhere else so a port
 * change only has to be made in a single place. The browser-side code receives
 * these transitively: `server.js` injects the nested port/protocol into the
 * host app via `VITE_NESTED_APP_*` env vars.
 *
 * Authored as CommonJS (.cjs) so it can be consumed from every context in the
 * sample: the CommonJS launcher/Jest files (`require`), the ESM Vite configs
 * (default `import`), and the ts-jest spec (`require`).
 */

// Host (top frame) app: enables the platform broker and hosts the NAA bridge.
const HOST_APP_PORT = 30663;
// Nested (child) app: embedded by the host in an iframe.
const NESTED_APP_PORT = 30667;

module.exports = {
    HOST_APP_PORT,
    NESTED_APP_PORT,
};
