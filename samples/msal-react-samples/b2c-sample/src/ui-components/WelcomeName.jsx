import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import Typography from "@material-ui/core/Typography";

const WelcomeName = () => {
    const { accounts } = useMsal();
    const [name, setName] = useState(null);

    useEffect(() => {
        if (accounts.length > 0) {
            setName(accounts[0].name.split(" ")[0]);
        }
    }, [accounts]);

    if (name) {
        return <Typography variant="h6">Welcome, {name}</Typography>;
    } else {
        return null;
    }
};

export default WelcomeName;