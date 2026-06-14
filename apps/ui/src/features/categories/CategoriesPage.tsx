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
import {
  addCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../../api/budget-api-client";

type Category = {
  id?: number;
  name: string;
};

type CategoryToDelete = {
  id: number;
  name: string;
};

type CategoryToRename = {
  id: number;
  name: string;
};

const getNextCategoryId = (categories: Category[]) => {
  const maxId = categories.reduce((currentMaxId, category) => {
    return Math.max(currentMaxId, category.id ?? 0);
  }, 0);

  return maxId + 1;
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
  const [refreshKey, setRefreshKey] = useState(0);

  const categories = useLiveQuery(async () => {
    return getCategories() as Promise<Category[]>;
  }, [refreshKey]);

  const refreshCategories = () => {
    setRefreshKey((currentRefreshKey) => {
      return currentRefreshKey + 1;
    });
  };

  const handleAddCategory = async () => {
    const trimmedCategoryName = newCategoryName.trim();

    if (!trimmedCategoryName) {
      return;
    }

    try {
      await addCategory({
        id: getNextCategoryId(categories ?? []),
        name: trimmedCategoryName,
      });

      setAlertMessage("");
      setNewCategoryName("");
      refreshCategories();
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

    await deleteCategory(categoryToDelete.id);

    setAlertMessage("");
    setCategoryToDelete(null);
    setConfirmOpen(false);
    refreshCategories();
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

    await updateCategory(categoryToRename.id, {
      name: trimmedCategoryName,
    });

    setAlertMessage("");
    setCategoryToRename(null);
    setRenameCategoryName("");
    setRenameDialogOpen(false);
    refreshCategories();
  };

  return (
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

      <ViewRules />
    </Box>
  );
};
