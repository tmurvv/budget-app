import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

import { CATEGORIES } from "../features/categories/categories";

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

  const labelId = `${label.toLowerCase().replaceAll(" ", "-")}-label`;

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
          <em>None</em>
        </MenuItem>

        {CATEGORIES.map((category) => (
          <MenuItem key={category} value={category}>
            {category}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
