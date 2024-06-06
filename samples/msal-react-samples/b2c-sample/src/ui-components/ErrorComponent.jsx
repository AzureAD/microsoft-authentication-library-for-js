import Typography from "@mui/material/Typography";

export const ErrorComponent = ({error}) => {
    return <Typography variant="h6">An Error Occurred: {error.errorCode}</Typography>;
}