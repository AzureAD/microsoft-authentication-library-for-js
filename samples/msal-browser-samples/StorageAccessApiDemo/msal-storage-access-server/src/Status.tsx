import { MessageBar, MessageBarType } from "@fluentui/react"
import React from "react"

export type StatusProps = {
    status: boolean | null
}

export function Status(props: StatusProps) {
    return (
        <div style={{ 
            padding: "1rem 0",
            maxWidth: "250px" 
        }}>
            {(
                props.status === null ? (
                    <MessageBar>Unknown</MessageBar>
                ) : (
                    <MessageBar
                        messageBarType={props.status ? MessageBarType.success : MessageBarType.blocked}
                    >{props.status ? "Granted" : "Blocked"}</MessageBar>
                )
            )}
        </div>
    )
}
