import * as github from "@actions/github";
import * as core from "@actions/core";
import { IssueBotConfig } from "../../types/IssueBotConfig";
import { IssueBotUtils } from "../IssueBotUtils";
import { ConfigParams, Constants } from "../Constants";
import * as yaml from "js-yaml";

export class RepoFiles {
    private issueBotUtils: IssueBotUtils;

    constructor(issueBotUtils: IssueBotUtils) {
        this.issueBotUtils = issueBotUtils;
    }

    /**
     * Get the contents of a file in the repo
     * @param filepath 
     */
    async getFileContents(filepath: string) {
        const request = this.issueBotUtils.addRepoParams({
            path: filepath,
            ref: github.context.sha
        });

        const response: any = await this.issueBotUtils.octokit.repos.getContent(request);

        return Buffer.from(response.data.content, response.data.encoding).toString();
    }

    /**
     * Get the bot configuration
     */
    async getConfig(): Promise<IssueBotConfig|null> {
        const configPath = core.getInput(ConfigParams.PATH);
        const fileContents = await this.getFileContents(configPath);

        try {
            return JSON.parse(fileContents) as IssueBotConfig;
        } catch (e) {
            return null;
        }
    };

    /**
     * Get all the issue templates from the repo. Return a map where the key is the template filename and the value is the contents of the template md file.
     */
    async getIssueTemplates(): Promise<Map<string, string>> {
        
        const request = this.issueBotUtils.addRepoParams({
            path: Constants.TEMPLATE_DIRECTORY,
            ref: github.context.sha
        });

        const response: any = await this.issueBotUtils.octokit.repos.getContent(request);

        const filenames: Array<string> = [];
        const templates: Map<string, string> = new Map();

        response.data.forEach((file: any) => {
            if (file.type === "file" && file.name.endsWith(".yml")) {
                filenames.push(file.name);
            }
        });

        const promises = filenames.map(async (filename) => {
            const fileContents = await this.getFileContents(`${Constants.TEMPLATE_DIRECTORY}/${filename}`);
            console.log(yaml.load(fileContents));
            templates.set(filename, fileContents);
        });

        await Promise.all(promises);
        return templates;
    }
}