import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let dbInstance = null;

// Shared default categories so we can safely re-use them
const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', type: 'income', icon: 'cash-multiple', color: '#34A853' },
  { name: 'Freelance', type: 'income', icon: 'briefcase', color: '#1A73E8' },
  { name: 'Investment', type: 'income', icon: 'chart-line', color: '#4CAF50' },
  { name: 'Gift', type: 'income', icon: 'gift', color: '#E91E63' },
  { name: 'Business', type: 'income', icon: 'store', color: '#FB8C00' },
  { name: 'Other Income', type: 'income', icon: 'wallet', color: '#9C27B0' },
];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', type: 'expense', icon: 'food-fork-drink', color: '#F4B400' },
  { name: 'Transportation', type: 'expense', icon: 'car', color: '#1A73E8' },
  { name: 'Shopping', type: 'expense', icon: 'shopping', color: '#E91E63' },
  { name: 'Bills & Utilities', type: 'expense', icon: 'file-invoice-dollar', color: '#FF9800' },
  { name: 'Entertainment', type: 'expense', icon: 'movie', color: '#9C27B0' },
  { name: 'Healthcare', type: 'expense', icon: 'medical-bag', color: '#E91E63' },
  { name: 'Education', type: 'expense', icon: 'school', color: '#3F51B5' },
  { name: 'Travel', type: 'expense', icon: 'airplane', color: '#00BCD4' },
  { name: 'Groceries', type: 'expense', icon: 'cart', color: '#4CAF50' },
  { name: 'Rent', type: 'expense', icon: 'home', color: '#795548' },
  { name: 'Insurance', type: 'expense', icon: 'shield-check', color: '#607D8B' },
  { name: 'Personal Care', type: 'expense', icon: 'account', color: '#FF5722' },
  { name: 'Subscriptions', type: 'expense', icon: 'credit-card', color: '#009688' },
  { name: 'Other Expense', type: 'expense', icon: 'dots-horizontal', color: '#9E9E9E' },
];

export const getDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await SQLite.openDatabase({
    name: 'dailydhan.db',
    location: 'default',
  });

  // 1) Make sure schema exists
  await initSchema(dbInstance);
  // 1.5) Clean up any old duplicates just in case
  await removeDuplicateCategories(dbInstance);
  // 2) Upsert defaults without duplicates
  await initDefaultCategories(dbInstance);
  // 3) Absolute safety net: if somehow still empty, insert everything
  await ensureDefaultCategoriesIfEmpty(dbInstance);
  // 4) Fix any missing colors / icons for existing rows
  await assignColorsToCategories(dbInstance);
  await assignIconsToCategories(dbInstance);

  return dbInstance;
};

// Remove duplicate categories keeping the oldest id per (name, type)
const removeDuplicateCategories = async db => {
  try {
    await db.executeSql(
      `
        DELETE FROM categories
        WHERE id NOT IN (
          SELECT MIN(id) FROM categories GROUP BY name, type
        );
      `,
    );
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to remove duplicate categories', e);
  }
};

// Initialize / upsert default categories on first launch
const initDefaultCategories = async db => {
  try {
    const allCategories = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];

    await db.transaction(async tx => {
      for (const category of allCategories) {
        // Check if category already exists before inserting
        const [existing] = await tx.executeSql(
          'SELECT id, icon, color FROM categories WHERE name = ? AND type = ? LIMIT 1',
          [category.name, category.type],
        );

        if (existing.rows.length === 0) {
          // Insert new category if it doesn't exist
          await tx.executeSql(
            'INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)',
            [category.name, category.type, category.icon, category.color],
          );
        } else {
          // Update existing category if it's missing icon or color
          const existingCategory = existing.rows.item(0);
          const needsUpdate =
            !existingCategory.icon ||
            !existingCategory.color ||
            existingCategory.icon === '' ||
            existingCategory.color === '';

          if (needsUpdate) {
            const updateIcon =
              existingCategory.icon && existingCategory.icon !== ''
                ? existingCategory.icon
                : category.icon;
            const updateColor =
              existingCategory.color && existingCategory.color !== ''
                ? existingCategory.color
                : category.color;

            await tx.executeSql('UPDATE categories SET icon = ?, color = ? WHERE id = ?', [
              updateIcon,
              updateColor,
              existingCategory.id,
            ]);
          }
        }
      }
    });

    // eslint-disable-next-line no-console
    console.log('✅ Default categories initialized/updated');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to initialize default categories', e);
  }
};

// Extra safety: if table is completely empty, insert all defaults
const ensureDefaultCategoriesIfEmpty = async db => {
  try {
    const [result] = await db.executeSql('SELECT COUNT(*) as count FROM categories');
    const count = result.rows.item(0)?.count ?? 0;

    if (count > 0) {
      return;
    }

    const allCategories = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];

    for (const category of allCategories) {
      await db.executeSql(
        'INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)',
        [category.name, category.type, category.icon, category.color],
      );
    }

    // eslint-disable-next-line no-console
    console.log('✅ Default categories inserted because table was empty');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to ensure default categories when table is empty', e);
  }
};

