import { useEffect, useState } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

import { getCategories } from "../api/budget-api-client";

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

type Category = {
  id?: number;
  name: string;
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

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      const loadedCategories = (await getCategories()) as Category[];

      setCategories(loadedCategories);
    };

    void loadCategories();
  }, []);

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
          <em>Unassigned</em>
        </MenuItem>

        <MenuItem value="No Category">No Category</MenuItem>

        {categories.map((category) => (
          <MenuItem key={category.id} value={category.name}>
            {category.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
