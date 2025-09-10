#!/usr/bin/env node

/**
 * Supabase User Migration - Validation Script
 * 
 * This script validates the migration by comparing data between old and new projects
 * and provides detailed reports on the migration success.
 * 
 * Usage: node migration-validate.js <migration-data-directory>
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// PROJECT CONFIGURATIONS
const OLD_PROJECT_URL = 'https://jhsjszflscbpcfzuurwq.supabase.co';
const OLD_PROJECT_SERVICE_KEY = 'sb_secret_LeZr-ZgkpGrSodT8llyx1Q_dTYiiGhm';

const NEW_PROJECT_URL = 'https://lflxrkkzudsecvdfdxwl.supabase.co';
const NEW_PROJECT_SERVICE_KEY = 'sb_secret_A22qw961Z_bCCcMwnnxWZw_t7xleJt_';

// Create Supabase clients
const oldSupabase = createClient(OLD_PROJECT_URL, OLD_PROJECT_SERVICE_KEY);
const newSupabase = createClient(NEW_PROJECT_URL, NEW_PROJECT_SERVICE_KEY);

// Validation results
const validationResults = {
  timestamp: new Date().toISOString(),
  overallStatus: 'pending',
  summary: {
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    warnings: 0
  },
  details: {
    users: { status: 'pending', issues: [], stats: {} },
    profiles: { status: 'pending', issues: [], stats: {} },
    leagues: { status: 'pending', issues: [], stats: {} },
    bets: { status: 'pending', issues: [], stats: {} },
    betSelections: { status: 'pending', issues: [], stats: {} },
    weeklyPerformance: { status: 'pending', issues: [], stats: {} },
    news: { status: 'pending', issues: [], stats: {} },
    matchResults: { status: 'pending', issues: [], stats: {} },
    matchOddsCache: { status: 'pending', issues: [], stats: {} }
  }
};

// User mapping for validation
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
 * Validate user migration
 */
async function validateUsers() {
  console.log('👥 Validating user migration...');
  
  try {
    // Get users from old project
    const { data: oldUsers, error: oldError } = await oldSupabase.auth.admin.listUsers();
    if (oldError) throw new Error(`Failed to get old users: ${oldError.message}`);
    
    // Get users from new project
    const { data: newUsers, error: newError } = await newSupabase.auth.admin.listUsers();
    if (newError) throw new Error(`Failed to get new users: ${newError.message}`);
    
    const oldUserCount = oldUsers.users.filter(u => u.email && !u.email.includes('@supabase')).length;
    const newUserCount = newUsers.users.filter(u => u.email && !u.email.includes('@supabase')).length;
    
    validationResults.details.users.stats = {
      oldCount: oldUserCount,
      newCount: newUserCount,
      expectedCount: Object.keys(userMapping).length
    };
    
    // Check if all users were migrated
    const migratedUsers = Object.values(userMapping).filter(u => u.status === 'created' || u.status === 'skipped');
    const failedUsers = Object.values(userMapping).filter(u => u.status === 'failed');
    
    if (migratedUsers.length !== Object.keys(userMapping).length) {
      validationResults.details.users.issues.push(`Not all users were migrated: ${migratedUsers.length}/${Object.keys(userMapping).length}`);
    }
    
    if (failedUsers.length > 0) {
      validationResults.details.users.issues.push(`${failedUsers.length} users failed to migrate`);
    }
    
    // Check email consistency
    for (const [oldId, mapping] of Object.entries(userMapping)) {
      if (mapping.status === 'created' || mapping.status === 'skipped') {
        const newUser = newUsers.users.find(u => u.id === mapping.newId);
        if (!newUser) {
          validationResults.details.users.issues.push(`User ${mapping.email} not found in new project`);
        } else if (newUser.email !== mapping.email) {
          validationResults.details.users.issues.push(`Email mismatch for user ${oldId}: ${mapping.email} vs ${newUser.email}`);
        }
      }
    }
    
    validationResults.details.users.status = validationResults.details.users.issues.length === 0 ? 'passed' : 'failed';
    console.log(`✅ User validation completed: ${validationResults.details.users.status}`);
    
  } catch (error) {
    console.error('❌ Error validating users:', error.message);
    validationResults.details.users.issues.push(`Validation error: ${error.message}`);
    validationResults.details.users.status = 'failed';
  }
}

