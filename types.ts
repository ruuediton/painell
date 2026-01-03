
export enum TransactionStatus {
  PENDING = 'pendente',
  RECHARGED = 'recarregado',
  REJECTED = 'rejeitado'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
  SUSPENDED = 'SUSPENDED'
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface UserProduct {
  id: string;
  name: string;
  purchaseDate: string;
  status: 'active' | 'expired' | 'pending';
  dailyIncome?: number;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  holderName: string;
  pixKey?: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  inviteCode: string;
  balance: number;
  totalBalance: number;
  status: UserStatus;
  totalInvested: number;
  totalWithdrawn: number;
  totalDeposited: number;
  dailyIncome: number;
  createdAt: string;
  canWithdraw: boolean;
  canDeposit: boolean;
  products: UserProduct[];
  bankAccount?: BankAccount;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  status: TransactionStatus;
  date: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  reason?: string;
  refCode?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  status: ProductStatus;
  description: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  date: string;
  details: string;
}

export interface BonusCode {
  id: string;
  code: string;
  value: number;
  expiryDate: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'SYSTEM';
  timestamp: Date;
  read: boolean;
}

export type Page = 'dashboard' | 'users' | 'user-detail' | 'deposits' | 'withdrawals' | 'bonus' | 'logs' | 'settings' | 'login' | '2fa' | 'products' | 'suporte';
