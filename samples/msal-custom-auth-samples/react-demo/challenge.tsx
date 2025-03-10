// Challenge component for verification code
const SignInChallenge = () => {
    const [code, setCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const { submitCode, status, errorCode, errorMessage } = useCustomAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await submitCode(code);

            if (result === "SignIn.Completed") {
                navigate("/success");
            }
            // If not successful, the form will show again with the error message
        } catch (error) {
            console.error("Code submission error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="challenge-container">
            <h2>Verification Required</h2>

            <p>Please enter the verification code sent to your device.</p>

            {errorMessage && (
                <div className="error-message">{errorMessage}</div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="code">Verification Code</label>
                    <input
                        type="text"
                        id="code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Verifying..." : "Submit Code"}
                </button>
            </form>
        </div>
    );
};
