import { Authority } from "./Authority";
export declare class AuthorityFactory {
    private static DetectAuthorityFromUrl(authorityUrl);
    static CreateInstance(authorityUrl: string, validateAuthority: boolean): Authority;
}
