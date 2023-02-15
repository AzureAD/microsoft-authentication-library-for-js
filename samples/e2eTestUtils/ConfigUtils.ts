import fs from 'fs';

export class StringReplacer {
    private filePath: string;
    private mappings: Record<string, string>;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.mappings = {};
    }

    async replace(map: Record<string, string>): Promise<void> {
        this.mappings = map;

        return new Promise((resolve, reject) => {
            fs.readFile(this.filePath, "utf-8", (err, data) => {
                if (err) {
                    console.error(`Error reading file: ${err}`);
                    reject(err);
                }

                let updatedContent = data;

                for (const [key, value] of Object.entries(map)) {
                    const regex = new RegExp(key, "g");
                    updatedContent = updatedContent.replace(regex, value);
                }

                fs.writeFile(this.filePath, updatedContent, (err) => {
                    if (err) {
                        console.error(`Error writing file: ${err}`);
                        reject(err);
                    }

                    resolve();
                });
            });
        });
    }

    async restore(): Promise<void> {
        if (Object.keys(this.mappings).length === 0) {
            console.log("No mappings to restore from");
            return;
        }

        return new Promise((resolve, reject) => {
            fs.readFile(this.filePath, "utf-8", (err, data) => {
                if (err) {
                    console.error(`Error reading file: ${err}`);
                    reject(err);
                }

                let updatedContent = data;

                for (const [key, value] of Object.entries(this.mappings)) {
                    const regex = new RegExp(value, "g");
                    updatedContent = updatedContent.replace(regex, key);
                }

                fs.writeFile(this.filePath, updatedContent, (err) => {
                    if (err) {
                        console.error(`Error writing file: ${err}`);
                        reject(err);
                    }
                    resolve();
                });
            });
        });
    }
}