/**
 * Validate profiles migration
 */
async function validateProfiles() {
  console.log('👤 Validating profiles migration...');
  
  try {
    // Get profiles from old project
    const { data: oldProfiles, error: oldError } = await oldSupabase
      .from('profiles')
      .select('*');
    if (oldError) throw new Error(`Failed to get old profiles: ${oldError.message}`);
    
    // Get profiles from new project
    const { data: newProfiles, error: newError } = await newSupabase
      .from('profiles')
      .select('*');
    if (newError) throw new Error(`Failed to get new profiles: ${newError.message}`);
    
    validationResults.details.profiles.stats = {
      oldCount: oldProfiles.length,
      newCount: newProfiles.length
    };
    
    // Check if all profiles were migrated
    if (newProfiles.length !== oldProfiles.length) {
      validationResults.details.profiles.issues.push(`Profile count mismatch: ${newProfiles.length} vs ${oldProfiles.length}`);
    }
    
    // Check profile data consistency
    for (const oldProfile of oldProfiles) {
      const newUserId = userMapping[oldProfile.id]?.newId;
      if (!newUserId) {
        validationResults.details.profiles.issues.push(`No new user ID found for profile ${oldProfile.id}`);
        continue;
      }
      
      const newProfile = newProfiles.find(p => p.id === newUserId);
      if (!newProfile) {
        validationResults.details.profiles.issues.push(`Profile not found for user ${newUserId}`);
        continue;
      }
      
      // Check critical fields
      if (newProfile.username !== oldProfile.username) {
        validationResults.details.profiles.issues.push(`Username mismatch for user ${newUserId}: ${newProfile.username} vs ${oldProfile.username}`);
      }
      
      if (newProfile.role !== oldProfile.role) {
        validationResults.details.profiles.issues.push(`Role mismatch for user ${newUserId}: ${newProfile.role} vs ${oldProfile.role}`);
      }
      
      if (newProfile.global_role !== oldProfile.global_role) {
        validationResults.details.profiles.issues.push(`Global role mismatch for user ${newUserId}: ${newProfile.global_role} vs ${oldProfile.global_role}`);
      }
    }
    
    validationResults.details.profiles.status = validationResults.details.profiles.issues.length === 0 ? 'passed' : 'failed';
    console.log(`✅ Profile validation completed: ${validationResults.details.profiles.status}`);
    
  } catch (error) {
    console.error('❌ Error validating profiles:', error.message);
    validationResults.details.profiles.issues.push(`Validation error: ${error.message}`);
    validationResults.details.profiles.status = 'failed';
  }
}

/**
 * Validate leagues migration
 */
