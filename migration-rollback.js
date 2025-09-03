#!/usr/bin/env node

/**
 * Supabase User Migration - Rollback Script
 * 
 * This script provides rollback functionality to undo the migration
 * by removing imported data from the new project.
 * 
 * WARNING: This script will DELETE data from the new project!
 * Only use this if you need to undo the migration.
 * 
 * Usage: node migration-rollback.js <migration-data-directory> [--confirm]
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// NEW PROJECT CONFIGURATION
const NEW_PROJECT_URL = 'https://lflxrkkzudsecvdfdxwl.supabase.co';
const NEW_PROJECT_SERVICE_KEY = 'sb_secret_A22qw961Z_bCCcMwnnxWZw_t7xleJt_';

// Create Supabase client for new project
const newSupabase = createClient(NEW_PROJECT_URL, NEW_PROJECT_SERVICE_KEY);

// Rollback tracking
const rollbackLog = {
  startTime: new Date().toISOString(),
  endTime: null,
  status: 'running',
  errors: [],
  warnings: [],
  stats: {
    usersDeleted: 0,
    profilesDeleted: 0,
    leaguesDeleted: 0,
    betsDeleted: 0,
    betSelectionsDeleted: 0,
    weeklyPerformanceDeleted: 0,
    newsDeleted: 0,
    matchResultsDeleted: 0,
    matchOddsCacheDeleted: 0
  }
};

// User mapping for rollback
let userMapping = {};

/**
 * Load migration data and user mapping
 */
async function loadMigrationData(migrationDir) {
  console.log(`📂 Loading migration data from: ${migrationDir}`);
  
  try {
    // Load user mapping
    const userMappingPath = path.join(migrationDir, 'user-mapping.json');
    const userMappingContent = await fs.readFile(userMappingPath, 'utf8');
    userMapping = JSON.parse(userMappingContent);
    
    console.log('✅ Migration data loaded successfully');
    return userMapping;
    
  } catch (error) {
    console.error('❌ Error loading migration data:', error.message);
    throw error;
  }
}

/**
 * Delete match odds cache
 */
async function deleteMatchOddsCache() {
  console.log('🎲 Deleting match odds cache...');
  
  try {
    const { error } = await newSupabase
      .from('match_odds_cache')
      .delete()
      .eq('id', 1);
    
    if (error) {
      throw new Error(`Failed to delete match odds cache: ${error.message}`);
    }
    
    rollbackLog.stats.matchOddsCacheDeleted = 1;
    console.log('✅ Match odds cache deleted');
    
  } catch (error) {
    console.error('❌ Error deleting match odds cache:', error.message);
    rollbackLog.errors.push(`Match odds cache deletion failed: ${error.message}`);
  }
}

/**
 * Delete match results
 */
async function deleteMatchResults() {
  console.log('⚽ Deleting match results...');
  
  try {
    const { error } = await newSupabase
      .from('match_results')
      .delete()
      .neq('fixture_id', 0); // Delete all match results
    
    if (error) {
      throw new Error(`Failed to delete match results: ${error.message}`);
    }
    
    rollbackLog.stats.matchResultsDeleted = 1;
    console.log('✅ Match results deleted');
    
  } catch (error) {
    console.error('❌ Error deleting match results:', error.message);
    rollbackLog.errors.push(`Match results deletion failed: ${error.message}`);
  }
}

/**
 * Delete news records
 */
async function deleteNews() {
  console.log('📰 Deleting news records...');
  
  try {
    const { error } = await newSupabase
      .from('news')
      .delete()
      .neq('id', 0); // Delete all news records
    
    if (error) {
      throw new Error(`Failed to delete news records: ${error.message}`);
    }
    
    rollbackLog.stats.newsDeleted = 1;
    console.log('✅ News records deleted');
    
  } catch (error) {
    console.error('❌ Error deleting news records:', error.message);
    rollbackLog.errors.push(`News deletion failed: ${error.message}`);
  }
}

/**
 * Delete weekly performance records
 */
