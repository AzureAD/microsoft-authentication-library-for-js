/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const { Octokit } = require("@octokit/rest");
const dotenv = require("dotenv");

dotenv.config();

const octokit = new Octokit({
    auth: process.env.GITHUB_AUTH
});

const repoMeta = {
    owner: "AzureAD",
    repo: "microsoft-authentication-library-for-js"
};

const libFolders = [
    "msal-angular",
    "msal-browser",
    "msal-common",
    "msal-core",
    "msal-node",
    "msal-react",
];

const CHANGELOGFILE = "CHANGELOG.json";

function buildNotesForComments(commits, label) {
    return [
        `### ${label}`,
        "",
        ...commits.map(commit => `- ${commit.comment} (${commit.author})`),
        ""
    ];
}

async function createReleaseForFolder(folderName) {
    const {
        name,
        entries: [
            {
                date,
                tag,
                version,
                comments: {
                    major,
                    minor,
                    patch,
                    none,
                    prerelease
                }
            }
        ]
    } = require(`../lib/${folderName}/${CHANGELOGFILE}`);

    const shortName = name.split("@azure/").pop();
    const tag_name = `${shortName}-v${version}`;

    let body = [
        `## ${version}`,
        "",
        date,
        ""
    ];

    if (major) {
        body = body.concat(buildNotesForComments(major, "Major changes"));
    }

    if (minor) {
        body = body.concat(buildNotesForComments(minor, "Minor changes"));
    }

    if (patch) {
        body = body.concat(buildNotesForComments(patch, "Patches"));
    }

    if (prerelease) {
        body = body.concat(buildNotesForComments(prerelease, "Changes"));
    }

    const release = {
        ...repoMeta,
        tag_name,
        name: `${name} v${version}`,
        prerelease: !!prerelease,
        body: body.join("\n")
    };

    // Gets latest releases and checks if there is a matching releases for the given library version
    // TODO: improve check to handle release not being on the first page
    const allReleases = await octokit.repos.listReleases(repoMeta);
    const releaseForTag = allReleases.data.find(existingRelease => existingRelease.name === release.name);

    if (!releaseForTag) {
        console.log(`Release started: ${tag_name}`);
        const newRelease = await octokit.repos.createRelease(release);
        console.log(`Release created: ${tag_name}`);
    } else {
        console.log(`Release exists for: ${tag_name}`);
    }
}

Promise.all(libFolders.map(createReleaseForFolder))
    .then(result => {
        process.exit(0);
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
