import { styles } from "../styles/styles";

interface InitialFormProps {
    onSubmit: (e: React.FormEvent) => Promise<void>;
    username: string;
    setUsername: (value: string) => void;
    loading: boolean;
}

export const InitialForm = ({ onSubmit, username, setUsername, loading }: InitialFormProps) => (
    <form onSubmit={onSubmit} style={styles.form}>
        <input
            type="email"
            placeholder="Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
        />
        <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Signing in..." : "Continue"}
        </button>
    </form>
);
