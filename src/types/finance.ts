export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export const DEFAULT_INCOME_CATEGORIES = [
  "Salary", "Freelance", "Investment", "Business", "Gift", "Other"
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Food", "Transport", "Housing", "Entertainment", "Shopping", "Health", "Education", "Bills", "Other"
];
