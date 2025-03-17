import { styles } from "../styles/styles";

interface CodeFormProps {
    onSubmit: (e: React.FormEvent) => Promise<void>;
    code: string;
    setCode: (value: string) => void;
    loading: boolean;
}

export function CodeForm({ onSubmit, code, setCode, loading }: CodeFormProps) {
    return (
        <form onSubmit={onSubmit} style={styles.form}>
            <input
                type="text"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={styles.input}
                required
            />
            <button type="submit" style={styles.button} disabled={loading}>
                {loading ? "Verifying..." : "Verify Code"}
            </button>
        </form>
    );
}
