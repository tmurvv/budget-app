import { ReactNode, useEffect, useState } from "react";
import { getSubCategories } from "../api/budget-api-client";
import { CategoriesContext } from "./use-categories";

export const CategoriesProvider = ({ children }: { children: ReactNode }) => {
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const subCategories = (await getSubCategories()) as Array<{
          categoryName: string;
        }>;
        const uniqueCategories = new Set(
          subCategories.map((sc) => sc.categoryName)
        );
        setCategories(uniqueCategories);
      } catch (error) {
        console.error("Failed to load categories from sub-categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadCategories();
  }, [refreshKey]);

  const refresh = () => {
    setRefreshKey((currentKey) => currentKey + 1);
  };

  return (
    <CategoriesContext.Provider value={{ categories, isLoading, refresh }}>
      {children}
    </CategoriesContext.Provider>
  );
};
