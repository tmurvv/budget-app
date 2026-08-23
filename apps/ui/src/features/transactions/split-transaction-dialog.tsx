import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DateTime } from "luxon";
import { useState } from "react";

type SplitTransactionDialogProps = {
  amount: number;
  open: boolean;
  onClose: () => void;
  onSave: (numberOfMonths: number) => Promise<void>;
};

export const SplitTransactionDialog = (props: SplitTransactionDialogProps) => {
  const { amount, open, onClose, onSave } = props;

  const [numberOfMonths, setNumberOfMonths] = useState("7");

  const monthlyAmount =
    Number(numberOfMonths) > 0 ? amount / Number(numberOfMonths) : 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ color: "#1976d2" }}>Allocate Transaction</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography>Spread this expense over N months.</Typography>

          <TextField
            fullWidth
            label="Months"
            type="number"
            value={numberOfMonths}
            onChange={(event) => {
              setNumberOfMonths(event.target.value);
            }}
            slotProps={{
              htmlInput: {
                min: 1,
              },
            }}
          />

          <Typography>
            Monthly allocation:{" "}
            {monthlyAmount.toLocaleString(undefined, {
              style: "currency",
              currency: "CAD",
            })}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Starts this month ({DateTime.now().toFormat("LLLL yyyy")}
            ).
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          variant="contained"
          onClick={async () => {
            const parsedMonths = Number(numberOfMonths);

            if (Number.isNaN(parsedMonths) || parsedMonths < 1) {
              return;
            }

            await onSave(parsedMonths);
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