async function validateLeagues() {
  console.log('🏆 Validating leagues migration...');
  
  try {
    // Get leagues from old project
    const { data: oldLeagues, error: oldError } = await oldSupabase
      .from('leagues')
      .select('*');
    if (oldError) throw new Error(`Failed to get old leagues: ${oldError.message}`);
    
    // Get leagues from new project
    const { data: newLeagues, error: newError } = await newSupabase
      .from('leagues')
      .select('*');
    if (newError) throw new Error(`Failed to get new leagues: ${newError.message}`);
    
    validationResults.details.leagues.stats = {
      oldCount: oldLeagues.length,
      newCount: newLeagues.length
    };
    
    // Check if all leagues were migrated
    if (newLeagues.length !== oldLeagues.length) {
      validationResults.details.leagues.issues.push(`League count mismatch: ${newLeagues.length} vs ${oldLeagues.length}`);
    }
    
    // Check league data consistency
    for (const oldLeague of oldLeagues) {
      const newLeague = newLeagues.find(l => l.id === oldLeague.id);
      if (!newLeague) {
        validationResults.details.leagues.issues.push(`League ${oldLeague.id} not found in new project`);
        continue;
      }
      
      // Check critical fields
      if (newLeague.name !== oldLeague.name) {
        validationResults.details.leagues.issues.push(`League name mismatch for ${oldLeague.id}: ${newLeague.name} vs ${oldLeague.name}`);
      }
      
      if (newLeague.join_code !== oldLeague.join_code) {
        validationResults.details.leagues.issues.push(`Join code mismatch for league ${oldLeague.id}`);
      }
      
      if (newLeague.type !== oldLeague.type) {
        validationResults.details.leagues.issues.push(`Type mismatch for league ${oldLeague.id}: ${newLeague.type} vs ${oldLeague.type}`);
      }
    }
    
    validationResults.details.leagues.status = validationResults.details.leagues.issues.length === 0 ? 'passed' : 'failed';
    console.log(`✅ League validation completed: ${validationResults.details.leagues.status}`);
    
  } catch (error) {
    console.error('❌ Error validating leagues:', error.message);
    validationResults.details.leagues.issues.push(`Validation error: ${error.message}`);
    validationResults.details.leagues.status = 'failed';
  }
}

/**
 * Validate bets migration
 */
async function validateBets() {
  console.log('🎯 Validating bets migration...');
  
  try {
    // Get bets from old project
    const { data: oldBets, error: oldError } = await oldSupabase
      .from('bets')
      .select('*');
    if (oldError) throw new Error(`Failed to get old bets: ${oldError.message}`);
    
    // Get bets from new project
    const { data: newBets, error: newError } = await newSupabase
      .from('bets')
      .select('*');
    if (newError) throw new Error(`Failed to get new bets: ${newError.message}`);
    
    validationResults.details.bets.stats = {
      oldCount: oldBets.length,
      newCount: newBets.length
    };
    
    // Check if all bets were migrated
    if (newBets.length !== oldBets.length) {
      validationResults.details.bets.issues.push(`Bet count mismatch: ${newBets.length} vs ${oldBets.length}`);
    }
    
    // Check bet data consistency
    for (const oldBet of oldBets) {
      const newBet = newBets.find(b => b.id === oldBet.id);
      if (!newBet) {
        validationResults.details.bets.issues.push(`Bet ${oldBet.id} not found in new project`);
        continue;
      }
      
      // Check user ID mapping
      const newUserId = userMapping[oldBet.user_id]?.newId;
      if (!newUserId) {
        validationResults.details.bets.issues.push(`No new user ID found for bet ${oldBet.id}`);
        continue;
      }
      
      if (newBet.user_id !== newUserId) {
        validationResults.details.bets.issues.push(`User ID mismatch for bet ${oldBet.id}: ${newBet.user_id} vs ${newUserId}`);
      }
      
      // Check critical fields
      if (newBet.stake !== oldBet.stake) {
        validationResults.details.bets.issues.push(`Stake mismatch for bet ${oldBet.id}: ${newBet.stake} vs ${oldBet.stake}`);
      }
      
      if (newBet.status !== oldBet.status) {
        validationResults.details.bets.issues.push(`Status mismatch for bet ${oldBet.id}: ${newBet.status} vs ${oldBet.status}`);
      }
    }
    
    validationResults.details.bets.status = validationResults.details.bets.issues.length === 0 ? 'passed' : 'failed';
    console.log(`✅ Bet validation completed: ${validationResults.details.bets.status}`);
    
  } catch (error) {
    console.error('❌ Error validating bets:', error.message);
    validationResults.details.bets.issues.push(`Validation error: ${error.message}`);
    validationResults.details.bets.status = 'failed';
  }
}

/**
 * Validate bet selections migration
 */
