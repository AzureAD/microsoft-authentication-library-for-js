namespace MSAL {
    export interface IUri {
        Protocol: string;
        HostNameAndPort: string;
        AbsolutePath: string;
        Search: string;
        Hash: string;
    }
}