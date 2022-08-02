#!/usr/bin/bash

libNames=("msal-core" "msal-common" "msal-browser" "msal-node" "msal-angular" "msal-react");

declare -A publishFlagNames;

publishFlagNames["msal-core"]=publishMsalCore;
publishFlagNames["msal-common"]=publishMsalCommon;
publishFlagNames["msal-browser"]=publishMsalBrowser;
publishFlagNames["msal-node"]=publishMsalNode;
publishFlagNames["msal-angular"]=publishMsalAngular;
publishFlagNames["msal-react"]=publishMsalReact;
publishFlagNames["msal-node-extensions"]=publishMsalNodeExtensions;

# Iterate each library directory name
for i in "${libNames[@]}"; do
    libPath="../lib/${i}/package.json"
    # Git diff --name-only prints the file name in the input path given that
    # that file has changed between the two commits referenced and
    # --exit-code sets the successful or failed result into $?
    # so if there are changes to a library's package.json, $? will have a 1 (success),
    # no changes means $? is 0, therefore library won't be release unless it's dependent
    # packages have been updated (dependent logic is out of scope for this script)
    git diff --exit-code --name-only HEAD HEAD~1 -- $libPath 

    if [ $? -eq 1 ]
    then
        echo "${i} publish flag set to TRUE";
        varName=${publishFlagNames[$i]};
        echo "##vso[task.setvariable variable=${varName};isoutput=true]true"
    else
     echo "${i} publish flag set to FALSE";
        varName=${publishFlagNames[$i]};
        echo "##vso[task.setvariable variable=${varName};isoutput=true]false"
    fi
done

# Same for extensions

libPath="../extensions/msal-node-extensions/package.json"
varName=publishMsalNodeExtensions;
git diff --exit-code --name-only HEAD HEAD~1 -- $libPath

if [ $? -eq 1 ]
then
    echo "msal-node-extensions publish flag set to TRUE";
    echo "##vso[task.setvariable variable=${varName};isoutput=true]true"
else
    echo "msal-node-extensions publish flag set to FALSE";
    echo "##vso[task.setvariable variable=${varName};isoutput=true]false"
fi

