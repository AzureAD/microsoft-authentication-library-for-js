interface SignUpResultProps {
    result: any;
}

export function SignUpResult({ result }: SignUpResultProps) {
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
            <pre
                style={{
                    background: "#f5f5f5",
                    padding: "15px",
                    borderRadius: "4px",
                    overflowX: "auto",
                }}
            >
                {JSON.stringify(result, null, 2)}
            </pre>
        </div>
    );
}
