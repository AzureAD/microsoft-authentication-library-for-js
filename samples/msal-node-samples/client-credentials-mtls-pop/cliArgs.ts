import yargs, { ArgumentsCamelCase } from "yargs";

interface CliArgs extends ArgumentsCamelCase {
    c?: string;
    p?: number;
    r?: string;
    s?: string;
    ro?: string;
}

const argv = yargs(process.argv.slice(2))
    .usage("Usage: $0 -r [REGION]")
    .options({
        c: {
            type: "string",
            alias: "cache-location",
            default: "data/cache.json",
            description:
                "(Optional) Cache location - default is data/cache.json",
        },
        p: {
            type: "number",
            alias: "port",
            default: 3000,
            description: "(Optional) Port Number - default is 3000",
        },
        r: {
            type: "string",
            alias: "region",
            default: undefined,
            description: "(Optional) Region - default is undefined",
        },
        s: {
            type: "string",
            alias: "scenario",
            default: "AAD",
            description: "(Optional) Scenario name - default is AAD",
        },
        ro: {
            type: "string",
            alias: "runtime-options",
            default: null,
            description:
                "(Optional) Runtime options to inject into the application - default is null",
        },
    })
    .parseSync() as CliArgs;

export default argv;
