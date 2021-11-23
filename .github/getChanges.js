/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const libNameIndex = process.argv.indexOf("-lib", 1);
const libName=libNameIndex>=0?process.argv[libNameIndex+1]:null;
const { Octokit } = require("@octokit/rest");
const dotenv = require("dotenv");
const semver = require("semver");

dotenv.config();

const octokit = new Octokit({
    auth: process.env.GITHUB_AUTH
});

const { graphql } = require("@octokit/graphql");
const graphqlWithAuth = graphql.defaults({
    headers: {
        authorization: `token ${process.env.GITHUB_AUTH}`,
        'GraphQL-Features': 'discussions_api'
    },
});

const repoMeta = {
    owner: "AzureAD",
    repo: "microsoft-authentication-library-for-js"
};


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

    //console.log(release);
    console.log(release.name);
    console.log(release.body);
}


Promise.resolve(createReleaseForFolder(libName))
    .then(result => {
        process.exit(0);
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
