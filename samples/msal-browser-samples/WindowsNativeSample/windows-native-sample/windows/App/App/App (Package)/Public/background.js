function RespondWithError(response, sendResponse) {
    if (IsInvalidMethod(response)) {
        // for Invalid Method we want produce the same response regardless it came from extension or native code, it should be hidden from caller.
        sendResponse(CreateInvalidMethodResponse());
    }
    else {
        sendResponse(response);
    }
}

function IsInvalidMethod(response) {
    return response.ext && response.ext.error == -2147186943;
}

function CreateInvalidMethodResponse() {
    return {
        status: "Fail",
        code: "OSError",
        description: "Error processing request.",
        ext: { error: -2147186943 }
    };
}
