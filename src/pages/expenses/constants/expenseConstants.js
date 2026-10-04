export const EXPENSE_CATEGORIES = [
  "Feed",
  "Medication",
  "Vaccination",
  "Veterinary Services",
  "Utilities",
  "Electricity",
  "Water",
  "Labour",
  "Transport",
  "Fuel",
  "Maintenance",
  "Equipment",
  "Farm Supplies",
  "Cleaning Supplies",
  "Disinfectants",
  "Poultry House Repairs",
  "Farm Construction",
  "Land/Rent",
  "Security",
  "Insurance",
  "Licenses & Permits",
  "Communication",
  "Internet",
  "Marketing & Advertising",
  "Packaging",
  "Egg Trays",
  "Sacks & Bags",
  "Stationery",
  "Office Expenses",
  "Bank Charges",
  "Mobile Money Charges",
  "Professional Services",
  "Veterinary Consultation",
  "Waste Management",
  "Pest Control",
  "Depreciation",
  "Loan Interest",
  "Taxes",
  "Training",
  "Miscellaneous",
  "Other",
];

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "mobile", label: "Mobile Money" },
  { value: "bank", label: "Bank" },
  { value: "credit", label: "Credit" },
];

export const getToday = () => {
  return new Date().toISOString().slice(0, 10);
};

export const getInitialForm = () => ({
  date: getToday(),
  category: "Feed",
  description: "",
  amount: "",
  payment: "cash",
});