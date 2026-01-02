
import { User, Transaction, Product, AuditLog, TransactionStatus, UserStatus, ProductStatus } from '../types';

export const MOCK_USERS: User[] = [
  { 
    id: '1', 
    name: 'Manuel dos Santos', 
    phone: '923111222', 
    inviteCode: 'UNITEL99',
    balance: 1500.50, 
    totalBalance: 4500.50,
    status: UserStatus.ACTIVE, 
    totalInvested: 3000, 
    totalWithdrawn: 500, 
    totalDeposited: 2000,
    dailyIncome: 45.20,
    createdAt: '2023-10-01',
    canWithdraw: true,
    canDeposit: true,
    products: [
      { id: 'up1', name: 'Fundo Luanda 10%', purchaseDate: '2024-01-15', status: 'active' }
    ],
    bankAccount: {
      bankName: 'BAI - Banco Angolano de Investimentos',
      accountNumber: 'AO06.0001.0000.1234.5678.90',
      holderName: 'Manuel dos Santos',
      pixKey: '923111222'
    }
  },
  { 
    id: '2', 
    name: 'Rosa Benguela', 
    phone: '931444555', 
    inviteCode: 'AFRICEL22',
    balance: 50.00, 
    totalBalance: 150.00,
    status: UserStatus.ACTIVE, 
    totalInvested: 100, 
    totalWithdrawn: 50, 
    totalDeposited: 150,
    dailyIncome: 2.50,
    createdAt: '2023-10-05',
    canWithdraw: true,
    canDeposit: true,
    products: [],
    bankAccount: {
      bankName: 'BFA - Banco de Fomento Angola',
      accountNumber: 'AO06.0001.0000.9876.5432.10',
      holderName: 'Rosa Benguela',
      pixKey: 'rosa@angola.ao'
    }
  },
  { 
    id: '4', 
    name: 'António Luanda', 
    phone: '924777888', 
    inviteCode: 'KWANZA444',
    balance: 10200.00, 
    totalBalance: 25200.00,
    status: UserStatus.ACTIVE, 
    totalInvested: 15000, 
    totalWithdrawn: 4800, 
    totalDeposited: 15000,
    dailyIncome: 120.00,
    createdAt: '2023-12-01',
    canWithdraw: false,
    canDeposit: true,
    products: [
      { id: 'up2', name: 'Crypto Kwanza', purchaseDate: '2024-03-10', status: 'active' },
      { id: 'up3', name: 'Imobiliário Talatona', purchaseDate: '2023-12-05', status: 'expired' }
    ]
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', userId: '1', userName: 'Manuel dos Santos', userPhone: '923111222', amount: 500, status: TransactionStatus.PENDING, date: '2024-05-20 10:30', type: 'DEPOSIT', refCode: 'BAI-123' },
  { id: 't3', userId: '4', userName: 'António Luanda', userPhone: '924777888', amount: 2000, status: TransactionStatus.PENDING, date: '2024-05-21 09:15', type: 'WITHDRAWAL' },
  { id: 't6', userId: '1', userName: 'Manuel dos Santos', userPhone: '923111222', amount: 850, status: TransactionStatus.PENDING, date: '2024-05-22 08:00', type: 'WITHDRAWAL' },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Fundo Luanda 10%', category: 'Investimento', price: 1000, status: ProductStatus.ACTIVE, description: 'Rendimento focado em infraestrutura nacional.', createdAt: '2023-01-01' },
  { id: 'p2', name: 'Crypto Kwanza', category: 'Cripto', price: 500, status: ProductStatus.ACTIVE, description: 'Fundo arrojado de ativos digitais.', createdAt: '2023-05-15' },
];

export const MOCK_LOGS: AuditLog[] = [
  { id: 'l1', adminName: 'Admin Principal', action: 'Aprovação de Depósito', date: '2024-05-21 12:00', details: 'Aprovado depósito de 500 Kz para Manuel dos Santos' },
];

export const DASHBOARD_CHARTS = {
  userGrowth: [
    { name: 'Jan', users: 400 },
    { name: 'Fev', users: 600 },
    { name: 'Mar', users: 800 },
    { name: 'Abr', users: 1200 },
    { name: 'Mai', users: 1540 },
  ],
  financeData: [
    { name: 'Seg', deposits: 4000, withdrawals: 2400 },
    { name: 'Ter', deposits: 3000, withdrawals: 1398 },
    { name: 'Qua', deposits: 2000, withdrawals: 9800 },
    { name: 'Qui', deposits: 2780, withdrawals: 3908 },
    { name: 'Sex', deposits: 1890, withdrawals: 4800 },
    { name: 'Sáb', deposits: 2390, withdrawals: 3800 },
    { name: 'Dom', deposits: 3490, withdrawals: 4300 },
  ]
};
