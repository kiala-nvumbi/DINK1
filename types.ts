
export interface Company {
  id: string;
  name: string;
  nif: string;
}

export interface Profile {
  id: string;
  name: string;
  username: string;
  userCode: string;
  role: string;
  email: string;
  status: 'active' | 'inactive';
  companyIds: string[]; // Associated companies
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'debit' | 'credit' | 'mixed';
  parentId?: string;
  isSystem?: boolean;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  lines: JournalEntryLine[];
  attachments?: string[];
  year: number;
}
