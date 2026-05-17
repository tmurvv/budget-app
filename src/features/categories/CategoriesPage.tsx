import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

import { AppAlert, ConfirmDialog, TextInput } from "../../components";
import { ViewRules } from "../rules/view-rules";
import { db } from "../../db/db";

type CategoryToDelete = {
  id: number;
  name: string;
};

type CategoryToRename = {
  id: number;
  name: string;
};

export const CategoriesPage = () => {
  const [alertMessage, setAlertMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryToDelete, setCategoryToDelete] =
      useState<CategoryToDelete | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameCategoryName, setRenameCategoryName] = useState("");
  const [categoryToRename, setCategoryToRename] =
      useState<CategoryToRename | null>(null);

  const categories = useLiveQuery(async () => {
    return db.categories.orderBy("name").toArray();
  }, []);

  const handleAddCategory = async () => {
    const trimmedCategoryName = newCategoryName.trim();

    if (!trimmedCategoryName) {
      return;
    }

    try {
      await db.categories.add({
        name: trimmedCategoryName,
      });

      setAlertMessage("");
      setNewCategoryName("");
    } catch (error) {
      const message =
          error instanceof Error ? error.message : "Failed to add category";

      setAlertMessage(message);
    }
  };

  const handleStartDeleteCategory = (
      categoryId: number | undefined,
      categoryName: string,
  ) => {
    if (!categoryId) {
      return;
    }

    setCategoryToDelete({
      id: categoryId,
      name: categoryName,
    });
    setConfirmOpen(true);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) {
      return;
    }

    const transactionUsageCount = await db.transactions
        .where("category")
        .equals(categoryToDelete.name)
        .count();

    const subCategoryUsageCount = await db.subCategories
        .where("categoryName")
        .equals(categoryToDelete.name)
        .count();

    if (transactionUsageCount > 0) {
      setAlertMessage(
          `Cannot delete "${categoryToDelete.name}". It is used by ${transactionUsageCount} transactions.`,
      );
      setCategoryToDelete(null);
      setConfirmOpen(false);
      return;
    }

    if (subCategoryUsageCount > 0) {
      setAlertMessage(
          `Cannot delete "${categoryToDelete.name}". It still has ${subCategoryUsageCount} sub-categories.`,
      );
      setCategoryToDelete(null);
      setConfirmOpen(false);
      return;
    }

    await db.categories.delete(categoryToDelete.id);

    setAlertMessage("");
    setCategoryToDelete(null);
    setConfirmOpen(false);
  };

  const handleCancelDeleteCategory = () => {
    setCategoryToDelete(null);
    setConfirmOpen(false);
  };

  const handleStartRenameCategory = (
      categoryId: number | undefined,
      categoryName: string,
  ) => {
    if (!categoryId) {
      return;
    }

    setCategoryToRename({
      id: categoryId,
      name: categoryName,
    });
    setRenameCategoryName(categoryName);
    setRenameDialogOpen(true);
  };

  const handleCancelRenameCategory = () => {
    setCategoryToRename(null);
    setRenameCategoryName("");
    setRenameDialogOpen(false);
  };

  const handleConfirmRenameCategory = async () => {
    if (!categoryToRename) {
      return;
    }

    const trimmedCategoryName = renameCategoryName.trim();

    if (!trimmedCategoryName) {
      setAlertMessage("Category name cannot be empty.");
      return;
    }

    if (trimmedCategoryName === categoryToRename.name) {
      handleCancelRenameCategory();
      return;
    }

    const existingCategory = await db.categories
        .where("name")
        .equals(trimmedCategoryName)
        .first();

    if (existingCategory) {
      setAlertMessage(`Category "${trimmedCategoryName}" already exists.`);
      return;
    }

    await db.transaction(
        "rw",
        db.categories,
        db.transactions,
        db.subCategories,
        async () => {
          await db.categories.update(categoryToRename.id, {
            name: trimmedCategoryName,
          });

          await db.transactions
              .where("category")
              .equals(categoryToRename.name)
              .modify({
                category: trimmedCategoryName,
              });

          await db.subCategories
              .where("categoryName")
              .equals(categoryToRename.name)
              .modify({
                categoryName: trimmedCategoryName,
              });
        },
    );

    setAlertMessage("");
    setCategoryToRename(null);
    setRenameCategoryName("");
    setRenameDialogOpen(false);
  };

  return (
      <Box sx={{ padding: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Categories
        </Typography>
        <ViewRules />

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
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton
                            edge="end"
                            onClick={() => {
                              handleStartRenameCategory(category.id, category.name);
                            }}
                        >
                          <EditIcon />
                        </IconButton>

                        <IconButton
                            edge="end"
                            color="error"
                            onClick={() => {
                              handleStartDeleteCategory(category.id, category.name);
                            }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    }
                >
                  <ListItemText primary={category.name} />
                </ListItem>
            ))}
          </List>
        </Paper>

        <ConfirmDialog
            open={confirmOpen}
            title="Delete category"
            message={`Are you sure you want to delete "${categoryToDelete?.name}"?`}
            confirmButtonText="Delete"
            onConfirm={() => {
              void handleConfirmDeleteCategory();
            }}
            onCancel={handleCancelDeleteCategory}
        />

        <Dialog open={renameDialogOpen} onClose={handleCancelRenameCategory}>
          <DialogTitle>Rename category</DialogTitle>

          <DialogContent>
            <Box sx={{ paddingTop: 1 }}>
              <TextInput
                  label="Category name"
                  value={renameCategoryName}
                  onChange={(value) => {
                    setRenameCategoryName(value);
                  }}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCancelRenameCategory}>Cancel</Button>

            <Button
                variant="contained"
                onClick={() => {
                  void handleConfirmRenameCategory();
                }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};