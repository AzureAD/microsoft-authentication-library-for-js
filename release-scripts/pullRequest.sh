#!/usr/bin/bash

title=$1
branch=$2

curl \
  -X POST \
  -H "Accept: application/vnd.github+json" \ 
  -H "Authorization: token $GITHUBTOKEN" \
  https://api.github.com/repos/AzureAD/microsoft-authentication-library-for-js/pulls \
  -d '{"title":"$title","body":"This PR contains package lock updates & cdn README updates for msal-browser and msal-core.","head":"$branch","base":"dev", "label": "testRelease", "draft": "false"}'