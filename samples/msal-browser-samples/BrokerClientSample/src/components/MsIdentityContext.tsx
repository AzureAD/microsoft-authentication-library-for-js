import React from "react";
import { MsIdentity, msIdentity } from "../services/msIdentity";

const MsIdentityContext: React.Context<MsIdentity> = React.createContext(msIdentity);

export default MsIdentityContext;