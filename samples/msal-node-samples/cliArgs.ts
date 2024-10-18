import yargs from "yargs";

interface Arguments {
    c: string;
    p: number;
    r: string | undefined;
    s: string;
    $0: string;
}

const argv: Arguments = yargs(process.argv.slice(2))
    .usage("Usage: $0 -p [PORT]")
    .options({
        c: {
            type: "string",
            alias: "cache location",
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
    })
    .parseSync();

export default argv;
