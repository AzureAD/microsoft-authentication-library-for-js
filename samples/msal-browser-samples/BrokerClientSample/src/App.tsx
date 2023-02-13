import MsIdentityContext from "./components/MsIdentityContext";
import { ApiInvoke } from "./components/ApiInvoke";
import { msIdentity } from "./services/msIdentity";

export default function App() {
    return (
        <MsIdentityContext.Provider value={msIdentity}>
            <ApiInvoke identity={msIdentity}/>
        </MsIdentityContext.Provider>
    );
}