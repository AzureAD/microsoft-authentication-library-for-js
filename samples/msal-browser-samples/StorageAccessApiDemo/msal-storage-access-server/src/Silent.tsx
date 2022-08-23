import React, { useEffect } from "react";

export function Silent() {
    useEffect(() => {
        const messageChannel = new MessageChannel();

        messageChannel.port1.addEventListener("message", (e) => {
            // Step 3: iframe posts storage acccess result
            if (e.data === "ready") {
                console.log("Step 3: Post storage access result to top frame");
                // @ts-ignore
                document.hasStorageAccess()
                    .then((result: boolean) => {
                        // Write test cookie
                        const cookieValue = "test-cookie-silent=test-value-silent";
                        const testCookie = `${cookieValue}; SameSite=None; Secure`;
                        document.cookie = testCookie;
                        const canWriteCookies = document.cookie.includes(cookieValue);

                        // Send result back to top frame
                        messageChannel.port1.postMessage({
                            hasStorageAccess: result,
                            canWriteCookies
                        });
                        messageChannel.port1.close();
                    })
                    .catch((error: Error) => {
                        messageChannel.port1.postMessage({
                            error
                        });
                        messageChannel.port1.close();
                    });
            }
        });
        messageChannel.port1.start();

        // Step 1: post top frame indicating page has loaded
        console.log("Step 1: Iframe loaded");
        window.top?.postMessage("ready", "*", [ messageChannel.port2 ]);
    }, [])
    return (
        <div>Hello, world!</div>
    )
}
