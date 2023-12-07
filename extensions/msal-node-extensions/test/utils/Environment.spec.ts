import { Environment } from "../../src/utils/Environment";

describe("Environment", () => {
    test("Environment.isWindowsPlatform() should be called by Environment.getUserRootDirectory()", () => {
        const spy = jest.spyOn(Environment, "isWindowsPlatform");
        Environment.getUserRootDirectory();
        expect(spy).toHaveBeenCalled();
    });
});
