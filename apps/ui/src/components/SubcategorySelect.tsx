import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useEffect, useState } from "react";
import { startCase } from "lodash";
import { getSubCategories } from "../api/budget-api-client";

const labelStyles = {
  color: "#b0b0b0",
};

const selectStyles = {
  color: "#b0b0b0",
  ".MuiOutlinedInput-notchedOutline": {
    borderColor: "#b0b0b0",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#b0b0b0",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#b0b0b0",
  },
  ".MuiSvgIcon-root": {
    color: "#b0b0b0",
  },
};

type SubcategorySelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  selectedCategory?: string;
  minWidth?: number;
  useDarkStyles?: boolean;
};

export const SubcategorySelect = (props: SubcategorySelectProps) => {
  const {
    label,
    value,
    onChange,
    selectedCategory = "",
    minWidth = 220,
    useDarkStyles = false,
  } = props;

  const [subCategories, setSubCategories] = useState<
    Array<{ categoryName: string; name: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubCategories = async () => {
      try {
        const data = await getSubCategories();
        setSubCategories(data);
      } catch (error) {
        console.error("Failed to load subcategories:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadSubCategories();
  }, []);

  const filteredSubCategories = selectedCategory
    ? subCategories.filter((sc) => sc.categoryName === selectedCategory)
    : subCategories;

  const uniqueSubCategories = Array.from(
    new Set(filteredSubCategories.map((sc) => sc.name))
  ).sort();

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
        disabled={loading}
      >
        <MenuItem value="">
          <em>All</em>
        </MenuItem>

        {uniqueSubCategories.map((subCategoryName) => (
          <MenuItem key={subCategoryName} value={subCategoryName}>
            {startCase(subCategoryName)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
