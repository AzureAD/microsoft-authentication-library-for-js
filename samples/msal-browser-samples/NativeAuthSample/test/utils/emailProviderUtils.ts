/**
 * Email provider utility functions for mail.tm
 */
const BASE = "https://api.mail.tm";

/**
 * MailTmClient class to interact with mail.tm API
 */
export class MailTmClient {
    address: string | null = null;
    password: string | null = null;
    token: string | null = null;
    domain: string | null = null;
    lastCheckedTime: Date | null = null;

    constructor(password?: string) {
        if (password) {
            this.password = password;
        } else {
            this.password = null;
        }
    }

    /**
     * Fetch available domain from Mail.tm API
     */
    async fetchDomain(): Promise<string> {
        try {
            const response = await fetch(`${BASE}/domains`, {
                headers: { "Content-Type": "application/json" }
            });

            if (response.ok) {
                const data = await response.json();
                if (data["hydra:member"] && data["hydra:member"].length > 0) {
                    const domain = data["hydra:member"][0]["domain"];
                    this.domain = domain;
                    console.log(`Fetched domain: ${domain}`);
                    return domain;
                } else {
                    throw new Error("No domains available in response");
                }
            } else {
                throw new Error(`Error fetching domains: ${response.status} - ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error during domain fetch:", error);
            throw new Error(`Failed to fetch domain: ${error}`);
        }
    }

    /**
     * Create a new Mail.tm account with retry logic
     */
    async createInbox(address?: string, password?: string, maxRetries = 5, delaySeconds = 5): Promise<{ address: string; password: string }> {
        const usePassword = password || this.password;
        if (!usePassword) {
            throw new Error("No password found in configuration.");
        }

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                let useAddress = address;
                if (!useAddress) {
                    // Fetch domain if not already available
                    if (!this.domain) {
                        await this.fetchDomain();
                    }

                    const currentTime = Date.now();
                    useAddress = `test${currentTime}@${this.domain}`;
                }

                this.address = useAddress;
                this.password = usePassword;

                const res = await fetch(`${BASE}/accounts`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        address: this.address,
                        password: this.password
                    })
                });

                if (res.status === 201) {
                    console.log(`Account successfully created! Email: ${this.address}`);
                    return { address: this.address, password: this.password };
                } else {
                    const errorText = await res.text();
                    throw new Error(`Failed to create account: ${res.status} - ${errorText}`);
                }
            } catch (error) {
                // If this is the last attempt, throw the error
                if (attempt === maxRetries) {
                    throw new Error(`Failed to create mail.tm inbox after ${maxRetries} attempts: ${error}`);
                }

                await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
            }
        }

        throw new Error(`Failed to create mail.tm inbox after ${maxRetries} attempts`);
    }

    /**
     * Login to Mail.tm and get authentication token
     * @param address Email address to login with
     * @param password Password (optional if provided in constructor)
     */
    async login(address: string, password?: string): Promise<string> {
        const usePassword = password || this.password;
        if (!usePassword) {
            throw new Error("No password provided in constructor or login call");
        }

        try {
            const res = await fetch(`${BASE}/token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address: address,
                    password: usePassword
                })
            });

