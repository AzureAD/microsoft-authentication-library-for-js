import { MsidUser } from "./MsidUser";
import { MsidApp } from "./MsidApp";
import { MsidLab } from "./MsidLab";

export type LabConfig = {
    user: MsidUser,
    app: MsidApp,
    lab: MsidLab
};
