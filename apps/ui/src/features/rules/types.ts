export type CategoryRule = {
  id: number;
  categoryName: string;
  subCategoryName?: string;
  matchValue: string;
  priority: number;
  isActive: boolean;
};
