window.name = "STS Window";
const channel = new BroadcastChannel('sts-channel');

let stsPopupWindow = null;

function openPopupLmso(){
    console.log("STS: Opening Popup in 2 seconds");
    setTimeout(function() {
        stsPopupWindow = window.open("http://localhost:30663/popup", "STS Popup", "width=600,height=600");
    }, 2000);
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
                throw(new Error("STS: user_cancelled"));
                // Optionally, you can perform additional actions here when the popup is closed
            }
        },1000);

        channel.onmessage = (event) => {
            console.log("STS: Received message from popup:", event.data);
            if (event.data) {
                document.getElementById("openPopupText").innerText = "Received message from popup: " + event.data.text;
                postMessageToJSApp(event.data);
                clearInterval(intervalId);
                stsPopupWindow.close();
                return;
            }
        };
    } catch(e) {
        console.error("STS: Error monitoring popup:", e);
    } 
}


function postMessageToJSApp(data) {
    // Send message to parent window (app)
    if (window.parent) {
        window.parent.postMessage(data, "http://localhost:30662/");
    }
}