namespace MSAL {

    export class User {
        private _displayableId: string;
        set displayableId(displayableId: string) {
            this._displayableId = displayableId;
        }

        get displayableId(): string {
            return this._displayableId;
        }

        private _name: string;
        get name(): string {
            return this._name;
        }

        private _identityProvider: string;
        get identityProvider(): string {
            return this._identityProvider;
        }

        private _uid: string;
        get uid(): string {
            return this._uid;
        }

        set uid(uid: string) {
            this._uid = uid;
        }

        private _utid: string;
        get utid(): string {
            return this._utid;
        }

        set utid(utid: string) {
            this._utid = utid;
        }

        private _userIdentifier: string;
        get userIdentifier(): string {
            return this._userIdentifier;
        }

        set userIdentifier(userIdentifier: string) {
            this._userIdentifier = userIdentifier;
        }

        constructor(displayableId: string, name: string, identityProvider: string, uid: string, utid: string) {
            this._displayableId = displayableId;
            this._name = name;
            this._identityProvider = identityProvider;
            this._uid = uid;
            this._utid = utid;
            this.userIdentifier = Utils.base64EncodeStringUrlSafe(uid) + '.'+ Utils.base64EncodeStringUrlSafe(utid);

        }

        static createUser(idToken: IdToken, clientInfo: ClientInfo, authority:string): User {
            let uid: string;
            let utid: string;
            if (!clientInfo) {
                uid = '';
                utid = '';
            }
            else {
                uid = clientInfo.uid;
                utid = clientInfo.utid;
            }
            authority = authority.replace('common', idToken.tenant).replace('organizations', idToken.tenant);
            return new User(idToken.preferredName, idToken.name, authority, uid, utid);
        }

    }
}
