import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
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
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";

import { AppAlert, ConfirmDialog, TextInput } from "../../components";
import {
  addSubCategory,
  deleteSubCategory,
  getCategories,
  getSubCategories,
  updateSubCategory,
} from "../../api/budget-api-client";

type SubCategoryToDelete = {
  id: number;
  name: string;
};

type SubCategoryToRename = {
  id: number;
  name: string;
};

const getNextSubCategoryId = (subCategories: Array<{ id?: number }>) => {
  const maxId = subCategories.reduce((currentMaxId, subCategory) => {
    return Math.max(currentMaxId, subCategory.id ?? 0);
  }, 0);

  return maxId + 1;
};

export const SubCategoriesPage = () => {
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [newSubCategoryName, setNewSubCategoryName] = useState("");

  const [alertMessage, setAlertMessage] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [subCategoryToDelete, setSubCategoryToDelete] =
      useState<SubCategoryToDelete | null>(null);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameSubCategoryName, setRenameSubCategoryName] = useState("");
  const [subCategoryToRename, setSubCategoryToRename] =
      useState<SubCategoryToRename | null>(null);

  const categories = useLiveQuery(async () => {
    return getCategories();
  }, []);

  const [refreshKey, setRefreshKey] = useState(0);

  const subCategories = useLiveQuery(async () => {
    if (!selectedCategoryName) {
      return [];
    }

    const allSubCategories = await getSubCategories();

    return allSubCategories.filter((subCategory) => {
      return subCategory.categoryName === selectedCategoryName;
    });
  }, [selectedCategoryName, refreshKey]);

  const handleAddSubCategory = async () => {
    const trimmed = newSubCategoryName.trim();

    if (!selectedCategoryName || !trimmed) {
      return;
    }

    try {
     await addSubCategory({
        id: getNextSubCategoryId(subCategories ?? []),
        categoryName: selectedCategoryName,
        name: trimmed,
      });

      setNewSubCategoryName("");
      setAlertMessage("");

      setRefreshKey((currentRefreshKey) => {
        return currentRefreshKey + 1;
      });
    } catch (error) {
      const message =
          error instanceof Error ? error.message : "Failed to add sub-category";
      setAlertMessage(message);
    }
  };

  const handleStartDelete = (id: number | undefined, name: string) => {
    if (!id) {
      return;
    }

    setSubCategoryToDelete({ id, name });
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!subCategoryToDelete) {
      return;
    }

    const transactions = await getTransactions();

    const usageCount = transactions.filter((transaction) => {
      return transaction.subCategory === subCategoryToDelete.name;
    }).length;

    if (usageCount > 0) {
      setAlertMessage(
        `Cannot delete "${subCategoryToDelete.name}". It is used by ${usageCount} transactions.`,
      );
      setConfirmOpen(false);
      setSubCategoryToDelete(null);
      return;
    }

    await deleteSubCategory(subCategoryToDelete.id);

    setRefreshKey((currentRefreshKey) => {
      return currentRefreshKey + 1;
    });

    setConfirmOpen(false);
    setSubCategoryToDelete(null);
    setAlertMessage("");
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setSubCategoryToDelete(null);
  };

  const handleStartRename = (id: number | undefined, name: string) => {
    if (!id) {
      return;
    }

    setSubCategoryToRename({ id, name });
    setRenameSubCategoryName(name);
    setRenameDialogOpen(true);
  };

  const handleCancelRename = () => {
    setRenameDialogOpen(false);
    setSubCategoryToRename(null);
    setRenameSubCategoryName("");
  };

  const handleConfirmRename = async () => {
    if (!subCategoryToRename) {
      return;
    }

    const trimmed = renameSubCategoryName.trim();

    if (!trimmed) {
      setAlertMessage("Sub-category name cannot be empty.");
      return;
    }

    if (trimmed === subCategoryToRename.name) {
      handleCancelRename();
      return;
    }

    const existing = (subCategories ?? []).find((subCategory) => {
      return (
        subCategory.categoryName === selectedCategoryName &&
        subCategory.name === trimmed
      );
    });

    if (existing) {
      setAlertMessage(`Sub-category "${trimmed}" already exists.`);
      return;
    }

    await updateSubCategory(subCategoryToRename.id, {
      name: trimmed,
    });

    setRefreshKey((currentRefreshKey) => {
      return currentRefreshKey + 1;
    });

    setRenameDialogOpen(false);
    setSubCategoryToRename(null);
    setRenameSubCategoryName("");
    setAlertMessage("");
  };

  return (
      <Box sx={{ padding: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Sub-categories
        </Typography>

        <Box sx={{ maxWidth: 700, marginLeft: "auto", marginRight: "auto" }}>
          <AppAlert
              open={Boolean(alertMessage)}
              severity="warning"
              title="Sub-category issue"
              message={alertMessage}
          />
        </Box>

        <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "320px 1fr",
              gap: 3,
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
                        setAlertMessage("");
                        setNewSubCategoryName("");
                      }}
                  >
                    <ListItemText primary={category.name} />
                  </ListItemButton>
              ))}
            </List>
          </Paper>

          <Paper sx={{ padding: 2 }}>
            <Box sx={{ display: "flex", gap: 2, marginBottom: 2 }}>
              <TextInput
                  label="New sub-category"
                  value={newSubCategoryName}
                  onChange={setNewSubCategoryName}
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
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <IconButton
                              onClick={() => {
                                handleStartRename(subCategory.id, subCategory.name);
                              }}
                          >
                            <EditIcon />
                          </IconButton>

                          <IconButton
                              color="error"
                              onClick={() => {
                                handleStartDelete(subCategory.id, subCategory.name);
                              }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                  >
                    <ListItemText primary={subCategory.name} />
                  </ListItem>
              ))}
            </List>
          </Paper>
        </Box>

        <ConfirmDialog
            open={confirmOpen}
            title="Delete sub-category"
            message={`Are you sure you want to delete "${subCategoryToDelete?.name}"?`}
            confirmButtonText="Delete"
            onConfirm={() => {
              void handleConfirmDelete();
            }}
            onCancel={handleCancelDelete}
        />

        <Dialog open={renameDialogOpen} onClose={handleCancelRename}>
          <DialogTitle>Rename sub-category</DialogTitle>

          <DialogContent>
            <Box sx={{ paddingTop: 1 }}>
              <TextInput
                  label="Sub-category name"
                  value={renameSubCategoryName}
                  onChange={setRenameSubCategoryName}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCancelRename}>Cancel</Button>

            <Button
                variant="contained"
                onClick={() => {
                  void handleConfirmRename();
                }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};