// Assign distinct colors to categories that don't have colors
const assignColorsToCategories = async db => {
  const colorPalette = [
    '#1A73E8', // Blue
    '#F4B400', // Gold
    '#34A853', // Green
    '#E91E63', // Pink
    '#FB8C00', // Orange
    '#9C27B0', // Purple
    '#00BCD4', // Cyan
    '#FF5722', // Deep Orange
    '#795548', // Brown
    '#607D8B', // Blue Grey
    '#4CAF50', // Light Green
    '#FF9800', // Amber
    '#3F51B5', // Indigo
    '#009688', // Teal
    '#CDDC39', // Lime
  ];

  try {
    // Get all categories without colors
    const [result] = await db.executeSql(
      'SELECT id, name FROM categories WHERE color IS NULL OR color = "" ORDER BY id ASC',
    );
    
    const rows = [];
    for (let i = 0; i < result.rows.length; i += 1) {
      rows.push(result.rows.item(i));
    }

    // Assign colors to categories without colors
    for (let i = 0; i < rows.length; i += 1) {
      const category = rows[i];
      const colorIndex = category.id % colorPalette.length;
      const assignedColor = colorPalette[colorIndex];
      
      await db.executeSql('UPDATE categories SET color = ? WHERE id = ?', [
        assignedColor,
        category.id,
      ]);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to assign colors to categories', e);
  }
};

// Assign default icons to categories that don't have icons
const assignIconsToCategories = async db => {
  // Default icon mapping based on category name and type
  const defaultIconMap = {
    // Income icons
    'salary': 'cash-multiple',
    'freelance': 'briefcase',
    'investment': 'chart-line',
    'gift': 'gift',
    'business': 'store',
    'other income': 'wallet',
    // Expense icons
    'food & dining': 'food-fork-drink',
    'transportation': 'car',
    'shopping': 'shopping',
    'bills & utilities': 'file-invoice-dollar',
    'entertainment': 'movie',
    'healthcare': 'medical-bag',
    'education': 'school',
    'travel': 'airplane',
    'groceries': 'cart',
    'rent': 'home',
    'insurance': 'shield-check',
    'personal care': 'account',
    'subscriptions': 'credit-card',
    'other expense': 'dots-horizontal',
  };

  try {
    // Get all categories without icons
    const [result] = await db.executeSql(
      'SELECT id, name, type FROM categories WHERE icon IS NULL OR icon = "" ORDER BY id ASC',
    );
    
    const rows = [];
    for (let i = 0; i < result.rows.length; i += 1) {
      rows.push(result.rows.item(i));
    }

    // Assign icons to categories without icons
    for (let i = 0; i < rows.length; i += 1) {
      const category = rows[i];
      const categoryNameLower = category.name.toLowerCase().trim();
      
      // Try to find matching icon from default map
      let assignedIcon = defaultIconMap[categoryNameLower];
      
      // If no match found, assign default icon based on type
      if (!assignedIcon) {
        assignedIcon = category.type === 'income' ? 'wallet' : 'dots-horizontal';
      }
      
      await db.executeSql('UPDATE categories SET icon = ? WHERE id = ?', [
        assignedIcon,
        category.id,
      ]);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Failed to assign icons to categories', e);
  }
};

export const getMonthlySummary = async (year, month) => {
  const db = await getDB();
  // month is 1-12
  const monthStr = String(month).padStart(2, '0');
  const start = `${year}-${monthStr}-01`;
  const end = `${year}-${monthStr}-31`;

  const [result] = await db.executeSql(
    `
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
      FROM transactions
      WHERE date >= ? AND date <= ?
    `,
    [start, end],
  );

  const row = result.rows.length > 0 ? result.rows.item(0) : {};

  const income = row.income || 0;
  const expense = row.expense || 0;

  return {
    income,
    expense,
    balance: income - expense,
  };
};

// Get monthly income and expense data for multiple months (for line chart)
export const getMonthlyIncomeExpenseData = async (numberOfMonths = 6) => {
  const db = await getDB();
  const data = [];
  const currentDate = new Date();
  
  for (let i = numberOfMonths - 1; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthStr = String(month).padStart(2, '0');
    const start = `${year}-${monthStr}-01`;
    const end = `${year}-${monthStr}-31`;

    try {
      const [result] = await db.executeSql(
        `
          SELECT
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
          FROM transactions
          WHERE date >= ? AND date <= ?
        `,
        [start, end],
      );

      const row = result.rows.length > 0 ? result.rows.item(0) : {};
      const income = row.income || 0;
      const expense = row.expense || 0;

      data.push({
        month: month,
        year: year,
        monthName: date.toLocaleString('default', { month: 'short' }),
        income: income,
        expense: expense,
      });
    } catch (e) {
      console.warn(`Failed to load data for ${year}-${month}`, e);
      data.push({
        month: month,
        year: year,
        monthName: date.toLocaleString('default', { month: 'short' }),
        income: 0,
        expense: 0,
      });
    }
  }

  return data;
};

export const getExpenseBreakdownByCategory = async (year, month) => {
  const db = await getDB();
  const monthStr = String(month).padStart(2, '0');
  const monthStart = `${year}-${monthStr}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonthStr = String(nextMonth).padStart(2, '0');
  const monthEnd = `${nextYear}-${nextMonthStr}-01`;

  const [result] = await db.executeSql(
    `
      SELECT 
        c.id,
        c.name,
        c.color,
        c.icon,
        COALESCE(SUM(t.amount), 0) AS total_amount
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id 
        AND t.type = 'expense'
        AND t.date >= ? AND t.date < ?
      WHERE c.type = 'expense'
      GROUP BY c.id, c.name, c.color, c.icon
      HAVING total_amount > 0
      ORDER BY total_amount DESC
    `,
    [monthStart, monthEnd],
  );

  const rows = [];
  for (let i = 0; i < result.rows.length; i += 1) {
    rows.push(result.rows.item(i));
  }
  return rows;
};

const initSchema = async db => {
  const schema = `
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      balance REAL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT,
      color TEXT
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category_id INTEGER,
      wallet_id INTEGER,
      date TEXT,
      note TEXT,
      attachment TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (wallet_id) REFERENCES wallets(id)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_type
      ON categories(name, type);
  `;

  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  await db.transaction(tx => {
    statements.forEach(stmt => {
      tx.executeSql(stmt + ';');
    });
  });
};


