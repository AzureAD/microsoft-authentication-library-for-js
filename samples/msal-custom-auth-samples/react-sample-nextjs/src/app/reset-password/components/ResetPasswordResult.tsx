import { useRouter } from "next/navigation";

interface ResetPasswordResultProps {
    result: any;
}

export function ResetPasswordResult({ result }: ResetPasswordResultProps) {
    const router = useRouter();

    return (
        <div
            style={{
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                marginTop: "20px",
            }}
        >
            <h3>Password Reset Successful</h3>

            <div style={{ marginTop: "15px" }}>
                <div style={{ marginBottom: "10px" }}>
                    Your password has been successfully reset. You can now sign in with your new password.
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <strong>Email:</strong> {result.email}
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <strong>Reset Completed:</strong> {new Date(result.timestamp).toLocaleString()}
                </div>
            </div>

            <div style={{ marginTop: "20px" }}>
                <button
                    style={{
                        padding: "10px",
                        backgroundColor: "#0078d4",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "16px",
                    }}
                    onClick={() => router.push("/sign-in")}
                >
                    Go to Sign In
                </button>
            </div>

            <details style={{ marginTop: "20px" }}>
                <summary style={{ cursor: "pointer", color: "#666" }}>Technical Details</summary>
                <pre
                    style={{
                        background: "#f5f5f5",
                        padding: "15px",
                        borderRadius: "4px",
                        overflowX: "auto",
                        marginTop: "10px",
                    }}
                >
                    {JSON.stringify(result, null, 2)}
                </pre>
            </details>
        </div>
    );
}
