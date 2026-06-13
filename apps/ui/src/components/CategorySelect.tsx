import { useLiveQuery } from "dexie-react-hooks";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

import { db } from "../db/db";

const labelStyles = {
    color: "ivory",
};

const selectStyles = {
    color: "ivory",
    ".MuiOutlinedInput-notchedOutline": {
        borderColor: "ivory",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "ivory",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "ivory",
    },
    ".MuiSvgIcon-root": {
        color: "ivory",
    },
};

type CategorySelectProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    minWidth?: number;
    useDarkStyles?: boolean;
};

export const CategorySelect = (props: CategorySelectProps) => {
    const {
        label,
        value,
        onChange,
        minWidth = 220,
        useDarkStyles = false,
    } = props;

    const categories = useLiveQuery(async () => {
        return db.categories.orderBy("name").toArray();
    }, []);

    const labelId = `${label.toLowerCase().replaceAll(" ", "-")}-label`;

  if (!categories) {
    return null;
  }

    return (
        <FormControl sx={{ minWidth }}>
            <InputLabel
                id={labelId}
                sx={useDarkStyles ? labelStyles : undefined}
                size="small"
            >
                {label}
            </InputLabel>

            <Select
                labelId={labelId}
                value={value}
                label={label}
                onChange={(event) => {
                    onChange(event.target.value);
                }}
                sx={useDarkStyles ? selectStyles : undefined}
                size="small"
            >
                <MenuItem value="">
                    <em>Unassigned</em>
                </MenuItem>

                <MenuItem value="No Category">No Category</MenuItem>

                {(categories).map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                        {category.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};