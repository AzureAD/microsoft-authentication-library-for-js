import { PrimaryButton } from "@fluentui/react";
import React, { useEffect, useState } from "react";

const messageChannel = new MessageChannel();

export function Interactive() {
    const [ ready, setReady ] = useState<boolean>(false);

    useEffect(() => {
        messageChannel.port1.addEventListener("message", async (e) => {
            // When message received that top frame is ready,
            // check for existing storage access
            if (e.data === "ready") {
                // @ts-ignore
                document.hasStorageAccess()
                    .then((result: boolean) => {
                        if (result) {
                            // Send message to top frame that storage access is already granted
                            messageChannel.port1.postMessage({
                                hasStorageAccess: true
                            })
                            messageChannel.port1.close();
                        } else {
                            // Send message to top frame to make frame visible
                            messageChannel.port1.postMessage({
                                promptForStorageAccess: true
                            });
                            console.log("Sending message to top frame to make iframe visible")
                            setReady(true);
                        }
                    })
            }
        })

        messageChannel.port1.start();

        // Step 1: post top frame indicating page has loaded
        console.log("Step 1: Iframe loaded");
        window.top?.postMessage("ready", "*", [ messageChannel.port2 ]);
    }, []);
    return (
        <div className="interactive-page">
            <div className="wrapper">
                <div
                    style={{
                        boxShadow: "0 2px 6px rgb(0 0 0 / 20%)",
                        padding: "1rem",
                        textAlign: "left",
                        backgroundColor: "white"
                    }}
                >
                        <img 
                            alt="Microsoft"
                            src="https://aadcdn.msauth.net/shared/1.0/content/images/microsoft_logo_ee5c8d9fb6248c938fd0dc19370e90bd.svg"
                            style={{
                                height: "24px",
                                marginBottom: "1rem",
                                display: "block"
                            }}
                        />
                        <p>user@example.com</p>
                        <h2>Complete Sign In</h2>
                        <p>Your browser requires an additional step to complete sign-in. Please click continue to access App Name.</p>
                        <PrimaryButton
                            style={{
                                width: "250px"
                                
                            }}
                            onClick={async () => {
                                // Step 3: iframe posts storage acccess result
                                console.log("Step 3: Post storage access result to top frame");
                                
                                // @ts-ignore
                                document.requestStorageAccess()
                                    .then(() => {
                                        messageChannel.port1.postMessage({
                                            hasStorageAccess: true
                                        })
                                        messageChannel.port1.close();
                                    })
                                    .catch(() => {
                                        messageChannel.port1.postMessage({
                                            hasStorageAccess: false

                                        })
                                        messageChannel.port1.close();
                                    })
                            }}
                            disabled={!ready}
                        >
                            Continue
                        </PrimaryButton>

                </div>

            </div>

        </div>
    )
}
