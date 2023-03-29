const mock = jest.requireActual("@azure/msal-node-runtime");
mock.msalNodeRuntime = {
    ...mock.msalNodeRuntime,
    StartupError: undefined
}

module.exports = mock;