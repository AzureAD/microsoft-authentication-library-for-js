import { styles } from "../styles/styles";

interface InitialFormProps {
    onSubmit: (e: React.FormEvent) => Promise<void>;
    email: string;
    setEmail: (value: string) => void;
    loading: boolean;
}

export function InitialForm({ onSubmit, email, setEmail, loading }: InitialFormProps) {
    return (
        <form onSubmit={onSubmit} style={styles.form}>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
            />
            <button type="submit" style={styles.button} disabled={loading}>
                {loading ? "Sending..." : "Reset Password"}
            </button>
        </form>
    );
}
