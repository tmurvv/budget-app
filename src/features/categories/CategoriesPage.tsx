import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Delete as DeleteIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

import { AppAlert, ConfirmDialog, TextInput } from "../../components";
import { db } from "../../db/db";

export const CategoriesPage = () => {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const categories = useLiveQuery(async () => {
    return db.categories.orderBy("name").toArray();
  }, []);

  const handleAddCategory = async () => {
    const trimmedName = newCategoryName.trim();

    if (!trimmedName) {
      return;
    }

    try {
      await db.categories.add({ name: trimmedName });
      setNewCategoryName("");
      setAlertMessage("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add category";

      setAlertMessage(message);
    }
  };
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) {
      return;
    }

    const usageCount = await db.transactions
      .where("category")
      .equals(categoryToDelete.name)
      .count();

    if (usageCount > 0) {
      setAlertMessage(
        `Cannot delete "${categoryToDelete.name}". It is used by ${usageCount} transactions.`,
      );
      setConfirmOpen(false);
      setCategoryToDelete(null);
      return;
    }

    await db.categories.delete(categoryToDelete.id);

    setConfirmOpen(false);
    setCategoryToDelete(null);
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setCategoryToDelete(null);
  };
  const handleDeleteCategory = async (categoryId: number | undefined) => {
    if (!categoryId) {
      return;
    }

    const category = await db.categories.get(categoryId);

    if (!category) {
      return;
    }

    const usageCount = await db.transactions
      .where("category")
      .equals(category.name)
      .count();

    if (usageCount > 0) {
      setAlertMessage(
        `Cannot delete "${category.name}". It is used by ${usageCount} transaction${usagCount === 0 ? "" : "s"}.`,
      );
      return;
    }

    await db.categories.delete(categoryId);
    setAlertMessage("");
  };

  return (
    <>
      <Box sx={{ padding: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Categories
        </Typography>

        <Box sx={{ maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          <AppAlert
            open={Boolean(alertMessage)}
            severity="warning"
            title="Category issue"
            message={alertMessage}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            marginBottom: 2,
          }}
        >
          <TextInput
            label="New category"
            value={newCategoryName}
            onChange={(value) => {
              setNewCategoryName(value);
            }}
            useDarkStyles
          />

          <Button
            variant="contained"
            onClick={() => {
              void handleAddCategory();
            }}
          >
            Add
          </Button>
        </Box>

        <Paper sx={{ maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
          <List>
            {(categories ?? []).map((category) => (
              <ListItem
                key={category.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => {
                      if (!category.id) {
                        return;
                      }

                      setCategoryToDelete({
                        id: category.id,
                        name: category.name,
                      });

                      setConfirmOpen(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={category.name} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete category"
        message={`Are you sure you want to delete "${categoryToDelete?.name}"?`}
        confirmButtonText="Delete"
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onCancel={handleCancelDelete}
      />
    </>
  );
};
