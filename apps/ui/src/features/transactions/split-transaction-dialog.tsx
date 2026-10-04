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
  onSave: (numberOfMonths: number, startMonth: string) => Promise<void>;
  startMonth?: string;
  numberOfMonths?: number;
};

export const SplitTransactionDialog = (props: SplitTransactionDialogProps) => {
  const { amount, open, onClose, onSave, startMonth, numberOfMonths: initialNumberOfMonths } = props;

  const [numberOfMonths, setNumberOfMonths] = useState(
    initialNumberOfMonths?.toString() || "7"
  );
  const [allocationStartMonth, setAllocationStartMonth] = useState(
    startMonth || DateTime.now().toFormat("yyyy-MM"),
  );

  const monthlyAmount =
    Number(numberOfMonths) > 0 ? amount / Number(numberOfMonths) : 0;

  const getEndMonth = () => {
    const start = DateTime.fromFormat(allocationStartMonth, "yyyy-MM");
    const end = start.plus({ months: Number(numberOfMonths) - 1 });
    return end.toFormat("LLLL yyyy");
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ color: "#1976d2" }}>Allocate Transaction</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography>Spread this expense over N months.</Typography>

          <TextField
            fullWidth
            label="Start Month"
            type="month"
            value={allocationStartMonth}
            onChange={(event) => {
              setAllocationStartMonth(event.target.value);
            }}
          />

          <TextField
            fullWidth
            label="Number of Months"
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

          {Number(numberOfMonths) > 0 && (
            <Typography variant="body2" color="text.secondary">
              Allocation period: {DateTime.fromFormat(allocationStartMonth, "yyyy-MM").toFormat("LLLL yyyy")} → {getEndMonth()}
            </Typography>
          )}
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

            await onSave(parsedMonths, allocationStartMonth);
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