            if (res.ok) {
                const json = await res.json();
                const token = json.token;
                this.token = token;
                this.address = address;
                this.password = usePassword;
                console.log("Authentication token received.");
                return token;
            } else {
                const errorText = await res.text();
                throw new Error(`Failed to get token: ${res.status} - ${errorText}`);
            }
        } catch (error) {
            console.error("Error during login:", error);
            throw new Error(`Failed to login to mail.tm: ${error}`);
        }
    }

    /**
     * Mark a checkpoint to filter out old messages
     * Call this before triggering an OTP send for existing accounts
     */
    markCheckpoint(): void {
        this.lastCheckedTime = new Date();
        console.log(
            `Checkpoint marked at: ${this.lastCheckedTime.toISOString()}`
        );
    }

    /**
     * Get message source and extract OTP code
     */
    private async getMessageSource(messageId: string): Promise<string | null> {
        if (!this.token) {
            throw new Error("Authentication token required");
        }

        try {
            const sourceUrl = `${BASE}/sources/${messageId}`;
            const response = await fetch(sourceUrl, {
                headers: {
                    "Authorization": `Bearer ${this.token}`,
                    "Content-Type": "application/json"
                }
            });

            if (response.ok) {
                const data = await response.json();

                if (data.data) {
                    const messageData = data.data;

                    // Use regex to find the verification code (e.g., "Account verification code: 17354003")
                    const match = messageData.match(/Account verification code:\s*(\d+)/);
                    if (match) {
                        const otpCode = match[1];
                        return otpCode;
                    } else {
                        console.log("OTP code not found in message data.");
                        return null;
                    }
                } else {
                    console.log("'data' field not found in message source response.");
                    return null;
                }
            } else {
                const errorText = await response.text();
                console.error(`Failed to fetch message source. Status: ${response.status}, Response: ${errorText}`);
                return null;
            }
        } catch (error) {
            console.error("Error while fetching message source:", error);
            return null;
        }
    }

    /**
     * Read messages and extract OTP code with progressive delay strategy
     */
    async readOtpCode(maxRetries = 5): Promise<string> {
        if (!this.token) {
            throw new Error("Call login() before reading messages");
        }

        // Progressive delay strategy: 10s, 20s, 30s, 40s, 50s
        const progressiveDelays = [10, 20, 30, 40, 50];

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const res = await fetch(`${BASE}/messages?page=1`, {
                    headers: {
                        "Authorization": `Bearer ${this.token}`,
                        "Content-Type": "application/json"
                    }
                });

                if (res.ok) {
                    const json = await res.json();
                    const msgs = json["hydra:member"];

                    if (msgs && msgs.length > 0) {
                        // Filter messages based on checkpoint if set
                        for (const email of msgs) {
                            const messageTime = new Date(email.updatedAt);

                            // Skip messages older than checkpoint
                            if (
                                this.lastCheckedTime &&
                                messageTime <= this.lastCheckedTime
                            ) {
                                continue;
                            }

                            // Get OTP code from message source
                            const otpCode = await this.getMessageSource(
                                email.id
                            );
                            if (otpCode) {
                                // Clear checkpoint after successful OTP retrieval
                                this.lastCheckedTime = null;
                                return otpCode;
                            }
                        }
                    }
                }

                // If not the last attempt, wait before retrying with progressive delay
                if (attempt < maxRetries) {
                    const delayTime = progressiveDelays[Math.min(attempt - 1, progressiveDelays.length - 1)];
                    await new Promise((resolve) => setTimeout(resolve, delayTime * 1000));
                }
            } catch (error) {
                console.error(`Error on attempt ${attempt}:`, error);

                // If not the last attempt, wait before retrying with progressive delay
                if (attempt < maxRetries) {
                    const delayTime = progressiveDelays[Math.min(attempt - 1, progressiveDelays.length - 1)];
                    await new Promise((resolve) => setTimeout(resolve, delayTime * 1000));
                }
            }
        }

        throw new Error(`Failed to find OTP code after ${maxRetries} attempts`);
    }

    /**
     * Factory method to create and authenticate a new email account
     * @param password Password for the email account
     * @returns Object with authenticated client and email address
     */
    static async createAuthenticatedAccount(password: string): Promise<{
        client: MailTmClient;
        address: string;
    }> {
        const client = new MailTmClient(password);
        const { address } = await client.createInbox();
        await client.login(address); // Uses stored password
        return { client, address };
    }

    /**
     * Factory method for existing email accounts  
     * @param address Existing email address
     * @param password Password for the account
     * @returns Authenticated client
     */
    static async connectToExistingAccount(address: string, password: string): Promise<MailTmClient> {
        const client = new MailTmClient(password);
        await client.login(address); // Uses stored password
        return client;
    }
}
