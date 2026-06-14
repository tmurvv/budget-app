export const CATEGORY_MAP = {
    Groceries: ["Produce", "Meat", "Dairy", "Other"],
    Gas: ["Fuel"],
    Shopping: ["Clothing", "Home", "Electronics"],
    Income: ["Salary", "Refund"],
    Health: ["Pharmacy", "Doctor"],
    Entertainment: ["Movies", "Subscriptions"],
    Travel: ["Flights", "Hotels"],
    Other: ["Misc"],
} as const;

export const CATEGORIES = Object.keys(CATEGORY_MAP);