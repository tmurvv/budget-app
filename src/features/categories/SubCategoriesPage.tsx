import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Delete as DeleteIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

import { AppAlert, ConfirmDialog, TextInput } from "../../components";
import { db } from "../../db/db";

export const SubCategoriesPage = () => {
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [subCategoryToDelete, setSubCategoryToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const handleAddSubCategory = async () => {
    const trimmedName = newSubCategoryName.trim();

    if (!selectedCategoryName || !trimmedName) {
      return;
    }

    await db.subCategories.add({
      categoryName: selectedCategoryName,
      name: trimmedName,
    });

    setNewSubCategoryName("");
  };

  const handleConfirmDeleteSubCategory = async () => {
    if (!subCategoryToDelete) {
      return;
    }

    const usageCount = await db.transactions
      .where("subCategory")
      .equals(subCategoryToDelete.name)
      .count();

    if (usageCount > 0) {
      setAlertMessage(
        `Cannot delete "${subCategoryToDelete.name}". It is used by ${usageCount} transactions.`,
      );
      setConfirmOpen(false);
      setSubCategoryToDelete(null);
      return;
    }

    await db.subCategories.delete(subCategoryToDelete.id);

    setAlertMessage("");
    setConfirmOpen(false);
    setSubCategoryToDelete(null);
  };

  const handleCancelDeleteSubCategory = () => {
    setConfirmOpen(false);
    setSubCategoryToDelete(null);
  };

  const categories = useLiveQuery(async () => {
    return db.categories.orderBy("name").toArray();
  }, []);

  const subCategories = useLiveQuery(async () => {
    if (!selectedCategoryName) {
      return [];
    }

    return db.subCategories
      .where("categoryName")
      .equals(selectedCategoryName)
      .sortBy("name");
  }, [selectedCategoryName]);

  return (
    <>
      <Box sx={{ maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
        <AppAlert
          open={Boolean(alertMessage)}
          severity="warning"
          title="Sub-category issue"
          message={alertMessage}
        />
      </Box>
      <Box sx={{ padding: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Sub-categories
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 3,
            alignItems: "start",
          }}
        >
          <Paper>
            <List>
              {(categories ?? []).map((category) => (
                <ListItemButton
                  key={category.id}
                  selected={selectedCategoryName === category.name}
                  onClick={() => {
                    setSelectedCategoryName(category.name);
                  }}
                >
                  <ListItemText primary={category.name} />
                </ListItemButton>
              ))}
            </List>
          </Paper>

          <Paper sx={{ minHeight: 300, padding: 2 }}>
            <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
              <TextInput
                label="New sub-category"
                value={newSubCategoryName}
                onChange={(value) => {
                  setNewSubCategoryName(value);
                }}
              />

              <Button
                variant="contained"
                disabled={!selectedCategoryName}
                onClick={() => {
                  void handleAddSubCategory();
                }}
              >
                Add
              </Button>
            </Box>

            <Typography variant="h6" gutterBottom>
              {selectedCategoryName
                ? `${selectedCategoryName} sub-categories`
                : "Select a category"}
            </Typography>

            <List>
              {(subCategories ?? []).map((subCategory) => (
                <ListItem
                  key={subCategory.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => {
                        if (!subCategory.id) {
                          return;
                        }

                        setSubCategoryToDelete({
                          id: subCategory.id,
                          name: subCategory.name,
                        });

                        setConfirmOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText primary={subCategory.name} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      </Box>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete sub-category"
        message={`Are you sure you want to delete "${subCategoryToDelete?.name}"?`}
        confirmButtonText="Delete"
        onConfirm={() => {
          void handleConfirmDeleteSubCategory();
        }}
        onCancel={handleCancelDeleteSubCategory}
      />
    </>
  );
};
