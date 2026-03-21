export const CATEGORY_MAP = {
    Groceries: ["Produce", "Meat", "Dairy", "Other"],
    Dining: ["Restaurant", "Fast Food", "Coffee"],
    Gas: ["Fuel"],
    Shopping: ["Clothing", "Home", "Electronics"],
    Bills: ["Utilities", "Internet", "Phone"],
    Income: ["Salary", "Refund"],
    Health: ["Pharmacy", "Doctor"],
    Entertainment: ["Movies", "Subscriptions"],
    Travel: ["Flights", "Hotels"],
    Other: ["Misc"],
} as const;

export const CATEGORIES = Object.keys(CATEGORY_MAP);