async function validateBetSelections() {
  console.log('🎲 Validating bet selections migration...');
  
  try {
    // Get bet selections from old project
    const { data: oldBetSelections, error: oldError } = await oldSupabase
      .from('bet_selections')
      .select('*');
    if (oldError) throw new Error(`Failed to get old bet selections: ${oldError.message}`);
    
    // Get bet selections from new project
    const { data: newBetSelections, error: newError } = await newSupabase
      .from('bet_selections')
      .select('*');
    if (newError) throw new Error(`Failed to get new bet selections: ${newError.message}`);
    
    validationResults.details.betSelections.stats = {
      oldCount: oldBetSelections.length,
      newCount: newBetSelections.length
    };
    
    // Check if all bet selections were migrated
    if (newBetSelections.length !== oldBetSelections.length) {
      validationResults.details.betSelections.issues.push(`Bet selection count mismatch: ${newBetSelections.length} vs ${oldBetSelections.length}`);
    }
    
    // Check bet selection data consistency
    for (const oldBetSelection of oldBetSelections) {
      const newBetSelection = newBetSelections.find(bs => bs.id === oldBetSelection.id);
      if (!newBetSelection) {
        validationResults.details.betSelections.issues.push(`Bet selection ${oldBetSelection.id} not found in new project`);
        continue;
      }
      
      // Check critical fields
      if (newBetSelection.bet_id !== oldBetSelection.bet_id) {
        validationResults.details.betSelections.issues.push(`Bet ID mismatch for bet selection ${oldBetSelection.id}: ${newBetSelection.bet_id} vs ${oldBetSelection.bet_id}`);
      }
      
      if (newBetSelection.selection !== oldBetSelection.selection) {
        validationResults.details.betSelections.issues.push(`Selection mismatch for bet selection ${oldBetSelection.id}: ${newBetSelection.selection} vs ${oldBetSelection.selection}`);
      }
      
      if (newBetSelection.odds !== oldBetSelection.odds) {
        validationResults.details.betSelections.issues.push(`Odds mismatch for bet selection ${oldBetSelection.id}: ${newBetSelection.odds} vs ${oldBetSelection.odds}`);
      }
    }
    
    validationResults.details.betSelections.status = validationResults.details.betSelections.issues.length === 0 ? 'passed' : 'failed';
    console.log(`✅ Bet selection validation completed: ${validationResults.details.betSelections.status}`);
    
  } catch (error) {
    console.error('❌ Error validating bet selections:', error.message);
    validationResults.details.betSelections.issues.push(`Validation error: ${error.message}`);
    validationResults.details.betSelections.status = 'failed';
  }
}

/**
 * Validate weekly performance migration
 */
async function validateWeeklyPerformance() {
  console.log('📊 Validating weekly performance migration...');
  
  try {
    // Get weekly performance from old project
    const { data: oldWeeklyPerformance, error: oldError } = await oldSupabase
      .from('weekly_performance')
      .select('*');
    if (oldError) throw new Error(`Failed to get old weekly performance: ${oldError.message}`);
    
    // Get weekly performance from new project
    const { data: newWeeklyPerformance, error: newError } = await newSupabase
      .from('weekly_performance')
      .select('*');
    if (newError) throw new Error(`Failed to get new weekly performance: ${newError.message}`);
    
    validationResults.details.weeklyPerformance.stats = {
      oldCount: oldWeeklyPerformance.length,
      newCount: newWeeklyPerformance.length
    };
    
    // Check if all weekly performance records were migrated
    if (newWeeklyPerformance.length !== oldWeeklyPerformance.length) {
      validationResults.details.weeklyPerformance.issues.push(`Weekly performance count mismatch: ${newWeeklyPerformance.length} vs ${oldWeeklyPerformance.length}`);
    }
    
    // Check weekly performance data consistency
    for (const oldPerf of oldWeeklyPerformance) {
      const newPerf = newWeeklyPerformance.find(wp => wp.id === oldPerf.id);
      if (!newPerf) {
        validationResults.details.weeklyPerformance.issues.push(`Weekly performance ${oldPerf.id} not found in new project`);
        continue;
      }
      
      // Check user ID mapping
      const newUserId = userMapping[oldPerf.user_id]?.newId;
      if (!newUserId) {
        validationResults.details.weeklyPerformance.issues.push(`No new user ID found for weekly performance ${oldPerf.id}`);
        continue;
      }
      
      if (newPerf.user_id !== newUserId) {
        validationResults.details.weeklyPerformance.issues.push(`User ID mismatch for weekly performance ${oldPerf.id}: ${newPerf.user_id} vs ${newUserId}`);
      }
      
      // Check critical fields
      if (newPerf.net_profit !== oldPerf.net_profit) {
        validationResults.details.weeklyPerformance.issues.push(`Net profit mismatch for weekly performance ${oldPerf.id}: ${newPerf.net_profit} vs ${oldPerf.net_profit}`);
      }
    }
    
    validationResults.details.weeklyPerformance.status = validationResults.details.weeklyPerformance.issues.length === 0 ? 'passed' : 'failed';
    console.log(`✅ Weekly performance validation completed: ${validationResults.details.weeklyPerformance.status}`);
    
  } catch (error) {
    console.error('❌ Error validating weekly performance:', error.message);
    validationResults.details.weeklyPerformance.issues.push(`Validation error: ${error.message}`);
    validationResults.details.weeklyPerformance.status = 'failed';
  }
}

