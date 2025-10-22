window.name = "STS Window";
const channel = new BroadcastChannel('sts-channel');

let stsPopupWindow = null;

function openPopupLmso() {
    console.log("STS: Opening Popup");
    stsPopupWindow = window.open("https://localhost:30663/popup", "STS Popup", "noopener");
    monitorPopup();
}

function monitorPopup() {
    console.log("STS: inside monitorPopup");

    try {
        const intervalId = setInterval(() => {
            console.log("STS: popup window object", stsPopupWindow);
            if (stsPopupWindow && stsPopupWindow.closed) {
                console.log("STS: Popup closed by user");
                clearInterval(intervalId);
                throw (new Error("STS: user_cancelled"));
                // Optionally, you can perform additional actions here when the popup is closed
            }
        }, 1000);

        channel.onmessage = (event) => {
            console.log("STS: Received message from popup via broadcastchannel:", event.data);
            if (event.data) {
                document.getElementById("openPopupText").innerText = "Received message from popup via broadcastchannel: " + event.data.text;
                postMessageToJSApp(event.data);
                clearInterval(intervalId);
                stsPopupWindow.close();
                return;
            }
        };
        window.onmessage = (event) => {
            console.log("STS: Received message from popup via window.postMessage:", event.data);
            if (event.data) {
                document.getElementById("openPopupText").innerText = "Received message from popup via window.postMessage: " + event.data.text;
                postMessageToJSApp(event.data);
                clearInterval(intervalId);
                stsPopupWindow.close();
                return;
            }
        }
    } catch (e) {
        console.error("STS: Error monitoring popup:", e);
    }
}


function postMessageToJSApp(data) {
    // Send message to parent window (app)
    if (window.parent) {
        window.parent.postMessage(data, "https://localhost:30662/");
    }
}

function performAuthentication() {
    console.log("STS: Performing authentication (simulated)");
    console.log("STS: window.opener", window.opener);
    // Simulate authentication delay
    setTimeout(() => {
        console.log("STS: Authentication successful, returning tokens to JS App");
        const simulated_auth_code = "simulated_auth_code_12345";
        navigatetoJSApp(simulated_auth_code);
    }, 1000);
}

function navigatetoJSApp(simulated_auth_code) {
    // Simulate sending tokens back to the JS App
    window.location.replace("https://localhost:30662/?code=" + simulated_auth_code);
}