import { importDB } from "dexie-export-import";
import { db } from "./db";

export const ImportDbButton = () => {
  const handleImportChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    await db.delete();
    await db.open();

    await importDB(selectedFile, {
      overwriteValues: true,
    });

    window.location.reload();
  };

  return (
    <input
      type="file"
      accept=".json,application/json"
      onChange={handleImportChange}
    />
  );
};
