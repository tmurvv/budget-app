import { TextField } from "@mui/material";

const darkTextFieldStyles = {
    input: {
        color: "ivory",
    },
    "& .MuiInputLabel-root": {
        color: "ivory",
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "ivory",
    },
    "& .MuiOutlinedInput-root": {
        "& fieldset": {
            borderColor: "ivory",
        },
        "&:hover fieldset": {
            borderColor: "ivory",
        },
        "&.Mui-focused fieldset": {
            borderColor: "ivory",
        },
    },
};

type TextInputProps = {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    minWidth?: number;
    useDarkStyles?: boolean;
};

export const TextInput = (props: TextInputProps) => {
    const {
        value,
        onChange,
        label = "Input",
        minWidth = 220,
        useDarkStyles = false,
    } = props;

    return (
        <TextField
            label={label}
            value={value}
            size="small"
            onChange={(event) => {
                onChange(event.target.value);
            }}
            sx={{
                minWidth,
                ...(useDarkStyles ? darkTextFieldStyles : {}),
            }}
        />
    );
};