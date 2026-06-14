import { useLiveQuery } from "dexie-react-hooks";

import { getRules } from "../../api/budget-api-client";

export const ViewRules = () => {
  const rules = useLiveQuery(async () => {
    return getRules();
  }, []);

  if (!rules || rules.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Category Rules</h3>

      {rules.map((rule) => (
        <div key={rule.id}>
          {rule.matchValue} → {rule.categoryName}
          {rule.subCategoryName
            ? ` / ${rule.subCategoryName}`
            : ""} (priority {rule.priority})
        </div>
      ))}
    </div>
  );
};
