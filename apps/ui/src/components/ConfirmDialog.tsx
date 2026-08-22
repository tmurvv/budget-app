import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from "@mui/material";

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    message: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    onConfirm: () => void;
    onCancel: () => void;
};

export const ConfirmDialog = (props: ConfirmDialogProps) => {
    const {
        open,
        title,
        message,
        confirmButtonText = "Confirm",
        cancelButtonText = "Cancel",
        onConfirm,
        onCancel,
    } = props;

    return (
        <Dialog open={open} onClose={onCancel}>
            <DialogTitle sx={{ color: "#1565c0" }}>{title}</DialogTitle>

            <DialogContent>
                <Typography>{message}</Typography>
            </DialogContent>

            <DialogActions>
                <Button onClick={onCancel}>
                    {cancelButtonText}
                </Button>

                <Button
                    color="error"
                    variant="contained"
                    onClick={onConfirm}
                >
                    {confirmButtonText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};