export interface Roommate {
  slot: number; // 1..N
  name: string | null;
  room: string | null;
  registered: boolean;
  pin?: string | null;
  active?: boolean;
}

export type Category =
  | 'Groceries'
  | 'Utilities'
  | 'Rent'
  | 'Cleaning'
  | 'Supplies'
  | 'Food'
  | 'Transport'
  | 'Other';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: Category;
  payer_slot: number;
  participants: number[]; // slots that share the cost
  created_at: string; // ISO
}

export interface Settlement {
  id: string;
  from_slot: number;
  to_slot: number;
  amount: number;
  created_at: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  added_by: number;
  created_at: string;
  checked: boolean;
}

export const CATEGORIES: Category[] = [
  'Groceries',
  'Utilities',
  'Rent',
  'Cleaning',
  'Supplies',
  'Food',
  'Transport',
  'Other',
];
