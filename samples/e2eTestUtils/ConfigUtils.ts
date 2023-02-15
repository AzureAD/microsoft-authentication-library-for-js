import * as fs from 'fs/promises';

export class StringReplacer {
    private filePath: string;
    private mappings: Record<string, string>;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.mappings = {};
    }

    async replace(map: Record<string, string>): Promise<void> {
        this.mappings = map;

        try {
            const content = await fs.readFile(this.filePath, "utf-8");
            let updatedContent = content;

            for (const [key, value] of Object.entries(map)) {
                const regex = new RegExp(key, "g");
                updatedContent = updatedContent.replace(regex, value);
            }

            await fs.writeFile(this.filePath, updatedContent, "utf-8");
        } catch (err) {
            console.error(`Error replacing file: ${err}`);
        }
    }

    async restore(): Promise<void> {
        if (Object.keys(this.mappings).length === 0) {
            console.log("No replacements to restore from");
            return;
        }

        try {
            const content = await fs.readFile(this.filePath, "utf-8");

            let updatedContent = content;

            for (const [key, value] of Object.entries(this.mappings)) {
                const regex = new RegExp(value, "g");
                updatedContent = updatedContent.replace(regex, key);
            }

            await fs.writeFile(this.filePath, updatedContent, "utf-8");
        } catch (err) {
            console.error(`Error restoring file: ${err}`);
        }
    }
}
