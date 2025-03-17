import { styles } from "../styles/styles";

interface NewPasswordFormProps {
    onSubmit: (e: React.FormEvent) => Promise<void>;
    newPassword: string;
    setNewPassword: (value: string) => void;
    loading: boolean;
}

export function NewPasswordForm({ onSubmit, newPassword, setNewPassword, loading }: NewPasswordFormProps) {
    return (
        <form onSubmit={onSubmit} style={styles.form}>
            <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={styles.input}
                required
                minLength={8}
                pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                title="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            />
            <button type="submit" style={styles.button} disabled={loading}>
                {loading ? "Setting password..." : "Set New Password"}
            </button>
        </form>
    );
}
