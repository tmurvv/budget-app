import { createContext, useContext } from "react";

export type CategoriesContextType = {
  categories: Set<string>;
  isLoading: boolean;
  refresh: () => void;
};

export const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export const useCategories = () => {
  const context = useContext(CategoriesContext);
  if (context === undefined) {
    throw new Error("useCategories must be used within a CategoriesProvider");
  }
  return context;
};
