import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

let db = null;
let isInitialized = false;

const getDb = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('khata.db');
  }
  return db;
};

const parseItemsJson = (value) => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const rowToCustomer = (row) => ({
  id: Number(row.id),
  name: row.name,
  phone: row.phone,
  total_balance: Number(row.total_balance) || 0,
  loan_date: row.loan_date || '',
  due_date: row.due_date || '',
  items: parseItemsJson(row.items_json),
  last_cleared_balance: Number(row.last_cleared_balance) || 0,
  cleared_on: row.cleared_on || '',
});

export const initDB = async () => {
  if (isInitialized) {
    return true;
  }

  const database = await getDb();
  await database.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      total_balance REAL NOT NULL DEFAULT 0,
      loan_date TEXT,
      due_date TEXT,
      items_json TEXT NOT NULL DEFAULT '[]',
      last_cleared_balance REAL NOT NULL DEFAULT 0,
      cleared_on TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_session (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      user_id INTEGER,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  isInitialized = true;
  return true;
};

export const getCustomers = async () => {
  await initDB();
  const database = await getDb();
  const rows = await database.getAllAsync('SELECT * FROM customers ORDER BY id DESC');
  return rows.map(rowToCustomer);
};

const dateToIso = (dateValue) => {
  if (!dateValue) {
    return '';
  }

  const parts = dateValue.trim().split('-');
  if (parts.length !== 3) {
    return '';
  }

  const [year, month, day] = parts;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

export const addCustomer = async (
  name,
  phone,
  openingBalance = 0,
  loanDate = '',
  dueDate = '',
  items = []
) => {
  await initDB();
  const database = await getDb();

  const result = await database.runAsync(
    `INSERT INTO customers
      (name, phone, total_balance, loan_date, due_date, items_json, last_cleared_balance, cleared_on)
      VALUES (?, ?, ?, ?, ?, ?, 0, '')`,
    name.trim(),
    phone.trim(),
    Number(openingBalance) || 0,
    dateToIso(loanDate),
    dateToIso(dueDate),
    JSON.stringify(Array.isArray(items) ? items : [])
  );

  const insertedId = Number(result.lastInsertRowId);
  const row = await database.getFirstAsync('SELECT * FROM customers WHERE id = ?', insertedId);
  return row ? rowToCustomer(row) : null;
};

export const updateCustomer = async (
  customerId,
  name,
  phone,
  totalBalance,
  loanDate = '',
  dueDate = '',
  items = []
) => {
  await initDB();
  const database = await getDb();

  const result = await database.runAsync(
    `UPDATE customers
     SET name = ?,
         phone = ?,
         total_balance = ?,
         loan_date = ?,
         due_date = ?,
         items_json = ?,
         last_cleared_balance = CASE WHEN ? > 0 THEN 0 ELSE last_cleared_balance END,
         cleared_on = CASE WHEN ? > 0 THEN '' ELSE cleared_on END
     WHERE id = ?`,
    name.trim(),
    phone.trim(),
    Number(totalBalance) || 0,
    dateToIso(loanDate),
    dateToIso(dueDate),
    JSON.stringify(Array.isArray(items) ? items : []),
    Number(totalBalance) || 0,
    Number(totalBalance) || 0,
    customerId
  );

  if (!result.changes) {
    return false;
  }
  return true;
};

export const addTransaction = async (customerId, amount, type, date) => {
  await initDB();
  const database = await getDb();
  const numericAmount = Number(amount) || 0;

  await database.runAsync(
    'INSERT INTO transactions (customer_id, amount, type, date) VALUES (?, ?, ?, ?)',
    customerId,
    numericAmount,
    type,
    date
  );

  if (type === 'given') {
    await database.runAsync(
      'UPDATE customers SET total_balance = total_balance + ? WHERE id = ?',
      numericAmount,
      customerId
    );
  } else if (type === 'received') {
    await database.runAsync(
      'UPDATE customers SET total_balance = total_balance - ? WHERE id = ?',
      numericAmount,
      customerId
    );
  }

  const row = await database.getFirstAsync(
    'SELECT id FROM transactions WHERE customer_id = ? ORDER BY id DESC LIMIT 1',
    customerId
  );
  return row ? Number(row.id) : null;
};

export const getTransactions = async (customerId) => {
  await initDB();
  const database = await getDb();
  const rows = await database.getAllAsync(
    'SELECT * FROM transactions WHERE customer_id = ? ORDER BY id DESC',
    customerId
  );
  return rows.map((item) => ({
    id: Number(item.id),
    customer_id: Number(item.customer_id),
    amount: Number(item.amount) || 0,
    type: item.type,
    date: item.date,
  }));
};

export const deleteCustomer = async (customerId) => {
  await initDB();
  const database = await getDb();
  const result = await database.runAsync('DELETE FROM customers WHERE id = ?', customerId);
  if (!result.changes) {
    return false;
  }
  return true;
};

export const markCustomerAsDone = async (customerId) => {
  await initDB();
  const database = await getDb();
  const result = await database.runAsync(
    `UPDATE customers
     SET last_cleared_balance = total_balance,
         total_balance = 0,
         cleared_on = ?
     WHERE id = ?`,
    new Date().toISOString().split('T')[0],
    customerId
  );

  if (!result.changes) {
    return false;
  }
  return true;
};

export const markCustomerAsPending = async (customerId) => {
  await initDB();
  const database = await getDb();
  const customer = await database.getFirstAsync(
    'SELECT last_cleared_balance FROM customers WHERE id = ?',
    customerId
  );

  if (!customer) {
    return false;
  }

  const restoreBalance = Number(customer.last_cleared_balance) || 0;
  if (restoreBalance <= 0) {
    return false;
  }

  await database.runAsync(
    `UPDATE customers
     SET total_balance = ?,
         last_cleared_balance = 0,
         cleared_on = ''
     WHERE id = ?`,
    restoreBalance,
    customerId
  );

  return true;
};

export const getCustomersDueTomorrow = async () => {
  const allCustomers = await getCustomers();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dueTomorrow = tomorrow.toISOString().split('T')[0];

  return allCustomers.filter(
    (item) => item.due_date === dueTomorrow && Number(item.total_balance) > 0
  );
};

export const getAllTransactions = async () => {
  await initDB();
  const database = await getDb();
  const rows = await database.getAllAsync('SELECT * FROM transactions ORDER BY id DESC');
  return rows.map((item) => ({
    id: Number(item.id),
    customer_id: Number(item.customer_id),
    amount: Number(item.amount) || 0,
    type: item.type,
    date: item.date,
  }));
};

export const exportDatabaseSnapshot = async () => {
  const customersData = await getCustomers();
  const transactionsData = await getAllTransactions();

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    customers: customersData,
    transactions: transactionsData,
  };
};

export const importDatabaseSnapshot = async (snapshot) => {
  if (!snapshot || !Array.isArray(snapshot.customers) || !Array.isArray(snapshot.transactions)) {
    return false;
  }

  await initDB();
  const database = await getDb();

  await database.execAsync('BEGIN');
  try {
    await database.execAsync('DELETE FROM transactions; DELETE FROM customers;');

    for (const customer of snapshot.customers) {
      await database.runAsync(
        `INSERT INTO customers
          (id, name, phone, total_balance, loan_date, due_date, items_json, last_cleared_balance, cleared_on)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        Number(customer.id),
        customer.name || '',
        customer.phone || '',
        Number(customer.total_balance) || 0,
        customer.loan_date || '',
        customer.due_date || '',
        JSON.stringify(Array.isArray(customer.items) ? customer.items : []),
        Number(customer.last_cleared_balance) || 0,
        customer.cleared_on || ''
      );
    }

    for (const transaction of snapshot.transactions) {
      await database.runAsync(
        `INSERT INTO transactions
          (id, customer_id, amount, type, date)
          VALUES (?, ?, ?, ?, ?)`,
        Number(transaction.id),
        Number(transaction.customer_id),
        Number(transaction.amount) || 0,
        transaction.type || 'given',
        transaction.date || ''
      );
    }

    await database.execAsync('COMMIT');
    return true;
  } catch (error) {
    await database.execAsync('ROLLBACK');
    throw error;
  }
};

const hashPassword = async (plainPassword) => {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    plainPassword
  );
};

const setSessionUser = async (userId) => {
  await initDB();
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO app_session (id, user_id, updated_at)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       user_id = excluded.user_id,
       updated_at = excluded.updated_at`,
    userId,
    new Date().toISOString()
  );
};

export const getCurrentSessionUser = async () => {
  await initDB();
  const database = await getDb();
  const row = await database.getFirstAsync(
    `SELECT u.id, u.name, u.email
     FROM app_session s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.id = 1`
  );

  if (!row || !row.id) {
    return null;
  }

  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
  };
};

export const registerShopkeeper = async (name, email, password) => {
  await initDB();
  const database = await getDb();

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await database.getFirstAsync(
    'SELECT id FROM users WHERE email = ?',
    normalizedEmail
  );
  if (existing?.id) {
    return { ok: false, error: 'Email already registered.' };
  }

  const passwordHash = await hashPassword(password);
  const result = await database.runAsync(
    'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
    name.trim(),
    normalizedEmail,
    passwordHash,
    new Date().toISOString()
  );

  const userId = Number(result.lastInsertRowId);
  await setSessionUser(userId);

  return {
    ok: true,
    user: {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
    },
  };
};

export const signInShopkeeper = async (email, password) => {
  await initDB();
  const database = await getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const row = await database.getFirstAsync(
    'SELECT id, name, email, password_hash FROM users WHERE email = ?',
    normalizedEmail
  );
  if (!row) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  const passwordHash = await hashPassword(password);
  if (passwordHash !== row.password_hash) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  await setSessionUser(Number(row.id));

  return {
    ok: true,
    user: {
      id: Number(row.id),
      name: row.name,
      email: row.email,
    },
  };
};

export const signOutShopkeeper = async () => {
  await setSessionUser(null);
  return true;
};

export const resetPasswordByEmail = async (email, newPassword) => {
  await initDB();
  const database = await getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await database.getFirstAsync(
    'SELECT id FROM users WHERE email = ?',
    normalizedEmail
  );
  if (!existing?.id) {
    return { ok: false, error: 'No account found for this email.' };
  }

  const passwordHash = await hashPassword(newPassword);
  await database.runAsync(
    'UPDATE users SET password_hash = ? WHERE email = ?',
    passwordHash,
    normalizedEmail
  );

  return { ok: true };
};