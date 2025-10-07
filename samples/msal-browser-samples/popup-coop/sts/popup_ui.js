function postOnBroadcastChannel() {
    console.log("STS Popup: Popup loaded, sending message to iframe");
    const popup_channel = new BroadcastChannel('sts-channel');

    // Broadcast a dummy message after 1 second
    setTimeout(() => {
        popup_channel.postMessage({ text: 'Hello from STS popup!' });
    }, 2000);
    console.log("STS Popup: window.opener", window.opener);
    // channel.close(); // Close the channel after receiving the message
}