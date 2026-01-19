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
     */
    async login(address: string, password: string): Promise<string> {
        try {
            const res = await fetch(`${BASE}/token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address: address,
                    password: password
                })
            });

            if (res.ok) {
                const json = await res.json();
                const token = json.token;
                this.token = token;
                this.address = address;
                this.password = password;
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
     * Read messages and extract OTP code
     */
    async readOtpCode(maxRetries = 5, delaySeconds = 10): Promise<string> {
        if (!this.token) {
            throw new Error("Call login() before reading messages");
        }

        console.log("Checking email for messages (this may take a moment)...");

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
                            } else {
                                console.log(
                                    `No OTP code found in message ${email.id} on attempt ${attempt}`
                                );
                            }
                        }
                    } else {
                        console.log(`No messages found on attempt ${attempt}`);
                    }
                } else {
                    console.error(`Failed to fetch emails on attempt ${attempt}. Status: ${res.status}`);
                }

                // If not the last attempt, wait before retrying
                if (attempt < maxRetries) {
                    await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
                }
            } catch (error) {
                // If not the last attempt, wait before retrying
                if (attempt < maxRetries) {
                    await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));
                }
            }
        }

        throw new Error(`Failed to find OTP code after ${maxRetries} attempts`);
    }
}
