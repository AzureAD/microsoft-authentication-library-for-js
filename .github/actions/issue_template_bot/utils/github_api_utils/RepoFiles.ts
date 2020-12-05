import * as github from "@actions/github";
import * as core from "@actions/core";
import { IssueBotConfig } from "../../types/IssueBotConfig";
import { IssueBotUtils } from "../IssueBotUtils";
import { ConfigParams, Constants } from "../Constants";

export class RepoFiles {
    private issueBotUtils: IssueBotUtils;

    constructor(issueBotUtils: IssueBotUtils) {
        this.issueBotUtils = issueBotUtils;
    }

    async getFileContents(filepath: string) {
        const request = this.issueBotUtils.addRepoParams({
            path: filepath,
            ref: github.context.sha
        });

        const response: any = await this.issueBotUtils.octokit.repos.getContent(request);

        return Buffer.from(response.data.content, response.data.encoding).toString();
    }

    async getConfig(): Promise<IssueBotConfig|null> {
        const configPath = core.getInput(ConfigParams.PATH);
        const fileContents = await this.getFileContents(configPath);

        try {
            return JSON.parse(fileContents) as IssueBotConfig;
        } catch (e) {
            return null;
        }
    };

    async getIssueTemplates(): Promise<Map<string, string>> {
        
        const request = this.issueBotUtils.addRepoParams({
            path: Constants.TEMPLATE_DIRECTORY,
            ref: github.context.sha
        });

        const response: any = await this.issueBotUtils.octokit.repos.getContent(request);

        const filenames: Array<string> = [];
        const templates: Map<string, string> = new Map();

        response.data.forEach((file: any) => {
            if (file.type === "file" && file.name.endsWith(".md")) {
                filenames.push(file.name);
            }
        });

        const promises = filenames.map(async (filename) => {
            const fileContents = await this.getFileContents(`${Constants.TEMPLATE_DIRECTORY}/${filename}`);
            templates.set(filename, fileContents);
        });

        await Promise.all(promises);
        return templates;
    }
}