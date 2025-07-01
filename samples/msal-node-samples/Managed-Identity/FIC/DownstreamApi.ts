import https from "https";

export const getSecretFromKeyVault = async (
    accessToken: string,
    keyVaultUri: string,
    secretName: string
): Promise<string> => {
    const options = {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    };

    return new Promise<string>((resolve, reject) => {
        https
            .get(
                `${keyVaultUri}secrets/${secretName}?api-version=7.2`,
                options,
                (response) => {
                    const data: Buffer[] = [];
                    response.on("data", (chunk) => {
                        data.push(chunk);
                    });

                    response.on("end", () => {
                        // combine all received buffer streams into one buffer, convert it to a string,
                        // then parse it as a JSON object
                        let parsedData;
                        try {
                            parsedData = JSON.parse(
                                Buffer.concat([...data]).toString()
                            );
                        } catch (error) {
                            return reject(
                                new Error(
                                    "Unable to parse response from the Key Vault"
                                )
                            );
                        }

                        if (parsedData.error) {
                            return reject(
                                new Error(`${parsedData.error.message}`)
                            );
                        }

                        return resolve(parsedData.value);
                    });
                }
            )
            .on("error", (error) => {
                return reject(new Error(`${error.message}`));
            });
    });
};
