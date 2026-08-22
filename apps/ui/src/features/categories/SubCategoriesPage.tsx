import { useEffect, useState } from "react";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
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
import { startCase } from "lodash";

import { AppAlert, ConfirmDialog, TextInput } from "../../components";
import { useCategories } from "../../context/use-categories";
import {
  addSubCategory,
  deleteSubCategory,
  getSubCategories,
  getTransactions,
  updateSubCategory,
} from "../../api/budget-api-client";

type SubCategory = {
  id?: number;
  categoryName: string;
  name: string;
};

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
  const { categories, refresh: refreshCategories } = useCategories();
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

  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [hasTransactionsDialogOpen, setHasTransactionsDialogOpen] = useState(false);
  const [transactionCountForDelete, setTransactionCountForDelete] = useState(0);
  const [subCategoryToMarkInactive, setSubCategoryToMarkInactive] = useState<SubCategoryToDelete | null>(null);

  const [lastSubCategoryDialogOpen, setLastSubCategoryDialogOpen] = useState(false);
  const [lastSubCategoryToDelete, setLastSubCategoryToDelete] = useState<SubCategoryToDelete | null>(null);

  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  useEffect(() => {
    const loadSubCategories = async () => {
      if (!selectedCategoryName) {
        setSubCategories([]);
        return;
      }

      const allSubCategories = (await getSubCategories()) as SubCategory[];

      const matchingSubCategories = allSubCategories.filter((subCategory) => {
        return subCategory.categoryName === selectedCategoryName;
      });

      setSubCategories(matchingSubCategories);
    };

    void loadSubCategories();
  }, [selectedCategoryName, refreshKey]);

  const handleAddSubCategory = async () => {
    const trimmed = newSubCategoryName.trim().toLowerCase();

    if (!selectedCategoryName || !trimmed) {
      return;
    }

    const existingSubCategory = subCategories.find(
     (sc) => sc.name.toLowerCase() === trimmed
    );

    if (existingSubCategory) {
     setErrorModalMessage(`Sub-category "${trimmed}" already exists in this category.`);
     setErrorModalOpen(true);
     return;
    }

    try {
     await addSubCategory({
       id: getNextSubCategoryId(subCategories),
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
      handleCancelDelete();
      setTransactionCountForDelete(usageCount);
      setSubCategoryToMarkInactive(subCategoryToDelete);
      setHasTransactionsDialogOpen(true);
      return;
    }

    const isLastSubCategory = subCategories.length === 1;

    if (isLastSubCategory) {
      handleCancelDelete();
      setLastSubCategoryToDelete(subCategoryToDelete);
      setLastSubCategoryDialogOpen(true);
      return;
    }

    await deleteSubCategory(subCategoryToDelete.id);

    setRefreshKey((currentRefreshKey) => {
      return currentRefreshKey + 1;
    });

    setConfirmOpen(false);
    setSubCategoryToDelete(null);
    setAlertMessage("");
    refreshCategories();
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

    const existing = subCategories.find((subCategory) => {
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

  const handleMarkInactive = async () => {
    if (!subCategoryToMarkInactive) {
      return;
    }

    await updateSubCategory(subCategoryToMarkInactive.id, {
      inactive: true,
    });

    setHasTransactionsDialogOpen(false);
    setSubCategoryToMarkInactive(null);
    setTransactionCountForDelete(0);
    setRefreshKey((currentRefreshKey) => {
      return currentRefreshKey + 1;
    });
    refreshCategories();
  };

  const handleCancelMarkInactive = () => {
    setHasTransactionsDialogOpen(false);
    setSubCategoryToMarkInactive(null);
    setTransactionCountForDelete(0);
  };

  const handleLastSubCategoryDeleteCategory = async () => {
    if (!lastSubCategoryToDelete) {
      return;
    }

    await deleteSubCategory(lastSubCategoryToDelete.id);

    setLastSubCategoryDialogOpen(false);
    setLastSubCategoryToDelete(null);
    setRefreshKey((currentRefreshKey) => {
      return currentRefreshKey + 1;
    });
    refreshCategories();
    setSelectedCategoryName("");
  };

  const handleLastSubCategoryRenameToNoSelection = async () => {
    if (!lastSubCategoryToDelete) {
      return;
    }

    await updateSubCategory(lastSubCategoryToDelete.id, {
      name: "No Selection",
    });

    setLastSubCategoryDialogOpen(false);
    setLastSubCategoryToDelete(null);
    setRefreshKey((currentRefreshKey) => {
      return currentRefreshKey + 1;
    });
  };

  const handleLastSubCategoryCancelDelete = () => {
    setLastSubCategoryDialogOpen(false);
    setLastSubCategoryToDelete(null);
  };

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim().toLowerCase();

    if (!trimmed) {
      setAlertMessage("Category name cannot be empty.");
      return;
    }

    const existingCategory = Array.from(categories).find(
      (cat) => cat.toLowerCase() === trimmed
    );

    if (existingCategory) {
      setErrorModalMessage(`Category "${trimmed}" already exists.`);
      setErrorModalOpen(true);
      return;
    }

    try {
      await addSubCategory({
        id: getNextSubCategoryId(subCategories),
        categoryName: trimmed,
        name: "No Selection",
      });

      setNewCategoryName("");
      setAlertMessage("");
      setAddCategoryDialogOpen(false);
      setRefreshKey((currentRefreshKey) => {
        return currentRefreshKey + 1;
      });
      refreshCategories();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add category";
      setAlertMessage(message);
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, marginBottom: 2 }}>
        <Typography variant="h4">
          Categories
        </Typography>
        <IconButton
          size="small"
          color="primary"
          onClick={() => {
            setSelectedCategoryName("");
            setRefreshKey((currentRefreshKey) => {
              return currentRefreshKey + 1;
            });
            refreshCategories();
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

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
            <ListItemButton
              onClick={() => {
                setAddCategoryDialogOpen(true);
              }}
              sx={{
                backgroundColor: "rgba(25, 118, 210, 0.12)",
                "&:hover": {
                  backgroundColor: "rgba(25, 118, 210, 0.22)",
                },
              }}
            >
              <ListItemText
                primary="+Add Category"
                sx={{ fontStyle: "italic", color: "rgba(25, 118, 210, 0.7)" }}
              />
            </ListItemButton>

            {Array.from(categories).sort().map((categoryName) => (
              <ListItemButton
                key={categoryName}
                selected={selectedCategoryName === categoryName}
                onClick={() => {
                  setSelectedCategoryName(categoryName);
                  setAlertMessage("");
                  setNewSubCategoryName("");
                }}
              >
                <ListItemText primary={startCase(categoryName)} />
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
              ? `${startCase(selectedCategoryName)} sub-categories`
              : "Select a category"}
          </Typography>

          <List>
            {subCategories.map((subCategory) => (
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
                <ListItemText primary={startCase(subCategory.name)} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete sub-category"
        message={`Are you sure you want to delete "${subCategoryToDelete?.name ? startCase(subCategoryToDelete.name) : ''}"?`}
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

      <Dialog open={addCategoryDialogOpen} onClose={() => setAddCategoryDialogOpen(false)}>
        <DialogTitle sx={{ color: "#1976d2" }}>Add Category</DialogTitle>

        <DialogContent>
          <Box sx={{ paddingTop: 1 }}>
            <TextInput
              label="Category name"
              value={newCategoryName}
              onChange={setNewCategoryName}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => {
            setAddCategoryDialogOpen(false);
            setNewCategoryName("");
          }}>Cancel</Button>

          <Button
            variant="contained"
            onClick={() => {
              void handleAddCategory();
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={hasTransactionsDialogOpen} onClose={handleCancelMarkInactive}>
        <DialogTitle sx={{ color: "#1976d2" }}>Sub-category in Use</DialogTitle>

        <DialogContent>
          <Box sx={{ paddingTop: 1 }}>
            <Typography>
              This sub-category is used by {transactionCountForDelete} transaction(s). You can mark it as inactive or reassign those transactions first.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCancelMarkInactive}>Cancel</Button>

          <Button
            variant="contained"
            onClick={() => {
              void handleMarkInactive();
            }}
          >
            Mark Inactive
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={lastSubCategoryDialogOpen} onClose={handleLastSubCategoryCancelDelete}>
        <DialogTitle sx={{ color: "#1976d2" }}>Delete Sub-category</DialogTitle>

        <DialogContent>
          <Box sx={{ paddingTop: 1 }}>
            <Typography>
              This is the last sub-category. Delete the category also?
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleLastSubCategoryCancelDelete}>Cancel</Button>

          <Button
            onClick={() => {
              void handleLastSubCategoryRenameToNoSelection();
            }}
          >
            No
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={() => {
              void handleLastSubCategoryDeleteCategory();
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={errorModalOpen} onClose={() => setErrorModalOpen(false)}>
        <DialogTitle sx={{ color: "#1976d2" }}>Error</DialogTitle>

        <DialogContent>
          <Box sx={{ paddingTop: 1 }}>
            <Typography>
              {errorModalMessage}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              setErrorModalOpen(false);
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};