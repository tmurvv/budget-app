import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
    Box,
    Button,
    List,
    ListItem,
    ListItemText,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import { TextInput } from "../../components/TextInput";

import { db } from "../../db/db";

export const CategoriesPage = () => {
    const [newCategoryName, setNewCategoryName] = useState("");

    const categories = useLiveQuery(async () => {
        return db.categories.orderBy("name").toArray();
    }, []);

    const handleAddCategory = async () => {
        const trimmedName = newCategoryName.trim();

        if (!trimmedName) {
            return;
        }

        await db.categories.add({ name: trimmedName });

        setNewCategoryName("");
    };

    return (
        <Box sx={{ padding: 4 }}>
            <Typography variant="h4" gutterBottom align="center">
                Categories
            </Typography>

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
                />

                <Button variant="contained" onClick={() => {
                    void handleAddCategory();
                }}>
                    Add
                </Button>
            </Box>

            <Paper sx={{ maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
                <List>
                    {(categories ?? []).map((category) => (
                        <ListItem key={category.id}>
                            <ListItemText primary={category.name} />
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Box>
    );
};