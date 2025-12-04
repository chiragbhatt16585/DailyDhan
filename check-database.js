// Quick script to verify database data
// Run this in your React Native app console or add to a screen temporarily

import { getDB } from './src/database';

const checkDatabase = async () => {
  try {
    const db = await getDB();
    
    // Check transactions
    const [transactionsResult] = await db.executeSql('SELECT COUNT(*) as count FROM transactions');
    const transactionCount = transactionsResult.rows.item(0).count;
    
    // Check categories
    const [categoriesResult] = await db.executeSql('SELECT COUNT(*) as count FROM categories');
    const categoryCount = categoriesResult.rows.item(0).count;
    
    // Check wallets
    const [walletsResult] = await db.executeSql('SELECT COUNT(*) as count FROM wallets');
    const walletCount = walletsResult.rows.item(0).count;
    
    // Get recent transactions
    const [recentResult] = await db.executeSql(
      'SELECT id, type, amount, date, note FROM transactions ORDER BY date DESC LIMIT 5'
    );
    const recentTransactions = [];
    for (let i = 0; i < recentResult.rows.length; i++) {
      recentTransactions.push(recentResult.rows.item(i));
    }
    
    console.log('=== DATABASE VERIFICATION ===');
    console.log(`Total Transactions: ${transactionCount}`);
    console.log(`Total Categories: ${categoryCount}`);
    console.log(`Total Wallets: ${walletCount}`);
    console.log('\nRecent Transactions:');
    recentTransactions.forEach(t => {
      console.log(`- ${t.type}: ₹${t.amount} on ${t.date}${t.note ? ` (${t.note})` : ''}`);
    });
    console.log('===========================');
    
    return {
      transactionCount,
      categoryCount,
      walletCount,
      recentTransactions,
    };
  } catch (error) {
    console.error('Error checking database:', error);
    return null;
  }
};

export default checkDatabase;

