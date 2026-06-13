import { exportDB } from "dexie-export-import";
import { db } from "./db";

const downloadBlob = ({ blob, fileName }: { blob: Blob; fileName: string }) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchorElement = document.createElement("a");

  anchorElement.href = objectUrl;
  anchorElement.download = fileName;
  anchorElement.click();

  URL.revokeObjectURL(objectUrl);
};

export const ExportDbButton = () => {
  const handleExportDb = async () => {
    const blob = await exportDB(db, {
      prettyJson: true,
    });

    downloadBlob({
      blob,
      fileName: `${db.name}-export.json`,
    });
  };

  return <button onClick={handleExportDb}>Export DB</button>;
};