/**
 * Validate news migration
 */
async function validateNews() {
  console.log('📰 Validating news migration...');
  
  try {
    // Get news from old project
    const { data: oldNews, error: oldError } = await oldSupabase
      .from('news')
      .select('*');
    if (oldError) throw new Error(`Failed to get old news: ${oldError.message}`);
    
    // Get news from new project
    const { data: newNews, error: newError } = await newSupabase
      .from('news')
      .select('*');
    if (newError) throw new Error(`Failed to get new news: ${newError.message}`);
    
    validationResults.details.news.stats = {
      oldCount: oldNews.length,
      newCount: newNews.length
    };
    
    // Check if all news were migrated
    if (newNews.length !== oldNews.length) {
      validationResults.details.news.issues.push(`News count mismatch: ${newNews.length} vs ${oldNews.length}`);
    }
    
    // Check news data consistency
    for (const oldNewsItem of oldNews) {
      const newNewsItem = newNews.find(n => n.id === oldNewsItem.id);
      if (!newNewsItem) {
        validationResults.details.news.issues.push(`News ${oldNewsItem.id} not found in new project`);
        continue;
      }
      
      // Check user ID mapping
      const newUserId = userMapping[oldNewsItem.created_by]?.newId;
      if (!newUserId) {
        validationResults.details.news.issues.push(`No new user ID found for news ${oldNewsItem.id}`);
        continue;
      }
      
      if (newNewsItem.created_by !== newUserId) {
        validationResults.details.news.issues.push(`Created by mismatch for news ${oldNewsItem.id}: ${newNewsItem.created_by} vs ${newUserId}`);
      }
      
      // Check critical fields
      if (newNewsItem.title !== oldNewsItem.title) {
        validationResults.details.news.issues.push(`Title mismatch for news ${oldNewsItem.id}: ${newNewsItem.title} vs ${oldNewsItem.title}`);
      }
      
      if (newNewsItem.is_active !== oldNewsItem.is_active) {
        validationResults.details.news.issues.push(`Active status mismatch for news ${oldNewsItem.id}: ${newNewsItem.is_active} vs ${oldNewsItem.is_active}`);
      }
    }
    
    validationResults.details.news.status = validationResults.details.news.issues.length === 0 ? 'passed' : 'failed';
    console.log(`✅ News validation completed: ${validationResults.details.news.status}`);
    
  } catch (error) {
    console.error('❌ Error validating news:', error.message);
    validationResults.details.news.issues.push(`Validation error: ${error.message}`);
    validationResults.details.news.status = 'failed';
  }
}

/**
 * Validate match results migration
 */
