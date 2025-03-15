import Link from "next/link";
import { useRouter } from "next/navigation";

interface SignUpResultProps {
    result: any;
}

export function SignUpResult({ result }: SignUpResultProps) {
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
            <h3>Sign Up Successful</h3>

            <div style={{ marginTop: "15px" }}>
                <div style={{ marginBottom: "10px" }}>
                    <strong>Name:</strong> {result.displayName}
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <strong>Email:</strong> {result.email}
                </div>
                <div style={{ marginBottom: "10px" }}>
                    <strong>Account Created:</strong> {new Date(result.timestamp).toLocaleString()}
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
                    onClick={() => router.push("/sign-up/complete")}
                >
                    View Complete Profile
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
