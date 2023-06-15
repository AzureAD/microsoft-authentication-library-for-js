import type { AccountEntity } from "@azure/msal-common";
import type { IPartitionManager } from "@azure/msal-node";
import type { Session } from "@remix-run/node";

export class SessionPartitionManager implements IPartitionManager {
  session: Session;

  constructor(session: Session) {
    this.session = session;
  }

  async getKey() {
    const homeAccountId = this.session.get("homeAccountId") || "";

    return homeAccountId;
  }

  async extractKey(accountEntity: AccountEntity) {
    if (!accountEntity.homeAccountId) {
      throw new Error("No homeAccountId found in accountEntity");
    }

    return accountEntity.homeAccountId;
  }
}
