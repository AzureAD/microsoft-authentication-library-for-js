const mock = jest.requireActual("@azure/msal-node-runtime");

const asyncHandle = {
    CancelAsyncOperation: () => {}
}
mock.msalNodeRuntime = {
    ReadAccountByIdAsync: (accountId, correlationId, callback) => asyncHandle,
    SignInAsync: (windowHandle, authParams, correlationId, accountHint, callback) => asyncHandle,
    SignInSilentlyAsync: (authParams, correlationId, callback) => asyncHandle,
    SignInInteractivelyAsync: (windowHandle, authParams, correlationId, accountHint, callback) => asyncHandle,
    AcquireTokenSilentlyAsync: (authParams, correlationId, account, callback) => asyncHandle,
    AcquireTokenInteractivelyAsync: (windowHandle, authParams, correlationId, account, callback) => asyncHandle,
    SignOutSilentlyAsync: (clientId, correlationId, account, callback) => asyncHandle,
    RegisterLogger: (callback, isPiiEnabled) => {},
    DiscoverAccountsAsync: (clientId, correlationId, callback) => asyncHandle,
    StartupError: undefined
}

module.exports = mock;