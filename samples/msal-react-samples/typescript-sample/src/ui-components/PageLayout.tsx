import Typography from "@mui/material/Typography";
import NavBar from "./NavBar";

type Props = {
    children?: React.ReactNode;
};

export const PageLayout: React.FC<Props> = ({children}) => {
    return (
        <>
            <NavBar />
            <Typography variant="h5" align="center">Welcome to the Microsoft Authentication Library For React Quickstart</Typography>
            <br/>
            <br/>
            {children}
        </>
    );
};