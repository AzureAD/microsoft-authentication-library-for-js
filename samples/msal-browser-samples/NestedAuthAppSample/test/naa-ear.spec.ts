import { runBasicNaaSuite } from "./naaWebFlowTestUtils";

runBasicNaaSuite(
    "Nested App Authentication + EAR brokered through the host app",
    true,
    process.env.NAA_EAR_E2E === "true"
);