async function validateMatchResults() {
  console.log('⚽ Validating match results migration...');
  
  try {
    // Get match results from old project
    const { data: oldMatchResults, error: oldError } = await oldSupabase
      .from('match_results')
      .select('*');
    if (oldError) throw new Error(`Failed to get old match results: ${oldError.message}`);
    
    // Get match results from new project
    const { data: newMatchResults, error: newError } = await newSupabase
      .from('match_results')
      .select('*');
    if (newError) throw new Error(`Failed to get new match results: ${newError.message}`);
    
    validationResults.details.matchResults.stats = {
      oldCount: oldMatchResults.length,
      newCount: newMatchResults.length
    };
    
    // Check if all match results were migrated
    if (newMatchResults.length !== oldMatchResults.length) {
      validationResults.details.matchResults.issues.push(`Match result count mismatch: ${newMatchResults.length} vs ${oldMatchResults.length}`);
    }
    
    // Check match result data consistency
    for (const oldMatchResult of oldMatchResults) {
      const newMatchResult = newMatchResults.find(mr => mr.fixture_id === oldMatchResult.fixture_id);
      if (!newMatchResult) {
        validationResults.details.matchResults.issues.push(`Match result ${oldMatchResult.fixture_id} not found in new project`);
        continue;
      }
      
      // Check critical fields
      if (newMatchResult.home_goals !== oldMatchResult.home_goals) {
        validationResults.details.matchResults.issues.push(`Home goals mismatch for match ${oldMatchResult.fixture_id}: ${newMatchResult.home_goals} vs ${oldMatchResult.home_goals}`);
      }
      
      if (newMatchResult.away_goals !== oldMatchResult.away_goals) {
        validationResults.details.matchResults.issues.push(`Away goals mismatch for match ${oldMatchResult.fixture_id}: ${newMatchResult.away_goals} vs ${oldMatchResult.away_goals}`);
      }
      
      if (newMatchResult.outcome !== oldMatchResult.outcome) {
        validationResults.details.matchResults.issues.push(`Outcome mismatch for match ${oldMatchResult.fixture_id}: ${newMatchResult.outcome} vs ${oldMatchResult.outcome}`);
      }
    }
    
    validationResults.details.matchResults.status = validationResults.details.matchResults.issues.length === 0 ? 'passed' : 'failed';
    console.log(`✅ Match result validation completed: ${validationResults.details.matchResults.status}`);
    
  } catch (error) {
    console.error('❌ Error validating match results:', error.message);
    validationResults.details.matchResults.issues.push(`Validation error: ${error.message}`);
    validationResults.details.matchResults.status = 'failed';
  }
}

/**
 * Validate match odds cache migration
 */
async function validateMatchOddsCache() {
  console.log('🎲 Validating match odds cache migration...');
  
  try {
    // Get match odds cache from old project
    const { data: oldCache, error: oldError } = await oldSupabase
      .from('match_odds_cache')
      .select('*')
      .eq('id', 1)
      .single();
    
    // Get match odds cache from new project
    const { data: newCache, error: newError } = await newSupabase
      .from('match_odds_cache')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (oldError && oldError.code !== 'PGRST116') {
      throw new Error(`Failed to get old match odds cache: ${oldError.message}`);
    }
    
    if (newError && newError.code !== 'PGRST116') {
      throw new Error(`Failed to get new match odds cache: ${newError.message}`);
    }
    
    validationResults.details.matchOddsCache.stats = {
      oldExists: !!oldCache,
      newExists: !!newCache
    };
    
    // Check if cache was migrated
    if (oldCache && !newCache) {
      validationResults.details.matchOddsCache.issues.push('Match odds cache not found in new project');
    }
    
    if (oldCache && newCache) {
      // Check if data is consistent
      if (JSON.stringify(oldCache.data) !== JSON.stringify(newCache.data)) {
        validationResults.details.matchOddsCache.issues.push('Match odds cache data mismatch');
      }
    }
    
    validationResults.details.matchOddsCache.status = validationResults.details.matchOddsCache.issues.length === 0 ? 'passed' : 'failed';
    console.log(`✅ Match odds cache validation completed: ${validationResults.details.matchOddsCache.status}`);
    
  } catch (error) {
    console.error('❌ Error validating match odds cache:', error.message);
    validationResults.details.matchOddsCache.issues.push(`Validation error: ${error.message}`);
    validationResults.details.matchOddsCache.status = 'failed';
  }
}

