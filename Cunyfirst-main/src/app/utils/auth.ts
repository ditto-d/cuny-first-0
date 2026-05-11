// Authentication utility functions for the Course Registration System

export interface Account {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "student" | "instructor" | "registrar";
  studentId?: string;
  createdAt: string;
}

const ACCOUNTS_KEY = "cunyfirst_accounts";

// Initialize with default demo accounts
export const initializeDefaultAccounts = () => {
  try {
    const existingAccountsJson = localStorage.getItem(ACCOUNTS_KEY);
    const existingAccounts = existingAccountsJson ? JSON.parse(existingAccountsJson) : [];

    // Always ensure demo accounts exist
    if (!existingAccounts || existingAccounts.length === 0) {
      const defaultAccounts: Account[] = [
        {
          username: "student",
          password: "student123",
          email: "student@cuny.edu",
          firstName: "Demo",
          lastName: "Student",
          role: "student",
          studentId: "12345678",
          createdAt: new Date().toISOString(),
        },
        {
          username: "instructor",
          password: "instructor123",
          email: "instructor@cuny.edu",
          firstName: "Demo",
          lastName: "Instructor",
          role: "instructor",
          createdAt: new Date().toISOString(),
        },
        {
          username: "registrar",
          password: "registrar123",
          email: "registrar@cuny.edu",
          firstName: "Demo",
          lastName: "Registrar",
          role: "registrar",
          createdAt: new Date().toISOString(),
        },
      ];

      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(defaultAccounts));
      console.log("✅ Demo accounts initialized:", defaultAccounts);
      return defaultAccounts;
    }

    console.log("✅ Existing accounts found:", existingAccounts);
    return existingAccounts;
  } catch (error) {
    console.error("❌ Error initializing accounts:", error);
    return [];
  }
};

// Get all accounts from localStorage
export const getAccounts = (): Account[] => {
  const accountsJson = localStorage.getItem(ACCOUNTS_KEY);
  return accountsJson ? JSON.parse(accountsJson) : [];
};

// Save accounts to localStorage
const saveAccounts = (accounts: Account[]) => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

// Check if username already exists
export const usernameExists = (username: string): boolean => {
  const accounts = getAccounts();
  return accounts.some(acc => acc.username.toLowerCase() === username.toLowerCase());
};

// Check if email already exists
export const emailExists = (email: string): boolean => {
  const accounts = getAccounts();
  return accounts.some(acc => acc.email.toLowerCase() === email.toLowerCase());
};

// Validate login credentials
export const validateLogin = (username: string, password: string): {
  success: boolean;
  message: string;
  account?: Account;
} => {
  if (!username || !password) {
    return { success: false, message: "Please enter both username and password" };
  }

  // Ensure accounts are initialized
  initializeDefaultAccounts();

  const accounts = getAccounts();
  console.log("📋 Available accounts:", accounts.map(a => a.username));
  console.log("🔍 Looking for:", username);

  const account = accounts.find(acc => acc.username.toLowerCase() === username.toLowerCase());

  if (!account) {
    console.log("❌ Account not found for username:", username);
    return {
      success: false,
      message: "Account not found. Please create an account first."
    };
  }

  console.log("✅ Account found:", account.username);
  console.log("🔑 Password check - Input:", password, "Stored:", account.password);

  if (account.password !== password) {
    console.log("❌ Password mismatch");
    return {
      success: false,
      message: "Invalid password. Please try again."
    };
  }

  console.log("✅ Login successful!");
  return { success: true, message: "Login successful", account };
};

// Create a new account
export const createAccount = (accountData: Omit<Account, "createdAt">): {
  success: boolean;
  message: string;
} => {
  // Check if username already exists
  if (usernameExists(accountData.username)) {
    return { success: false, message: "Username already exists. Please choose a different username." };
  }

  // Check if email already exists
  if (emailExists(accountData.email)) {
    return { success: false, message: "Email already registered. Please use a different email or sign in." };
  }

  const accounts = getAccounts();
  const newAccount: Account = {
    ...accountData,
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  saveAccounts(accounts);

  return { success: true, message: "Account created successfully!" };
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate university email (must end with @cuny.edu)
export const isValidUniversityEmail = (email: string): boolean => {
  return email.toLowerCase().endsWith("@cuny.edu");
};

// Validate password strength
export const validatePassword = (password: string): {
  valid: boolean;
  message: string;
} => {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }

  return { valid: true, message: "Password is strong" };
};

// Get account by username
export const getAccountByUsername = (username: string): Account | null => {
  const accounts = getAccounts();
  return accounts.find(acc => acc.username.toLowerCase() === username.toLowerCase()) || null;
};
