window.bridgePocConfig = {
    appName: window.webPocConfig.child.name,
    clientId: window.webPocConfig.child.clientId,
    authority: window.webPocConfig.child.authority,
    scopes: window.webPocConfig.child.scopes,
};
window.NestedAppAuthBridge.installNestedAppAuthBridge({
    transport: window.webPocTransport,
    replaceExisting: true,
});