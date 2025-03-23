import { styles } from "../styles/styles";

interface PasswordFormProps {
    onSubmit: (e: React.FormEvent) => Promise<void>;
    password: string;
    setPassword: (value: string) => void;
    loading: boolean;
}

export const PasswordForm = ({ onSubmit, password, setPassword, loading }: PasswordFormProps) => (
    <form onSubmit={onSubmit} style={styles.form}>
        <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
        />
        <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
        </button>
    </form>
);
