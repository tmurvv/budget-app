export const MONTHLY_INCOME = 6200;

export const INITIAL_BUDGETS = [
  { categoryName: "Groceries/Food", subCategoryName: "Groceries", amount: 575 },
  { categoryName: "Groceries/Food", subCategoryName: "Fast Food", amount: 350 },
  {
    categoryName: "Groceries/Food",
    subCategoryName: "Restaurants",
    amount: 100,
  },
  { categoryName: "Groceries/Food", subCategoryName: "Non-food", amount: 35 },

  { categoryName: "Automobile", subCategoryName: "Gas", amount: 275 },
  { categoryName: "Automobile", subCategoryName: "Maintenance", amount: 25 },
  { categoryName: "Automobile", subCategoryName: "Parking/Other", amount: 75 },

  { categoryName: "Child", subCategoryName: "Activities", amount: 225 },
  { categoryName: "Child", subCategoryName: "Allowance", amount: 235 },
  { categoryName: "Child", subCategoryName: "Clothes", amount: 40 },
  { categoryName: "Child", subCategoryName: "Education", amount: 30 },
  { categoryName: "Child", subCategoryName: "Personal Items", amount: 80 },

  { categoryName: "Entertainment", subCategoryName: "Movies", amount: 35 },
  {
    categoryName: "Entertainment",
    subCategoryName: "Subscriptions",
    amount: 135,
  },

  { categoryName: "Mom", subCategoryName: "Entertainment", amount: 45 },
  { categoryName: "Mom", subCategoryName: "Hair", amount: 35 },
  { categoryName: "Mom", subCategoryName: "Health", amount: 50 },

  { categoryName: "Pets", subCategoryName: "Food/Supplies", amount: 125 },
  { categoryName: "Pets", subCategoryName: "Medical", amount: 150 },

  { categoryName: "Phone/Internet", subCategoryName: "Cell", amount: 30 },
  { categoryName: "Phone/Internet", subCategoryName: "Internet", amount: 5 },
  {
    categoryName: "Phone/Internet",
    subCategoryName: "Subscriptions",
    amount: 15,
  },

  { categoryName: "Business", subCategoryName: "Career Growth", amount: 15 },
  { categoryName: "Business", subCategoryName: "Side-hustle", amount: 35 },

  { categoryName: "Household", subCategoryName: "Kitchen", amount: 20 },
  { categoryName: "Household", subCategoryName: "Non-kitchen", amount: 40 },

  { categoryName: "Charity", subCategoryName: "Big House Cats", amount: 15 },
  { categoryName: "Charity", subCategoryName: "Compassion Canada", amount: 15 },
  { categoryName: "Other", subCategoryName: "No Sub-category", amount: 25 },
] as const;
