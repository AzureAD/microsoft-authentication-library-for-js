import { InitialFormProps } from "../types";
import { styles } from "../styles/styles";

export const InitialForm = ({
    onSubmit,
    username,
    setUsername,
    password,
    setPassword,
    loading,
}: InitialFormProps) => (
    <form onSubmit={onSubmit} style={styles.form}>
        <input
            type="email"
            placeholder="Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
        />
        <input
            type="password"
            placeholder="Password (optional)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
        </button>
    </form>
);
