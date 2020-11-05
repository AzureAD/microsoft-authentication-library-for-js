import express from "express";
import { PublicClientApplication } from '../client/PublicClientApplication';
import { Configuration } from '../config/Configuration';
import { BaseAuthRequest, AccountInfo, ICachePlugin } from "@azure/msal-common";
import { TokenCache } from "../cache/TokenCache";


declare type BrokeredTokenRequest  = {
    type: string,
    request: BaseAuthRequest,
    clientId: string
};

export class BrokerManager {
    private brokeringEnabled: Boolean = false;
    private expressApp: any;

    constructor(){}

    public async enableBrokering(cachePlugin: ICachePlugin): Promise<void> {
        this.expressApp = express();
        return new Promise(async (resolve) => {
           this.expressApp.all('/', function(req: any, res: any, next: any) {
                console.log(req.body);
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "X-Requested-With");
                next();
           });

           this.expressApp.use(express.json());

            this.expressApp.get("/auth/handshake", (req: any, res: any) => {
                console.log('/handshake', req.body);
                res.sendStatus(200);
            });

            this.expressApp.post("/auth/get-token", async (req: any, res: any) => {
                console.log(req.body);
                const brokeredTokenRequest: BrokeredTokenRequest = req.body;

                const publicClientApplicationConfiguration: Configuration = {
                    auth: {
                        clientId: brokeredTokenRequest.clientId
                    },
                    cache: {
                        cachePlugin: cachePlugin
                    }
                };
                const publicClientApplication: PublicClientApplication = new PublicClientApplication(publicClientApplicationConfiguration);
                const result = await publicClientApplication.acquireTokenSilent(req.request);
                // res.header("Access-Control-Allow-Origin", "*");
                res.send(result).status(200);
            });

            this.expressApp.post("/auth/get-accounts", async (req: any, res: any) => {
                console.log(req.body);
                const brokeredTokenRequest: BrokeredTokenRequest = req.body;

                const publicClientApplicationConfiguration: Configuration = {
                    auth: {
                        clientId: brokeredTokenRequest.clientId
                    },
                    cache: {
                        cachePlugin: cachePlugin
                    }
                };
                const publicClientApplication: PublicClientApplication = new PublicClientApplication(publicClientApplicationConfiguration);
                const tokenCache: TokenCache = publicClientApplication.getTokenCache();
                // tokenCache.getAllAccounts();
                // const cacheString: string = await tokenCache.serialize();
                // const cacheObject = JSON.parse(cacheString);

                // console.log(cacheObject)

                // // TODO, make this filter accounts
                // const accounts: Array<AccountInfo> = Object.keys(cacheObject["Account"])
                //     .map((key: string) => ({
                //         homeAccountId: cacheObject["Account"][key].home_account_id,
                //         environment: cacheObject["Account"][key].environment,
                //         tenantId: cacheObject["Account"][key].home_account_id.split(".")[1],
                //         username: cacheObject["Account"][key].username,
                //         name: cacheObject["Account"][key].name

                const accounts: Array<AccountInfo> = await tokenCache.getAllAccounts();
                //     }));

                res.send(accounts).status(200);
            });

            this.expressApp.listen(45678, () => {
                console.log("listening on port 45676");
                this.brokeringEnabled = true
                resolve();

            });
        });
    }

    public brokeringIsEnabled(): Boolean {
        return this.brokeringEnabled;
    }
}