export type TransactionType = 'pemasukan' | 'pengeluaran';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
  date: string;
  time?: string;
  photo?: string;
}

export type Role = 'Owner' | 'Member' | 'Viewer';

export interface FamilyMember {
  id: string;
  name: string;
  role: Role;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt?: string;
}

export interface AppEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  location: string;
}
