import https from "https";

export const getSecretFromKeyVault = (
    accessToken: string,
    keyVaultUri: string,
    secretName: string
): Promise<string> => {
    const customOptions: https.RequestOptions = {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    };

    return new Promise<string>((resolve, reject) => {
        https
            .get(
                `${keyVaultUri}secrets/${secretName}?api-version=7.2`,
                customOptions,
                (response) => {
                    const data: Buffer[] = [];
                    response.on("data", (chunk) => {
                        data.push(chunk);
                    });

                    response.on("end", () => {
                        // combine all received buffer streams into one buffer, and then into a string
                        const parsedData = Buffer.concat([...data]).toString();
                        resolve(JSON.parse(parsedData).value);
                    });
                }
            )
            .on("error", (error) => {
                reject(new Error(`Error: ${error.message}`));
            });
    });
};
