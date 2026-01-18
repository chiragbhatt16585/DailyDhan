// src/database/migrateToSupabase.js
/**
 * Complete migration script to export all local SQLite data to Supabase
 * 
 * This script:
 * 1. Reads all data from local SQLite tables
 * 2. Maps old local IDs to new Supabase IDs
 * 3. Inserts data in the correct order (respecting foreign keys)
 * 4. Handles errors gracefully
 */

import { supabase } from '../config/supabase';
import { getDB } from './index';

/**
 * Main migration function - exports all local data to Supabase
 * @param {string} userId - Supabase user ID (from auth.users)
 * @returns {Object} Migration summary with counts
 */
export async function migrateAllDataToSupabase(userId) {
  console.log('🚀 Starting migration to Supabase for user:', userId);

  const db = await getDB();
  const summary = {
    categories: 0,
    wallets: 0,
    transactions: 0,
    budgets: 0,
    recurringTransactions: 0,
    errors: [],
  };

  // ID mapping: old local ID -> new Supabase ID
  const categoryIdMap = {}; // { oldLocalId: newSupabaseId }
  const walletIdMap = {};   // { oldLocalId: newSupabaseId }

  try {
    // ==================== STEP 1: MIGRATE CATEGORIES ====================
    console.log('📁 Step 1: Migrating categories...');
    const [categoriesResult] = await db.executeSql(
      'SELECT id, name, type, icon, color FROM categories ORDER BY id'
    );
    
    const categories = [];
    for (let i = 0; i < categoriesResult.rows.length; i += 1) {
      categories.push(categoriesResult.rows.item(i));
    }

    if (categories.length > 0) {
      // Insert categories one by one to get the new IDs back
      for (const cat of categories) {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: cat.name,
            type: cat.type,
            icon: cat.icon || null,
            color: cat.color || null,
          })
          .select('id')
          .single();

        if (error) {
          // If it's a duplicate (unique constraint), try to fetch existing
          if (error.code === '23505') {
            const { data: existing } = await supabase
              .from('categories')
              .select('id')
              .eq('user_id', userId)
              .eq('name', cat.name)
              .eq('type', cat.type)
              .single();
            
            if (existing) {
              categoryIdMap[cat.id] = existing.id;
              summary.categories += 1;
            } else {
              summary.errors.push(`Category ${cat.name}: ${error.message}`);
            }
          } else {
            summary.errors.push(`Category ${cat.name}: ${error.message}`);
          }
        } else if (data) {
          categoryIdMap[cat.id] = data.id;
          summary.categories += 1;
        }
      }
    }
    console.log(`✅ Migrated ${summary.categories} categories`);

    // ==================== STEP 2: MIGRATE WALLETS ====================
    console.log('💳 Step 2: Migrating wallets...');
    const [walletsResult] = await db.executeSql(
      'SELECT id, name, type, bank_name, last_4_digits, balance FROM wallets ORDER BY id'
    );
    
    const wallets = [];
    for (let i = 0; i < walletsResult.rows.length; i += 1) {
      wallets.push(walletsResult.rows.item(i));
    }

    if (wallets.length > 0) {
      for (const wallet of wallets) {
        const { data, error } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            name: wallet.name,
            type: wallet.type || 'cash',
            bank_name: wallet.bank_name || null,
            last_4_digits: wallet.last_4_digits || null,
            balance: wallet.balance || 0,
          })
          .select('id')
          .single();

        if (error) {
          summary.errors.push(`Wallet ${wallet.name}: ${error.message}`);
        } else if (data) {
          walletIdMap[wallet.id] = data.id;
          summary.wallets += 1;
        }
      }
    }
    console.log(`✅ Migrated ${summary.wallets} wallets`);

    // ==================== STEP 3: MIGRATE TRANSACTIONS ====================
    console.log('💰 Step 3: Migrating transactions...');
    const [transactionsResult] = await db.executeSql(
      'SELECT id, amount, type, category_id, wallet_id, date, note, attachment FROM transactions ORDER BY id'
    );
    
    const transactions = [];
    for (let i = 0; i < transactionsResult.rows.length; i += 1) {
      transactions.push(transactionsResult.rows.item(i));
    }

    if (transactions.length > 0) {
      // Batch insert transactions (Supabase allows up to 1000 per batch)
      const batchSize = 500;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        const payload = batch.map(t => ({
          user_id: userId,
          amount: t.amount,
          type: t.type,
          category_id: t.category_id ? categoryIdMap[t.category_id] || null : null,
          wallet_id: t.wallet_id ? walletIdMap[t.wallet_id] || null : null,
          date: t.date || null,
          note: t.note || null,
          attachment: t.attachment || null,
        }));

        const { error } = await supabase
          .from('transactions')
          .insert(payload);

        if (error) {
          summary.errors.push(`Transactions batch ${i / batchSize + 1}: ${error.message}`);
        } else {
          summary.transactions += batch.length;
        }
      }
    }
    console.log(`✅ Migrated ${summary.transactions} transactions`);

    // ==================== STEP 4: MIGRATE BUDGETS ====================
    console.log('📊 Step 4: Migrating budgets...');
    const [budgetsResult] = await db.executeSql(
      'SELECT id, category_id, amount, period, year, month FROM budgets ORDER BY id'
    );
    
    const budgets = [];
    for (let i = 0; i < budgetsResult.rows.length; i += 1) {
      budgets.push(budgetsResult.rows.item(i));
    }

    if (budgets.length > 0) {
      for (const budget of budgets) {
        const newCategoryId = categoryIdMap[budget.category_id];
        if (!newCategoryId) {
          summary.errors.push(`Budget: Category ID ${budget.category_id} not found in mapping`);
          continue;
        }

        const { error } = await supabase
          .from('budgets')
          .insert({
            user_id: userId,
            category_id: newCategoryId,
            amount: budget.amount,
            period: budget.period,
            year: budget.year,
            month: budget.month || null,
          });

        if (error) {
          // If duplicate, that's okay (unique constraint)
          if (error.code !== '23505') {
            summary.errors.push(`Budget: ${error.message}`);
          } else {
            summary.budgets += 1; // Count as migrated even if duplicate
          }
        } else {
          summary.budgets += 1;
        }
      }
    }
    console.log(`✅ Migrated ${summary.budgets} budgets`);

    // ==================== STEP 5: MIGRATE RECURRING TRANSACTIONS ====================
    console.log('🔄 Step 5: Migrating recurring transactions...');
    const [recurringResult] = await db.executeSql(
      'SELECT id, amount, type, category_id, wallet_id, frequency, start_date, next_due_date, note, is_active, last_created_date FROM recurring_transactions ORDER BY id'
    );
    
    const recurringTransactions = [];
    for (let i = 0; i < recurringResult.rows.length; i += 1) {
      recurringTransactions.push(recurringResult.rows.item(i));
    }

    if (recurringTransactions.length > 0) {
      for (const recurring of recurringTransactions) {
        const { error } = await supabase
          .from('recurring_transactions')
          .insert({
            user_id: userId,
            amount: recurring.amount,
            type: recurring.type,
            category_id: recurring.category_id ? categoryIdMap[recurring.category_id] || null : null,
            wallet_id: recurring.wallet_id ? walletIdMap[recurring.wallet_id] || null : null,
            frequency: recurring.frequency,
            start_date: recurring.start_date,
            next_due_date: recurring.next_due_date,
            note: recurring.note || null,
            is_active: recurring.is_active === 1 || recurring.is_active === true,
            last_created_date: recurring.last_created_date || null,
          });

        if (error) {
          summary.errors.push(`Recurring transaction: ${error.message}`);
        } else {
          summary.recurringTransactions += 1;
        }
      }
    }
    console.log(`✅ Migrated ${summary.recurringTransactions} recurring transactions`);

    console.log('🎉 Migration completed!');
    console.log('Summary:', summary);

    return summary;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    summary.errors.push(`Fatal error: ${error.message}`);
    throw error;
  }
}

/**
 * Check if migration has already been completed for this user
 * @param {string} userId - Supabase user ID
 * @returns {boolean} True if user already has data in Supabase
 */
export async function hasMigratedData(userId) {
  try {
    const { count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .limit(1);

    return count > 0;
  } catch (error) {
    console.warn('Error checking migration status:', error);
    return false;
  }
}

