import { Alert, AlertTitle, Collapse } from "@mui/material";

type AppAlertProps = {
    open: boolean;
    severity: "error" | "warning" | "info" | "success";
    title?: string;
    message: string;
};

export const AppAlert = (props: AppAlertProps) => {
    const { open, severity, title, message } = props;

    return (
        <Collapse in={open}>
            <Alert severity={severity} sx={{ marginBottom: 2 }}>
                {title ? <AlertTitle>{title}</AlertTitle> : null}
                {message}
            </Alert>
        </Collapse>
    );
};