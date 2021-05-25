import Typography from "@material-ui/core/Typography";
import NavBar from "./NavBar";

export const PageLayout: React.FC<{}> = (props) => {
    return (
        <>
            <NavBar />
            <Typography variant="h5" align="center">Welcome to the Microsoft Authentication Library For React Quickstart</Typography>
            <br/>
            <br/>
            {props.children}
        </>
    );
};