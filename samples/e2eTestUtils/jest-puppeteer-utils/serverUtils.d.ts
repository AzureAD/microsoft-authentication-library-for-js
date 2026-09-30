import { ChildProcess } from "child_process";

interface JestOptions {
    projects?: string[];
    rootDir?: string;
}

declare function isServerUp(port: number, timeout: number): Promise<boolean>;

declare function startServer(
    cmd: string,
    directory: string,
    port?: number,
    env?: NodeJS.ProcessEnv
): ChildProcess;

declare function killServer(port: number): Promise<void>;

declare function killServers(jestOptions: JestOptions): Promise<void>;

export { isServerUp, startServer, killServer, killServers };
