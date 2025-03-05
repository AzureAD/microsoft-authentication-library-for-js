import { CodeFormProps } from "../types";
import { styles } from "../styles/styles";

export const CodeForm = ({
    onSubmit,
    code,
    setCode,
    loading,
}: CodeFormProps) => (
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
