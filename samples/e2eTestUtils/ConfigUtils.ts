import fs from 'fs';

export class StringReplacer {
    private filePath: string;
    private mappings: Record<string, string>;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.mappings = {};
    }

    /**
     * Updates the file by replacing all instances of keys with values in the map
     * @param map: key-value pairs of strings to replace
     */
    async replace(map: Record<string, string>) {
        this.mappings = map;

        try {
            let content = fs.readFileSync(this.filePath, { encoding: "utf8" });

            for (const [key, value] of Object.entries(map)) {
                const regex = new RegExp(key, "g");
                content = content.replace(regex, value);
            }

            fs.writeFileSync(this.filePath, content);
        } catch (err) {
            console.error(`Error replacing file: ${err}`);
        }
    }

    /**
     * Restores the file to its original state
     */
    async restore() {
        if (Object.keys(this.mappings).length === 0) {
            console.log("No mappings to restore from");
            return;
        }

        try {
            let content = fs.readFileSync(this.filePath, { encoding: "utf8" });

            for (const [key, value] of Object.entries(this.mappings)) {
                const regex = new RegExp(value, "g");
                content = content.replace(regex, key);
            }

            fs.writeFileSync(this.filePath, content);
        } catch (err) {
            console.error(`Error restoring file: ${err}`);
        }
    }
}