/**
 * Calculate overall validation status
 */
function calculateOverallStatus() {
  const allChecks = Object.values(validationResults.details);
  const totalChecks = allChecks.length;
  const passedChecks = allChecks.filter(check => check.status === 'passed').length;
  const failedChecks = allChecks.filter(check => check.status === 'failed').length;
  
  validationResults.summary = {
    totalChecks,
    passedChecks,
    failedChecks,
    warnings: allChecks.reduce((sum, check) => sum + check.issues.length, 0)
  };
  
  if (failedChecks === 0) {
    validationResults.overallStatus = 'passed';
  } else if (passedChecks > 0) {
    validationResults.overallStatus = 'partial';
  } else {
    validationResults.overallStatus = 'failed';
  }
}

/**
 * Save validation results
 */
async function saveValidationResults() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = `validation-results-${timestamp}.json`;
  
  try {
    await fs.writeFile(logPath, JSON.stringify(validationResults, null, 2));
    console.log(`📝 Validation results saved to: ${logPath}`);
  } catch (error) {
    console.error('❌ Error saving validation results:', error.message);
  }
}

/**
 * Main validation function
 */
async function main() {
  const migrationDir = process.argv[2];
  
  if (!migrationDir) {
    console.error('❌ Please provide the migration data directory path');
    console.log('Usage: node migration-validate.js <migration-data-directory>');
    process.exit(1);
  }
  
  console.log('🔍 Starting Supabase Migration Validation');
  console.log('=' .repeat(60));
  
  try {
    // Load migration data
    await loadMigrationData(migrationDir);
    
    // Run all validations
    await validateUsers();
    await validateProfiles();
    await validateLeagues();
    await validateBets();
    await validateBetSelections();
    await validateWeeklyPerformance();
    await validateNews();
    await validateMatchResults();
    await validateMatchOddsCache();
    
    // Calculate overall status
    calculateOverallStatus();
    
    // Save validation results
    await saveValidationResults();
    
    console.log('=' .repeat(60));
    console.log(`✅ Validation completed: ${validationResults.overallStatus.toUpperCase()}`);
    console.log('\n📊 Validation Summary:');
    console.log(`   - Total Checks: ${validationResults.summary.totalChecks}`);
    console.log(`   - Passed: ${validationResults.summary.passedChecks}`);
    console.log(`   - Failed: ${validationResults.summary.failedChecks}`);
    console.log(`   - Issues: ${validationResults.summary.warnings}`);
    
    // Show detailed results
    console.log('\n📋 Detailed Results:');
    Object.entries(validationResults.details).forEach(([table, result]) => {
      const status = result.status === 'passed' ? '✅' : '❌';
      console.log(`   ${status} ${table}: ${result.status} (${result.issues.length} issues)`);
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => {
          console.log(`      - ${issue}`);
        });
      }
    });
    
    if (validationResults.overallStatus === 'passed') {
      console.log('\n🎉 Migration validation passed! Your data has been successfully migrated.');
    } else if (validationResults.overallStatus === 'partial') {
      console.log('\n⚠️  Migration validation partially passed. Please review the issues above.');
    } else {
      console.log('\n❌ Migration validation failed. Please review the issues above and consider running the rollback script.');
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  main();
}

module.exports = {
  validateUsers,
  validateProfiles,
  validateLeagues,
  validateBets,
  validateBetSelections,
  validateWeeklyPerformance,
  validateNews,
  validateMatchResults,
  validateMatchOddsCache,
  calculateOverallStatus,
  saveValidationResults
};