async function deleteWeeklyPerformance() {
  console.log('📊 Deleting weekly performance records...');
  
  try {
    const { error } = await newSupabase
      .from('weekly_performance')
      .delete()
      .neq('id', 0); // Delete all weekly performance records
    
    if (error) {
      throw new Error(`Failed to delete weekly performance records: ${error.message}`);
    }
    
    rollbackLog.stats.weeklyPerformanceDeleted = 1;
    console.log('✅ Weekly performance records deleted');
    
  } catch (error) {
    console.error('❌ Error deleting weekly performance records:', error.message);
    rollbackLog.errors.push(`Weekly performance deletion failed: ${error.message}`);
  }
}

/**
 * Delete bet selections
 */
async function deleteBetSelections() {
  console.log('🎲 Deleting bet selections...');
  
  try {
    const { error } = await newSupabase
      .from('bet_selections')
      .delete()
      .neq('id', 0); // Delete all bet selections
    
    if (error) {
      throw new Error(`Failed to delete bet selections: ${error.message}`);
    }
    
    rollbackLog.stats.betSelectionsDeleted = 1;
    console.log('✅ Bet selections deleted');
    
  } catch (error) {
    console.error('❌ Error deleting bet selections:', error.message);
    rollbackLog.errors.push(`Bet selections deletion failed: ${error.message}`);
  }
}

/**
 * Delete bets
 */
async function deleteBets() {
  console.log('🎯 Deleting bets...');
  
  try {
    const { error } = await newSupabase
      .from('bets')
      .delete()
      .neq('id', 0); // Delete all bets
    
    if (error) {
      throw new Error(`Failed to delete bets: ${error.message}`);
    }
    
    rollbackLog.stats.betsDeleted = 1;
    console.log('✅ Bets deleted');
    
  } catch (error) {
    console.error('❌ Error deleting bets:', error.message);
    rollbackLog.errors.push(`Bets deletion failed: ${error.message}`);
  }
}

/**
 * Delete profiles
 */
async function deleteProfiles() {
  console.log('👤 Deleting profiles...');
  
  try {
    const { error } = await newSupabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all profiles
    
    if (error) {
      throw new Error(`Failed to delete profiles: ${error.message}`);
    }
    
    rollbackLog.stats.profilesDeleted = 1;
    console.log('✅ Profiles deleted');
    
  } catch (error) {
    console.error('❌ Error deleting profiles:', error.message);
    rollbackLog.errors.push(`Profiles deletion failed: ${error.message}`);
  }
}

/**
 * Delete leagues
 */
async function deleteLeagues() {
  console.log('🏆 Deleting leagues...');
  
  try {
    const { error } = await newSupabase
      .from('leagues')
      .delete()
      .neq('id', 0); // Delete all leagues
    
    if (error) {
      throw new Error(`Failed to delete leagues: ${error.message}`);
    }
    
    rollbackLog.stats.leaguesDeleted = 1;
    console.log('✅ Leagues deleted');
    
  } catch (error) {
    console.error('❌ Error deleting leagues:', error.message);
    rollbackLog.errors.push(`Leagues deletion failed: ${error.message}`);
  }
}

/**
 * Delete users
 */
async function deleteUsers() {
  console.log('👥 Deleting users...');
  
  try {
    // Get all users from the new project
    const { data: users, error: listError } = await newSupabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }
    
    // Delete each user
    for (const user of users.users) {
      // Skip system users
      if (user.email && (user.email.includes('@supabase') || user.email.includes('@system'))) {
        continue;
      }
      
      try {
        const { error: deleteError } = await newSupabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          throw new Error(`Failed to delete user ${user.email}: ${deleteError.message}`);
        }
        
        rollbackLog.stats.usersDeleted++;
        console.log(`✅ Deleted user: ${user.email}`);
        
      } catch (error) {
        console.error(`❌ Error deleting user ${user.email}:`, error.message);
        rollbackLog.errors.push(`User deletion failed for ${user.email}: ${error.message}`);
      }
    }
    
    console.log(`✅ User deletion completed: ${rollbackLog.stats.usersDeleted} users deleted`);
    
  } catch (error) {
    console.error('❌ Error deleting users:', error.message);
    rollbackLog.errors.push(`Users deletion failed: ${error.message}`);
  }
}

/**
 * Reset sequences
 */
