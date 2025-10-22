function postOnBroadcastChannel() {
    console.log("sts_popup: Popup loaded, sending message to iframe");
    //const popup_channel = new BroadcastChannel('sts-channel');
    //popup_channel.postMessage({ text: 'Hello from STS popup!' });
    // Broadcast a dummy message after 1 second
    // setTimeout(() => {
    //     popup_channel.postMessage({ text: 'Hello from STS popup!' });
    // }, 2000);
    console.log("sts_popup: window.opener", window.opener);
    window.opener.postMessage({ text: 'Hello from STS popup!' }, "https://localhost:30663/");
    // channel.close(); // Close the channel after receiving the message
}