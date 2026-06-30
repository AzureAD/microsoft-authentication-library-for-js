window.name = "STS Window";
const channel = new BroadcastChannel('sts-channel');

function performAuthentication() {

    console.log("STS: Performing authentication (simulated)");
    console.log("STS: Adding 2 second delay...");

    // Since the STS response is mocked, the popup opens and closes before the e2e tests can capture a screenshot. Add a 2 second delay to capture popup screenshot before the popup closes itself.
    setTimeout(() => {
        continueAuthentication();
    }, 2000);
}

function continueAuthentication() {
    console.log("STS: window.opener", window.opener);
    console.log("STS: window.location.search", window.location.search);

    // Parse the original authorization request parameters
    const urlParams = new URLSearchParams(window.location.search);
    const redirectUri = urlParams.get('redirect_uri');

    console.log("STS: redirect_uri from params:", redirectUri);
    console.log("STS: All URL params:", Array.from(urlParams.entries()));

    const finalRedirectUri = redirectUri || "https://localhost:30662/redirect";
    console.log("STS: Final redirect URI:", finalRedirectUri);

    // Extract nonce for inclusion in auth code
    const nonce = urlParams.get('nonce');

    // Generate a base64-encoded auth code that looks realistic and includes nonce
    const authCodePayload = {
        tenant: "c7cef333-42af-492c-afb0-21f74a661133",
        user: "test@example.com",
        timestamp: Date.now(),
        nonce: nonce  // Store nonce in auth code so token endpoint can use it
    };
    const simulated_auth_code = btoa(JSON.stringify(authCodePayload));

    console.log("STS: Authentication successful, returning auth code:", simulated_auth_code);
    navigatetoJSApp(simulated_auth_code, finalRedirectUri, urlParams);
}

// Make function globally accessible
window.performAuthentication = performAuthentication;

function navigatetoJSApp(simulated_auth_code, redirectUri, urlParams) {
    // Build redirect URL
    let redirectUrl = redirectUri;
    redirectUrl += (redirectUrl.includes('?') ? '&' : '?') + 'code=' + encodeURIComponent(simulated_auth_code);

    for (const param of ["state", "popup", "nonce"]) {
        const paramValue = urlParams.get(param);
        if (paramValue) {
            redirectUrl += `&${param}=` + encodeURIComponent(paramValue);
        }
    }

    // Add client_info if requested
    const clientInfo = urlParams.get('client_info');
    if (clientInfo === '1') {
        // Generate a base64-encoded client info
        const clientInfoPayload = { uid: "test-uid", utid: "c7cef333-42af-492c-afb0-21f74a661133" };
        redirectUrl += '&client_info=' + encodeURIComponent(btoa(JSON.stringify(clientInfoPayload)));
    }

    console.log("STS: Redirecting to:", redirectUrl);

    // Redirect back to the app
    window.location.replace(redirectUrl);
}