async function resetSequences() {
  console.log('🔄 Resetting sequences...');
  
  try {
    // Reset bets sequence
    await newSupabase.rpc('sql', {
      query: `SELECT setval('public.bets_id_seq', 1, false);`
    });
    
    // Reset weekly performance sequence
    await newSupabase.rpc('sql', {
      query: `SELECT setval('public.weekly_performance_id_seq', 1, false);`
    });
    
    console.log('✅ Sequences reset');
    
  } catch (error) {
    console.error('❌ Error resetting sequences:', error.message);
    rollbackLog.warnings.push(`Sequence reset failed: ${error.message}`);
  }
}

/**
 * Save rollback log
 */
async function saveRollbackLog() {
  rollbackLog.endTime = new Date().toISOString();
  rollbackLog.status = rollbackLog.errors.length > 0 ? 'completed_with_errors' : 'completed_successfully';
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = `rollback-log-${timestamp}.json`;
  
  try {
    await fs.writeFile(logPath, JSON.stringify(rollbackLog, null, 2));
    console.log(`📝 Rollback log saved to: ${logPath}`);
  } catch (error) {
    console.error('❌ Error saving rollback log:', error.message);
  }
}

/**
 * Main rollback function
 */
async function main() {
  const migrationDir = process.argv[2];
  const confirmFlag = process.argv[3];
  
  if (!migrationDir) {
    console.error('❌ Please provide the migration data directory path');
    console.log('Usage: node migration-rollback.js <migration-data-directory> [--confirm]');
    process.exit(1);
  }
  
  if (confirmFlag !== '--confirm') {
    console.error('❌ WARNING: This script will DELETE data from the new project!');
    console.log('To confirm the rollback, run:');
    console.log(`node migration-rollback.js ${migrationDir} --confirm`);
    process.exit(1);
  }
  
  console.log('⚠️  WARNING: Starting Supabase Migration Rollback');
  console.log('This will DELETE all migrated data from the new project!');
  console.log('=' .repeat(60));
  
  try {
    // Load migration data
    await loadMigrationData(migrationDir);
    
    // Delete data in reverse order (respecting foreign key constraints)
    await deleteMatchOddsCache();
    await deleteMatchResults();
    await deleteNews();
    await deleteWeeklyPerformance();
    await deleteBetSelections();
    await deleteBets();
    await deleteProfiles();
    await deleteLeagues();
    await deleteUsers();
    
    // Reset sequences
    await resetSequences();
    
    // Save rollback log
    await saveRollbackLog();
    
    console.log('=' .repeat(60));
    console.log('✅ Rollback completed!');
    console.log('\n📊 Rollback Summary:');
    console.log(`   - Users: ${rollbackLog.stats.usersDeleted} deleted`);
    console.log(`   - Profiles: ${rollbackLog.stats.profilesDeleted} deleted`);
    console.log(`   - Leagues: ${rollbackLog.stats.leaguesDeleted} deleted`);
    console.log(`   - Bets: ${rollbackLog.stats.betsDeleted} deleted`);
    console.log(`   - Bet Selections: ${rollbackLog.stats.betSelectionsDeleted} deleted`);
    console.log(`   - Weekly Performance: ${rollbackLog.stats.weeklyPerformanceDeleted} deleted`);
    console.log(`   - News: ${rollbackLog.stats.newsDeleted} deleted`);
    console.log(`   - Match Results: ${rollbackLog.stats.matchResultsDeleted} deleted`);
    console.log(`   - Match Odds Cache: ${rollbackLog.stats.matchOddsCacheDeleted} deleted`);
    
    if (rollbackLog.errors.length > 0) {
      console.log(`\n❌ Errors: ${rollbackLog.errors.length}`);
      rollbackLog.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (rollbackLog.warnings.length > 0) {
      console.log(`\n⚠️  Warnings: ${rollbackLog.warnings.length}`);
      rollbackLog.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Verify the rollback was successful by checking the data');
    console.log('2. If needed, you can re-run the migration import script');
    console.log('3. Update your application configuration to point back to the old project');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    rollbackLog.status = 'failed';
    rollbackLog.errors.push(`Rollback failed: ${error.message}`);
    await saveRollbackLog();
    process.exit(1);
  }
}

// Run the rollback
if (require.main === module) {
  main();
}

module.exports = {
  deleteUsers,
  deleteProfiles,
  deleteLeagues,
  deleteBets,
  deleteBetSelections,
  deleteWeeklyPerformance,
  deleteNews,
  deleteMatchResults,
  deleteMatchOddsCache,
  resetSequences,
  saveRollbackLog
};
