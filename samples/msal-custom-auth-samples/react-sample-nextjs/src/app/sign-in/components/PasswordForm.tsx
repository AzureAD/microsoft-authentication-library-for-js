import { PasswordFormProps } from "../types";
import { styles } from "../styles/styles";

export const PasswordForm = ({
    onSubmit,
    password,
    setPassword,
    loading,
}: PasswordFormProps) => (
    <form onSubmit={onSubmit} style={styles.form}>
        <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
        />
        <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Verifying..." : "Submit Password"}
        </button>
    </form>
);
