import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { getRules } from "../../api/budget-api-client";
import type { CategoryRule } from "./types";

export const ViewRules = () => {
  const [rules, setRules] = useState<CategoryRule[]>([]);

  useEffect(() => {
    const loadRules = async () => {
      const loadedRules = await getRules();
      setRules(loadedRules);
    };

    void loadRules();
  }, []);

  if (rules.length === 0) {
    return null;
  }

  return (
    <Box sx={{ marginTop: 3 }}>
      <Typography variant="h6" sx={{ marginBottom: 1 }}>
        Category Rules
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Match</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Sub-category</TableCell>
              <TableCell align="right">Priority</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.matchValue}</TableCell>
                <TableCell>{rule.categoryName}</TableCell>
                <TableCell>{rule.subCategoryName || "-"}</TableCell>
                <TableCell align="right">{rule.priority}</TableCell>
                <TableCell>
                  <Chip
                    label={rule.isActive ? "Active" : "Inactive"}
                    size="small"
                    color={rule.isActive ? "success" : "default"}
                    variant={rule.isActive ? "filled" : "outlined"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

