#!/usr/bin/env node

/**
 * Supabase User Migration - Data Extraction Script
 * 
 * This script extracts user data and related information from the OLD Supabase project
 * and exports it to JSON files for migration to the new project.
 * 
 * IMPORTANT: Run this script on the OLD project before starting the migration process.
 * 
 * Usage: node migration-extract-old-project.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// OLD PROJECT CONFIGURATION
const OLD_PROJECT_URL = 'https://jhsjszflscbpcfzuurwq.supabase.co';
const OLD_PROJECT_SERVICE_KEY = 'sb_secret_LeZr-ZgkpGrSodT8llyx1Q_dTYiiGhm';

// Create Supabase client for old project
const oldSupabase = createClient(OLD_PROJECT_URL, OLD_PROJECT_SERVICE_KEY);

// Migration data structure
const migrationData = {
  metadata: {
    extractedAt: new Date().toISOString(),
    oldProjectId: 'jhsjszflscbpcfzuurwq',
    newProjectId: 'lflxrkkzudsecvdfdxwl',
    version: '1.0.0'
  },
  data: {
    users: [],
    profiles: [],
    leagues: [],
    bets: [],
    betSelections: [],
    weeklyPerformance: [],
    news: [],
    matchResults: [],
    matchOddsCache: null
  }
};

// User mapping for tracking old -> new user IDs
const userMapping = {};

/**
 * Extract users from auth.users table
 */
async function extractUsers() {
  console.log('🔍 Extracting users from auth.users...');
  
  try {
    const { data: users, error } = await oldSupabase.auth.admin.listUsers();
    
    if (error) {
      throw new Error(`Failed to extract users: ${error.message}`);
    }
    
    // Filter out service accounts and system users
    const validUsers = users.users.filter(user => 
      user.email && 
      !user.email.includes('@supabase') &&
      !user.email.includes('@system')
    );
    
    migrationData.data.users = validUsers.map(user => ({
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_sign_in_at: user.last_sign_in_at,
      raw_user_meta_data: user.user_metadata,
      raw_app_meta_data: user.app_metadata
    }));
    
    console.log(`✅ Extracted ${migrationData.data.users.length} users`);
    return migrationData.data.users;
    
  } catch (error) {
    console.error('❌ Error extracting users:', error.message);
    throw error;
  }
}

/**
 * Extract profiles data
 */
async function extractProfiles() {
  console.log('🔍 Extracting profiles...');
  
  try {
    const { data: profiles, error } = await oldSupabase
      .from('profiles')
      .select('*');
    
    if (error) {
      throw new Error(`Failed to extract profiles: ${error.message}`);
    }
    
    migrationData.data.profiles = profiles;
    console.log(`✅ Extracted ${profiles.length} profiles`);
    return profiles;
    
  } catch (error) {
    console.error('❌ Error extracting profiles:', error.message);
    throw error;
  }
}

/**
 * Extract leagues data
 */
async function extractLeagues() {
  console.log('🔍 Extracting leagues...');
  
  try {
    const { data: leagues, error } = await oldSupabase
      .from('leagues')
      .select('*');
    
    if (error) {
      throw new Error(`Failed to extract leagues: ${error.message}`);
    }
    
    migrationData.data.leagues = leagues;
    console.log(`✅ Extracted ${leagues.length} leagues`);
    return leagues;
    
  } catch (error) {
    console.error('❌ Error extracting leagues:', error.message);
    throw error;
  }
}

/**
 * Extract bets data
 */
async function extractBets() {
  console.log('🔍 Extracting bets...');
  
  try {
    const { data: bets, error } = await oldSupabase
      .from('bets')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to extract bets: ${error.message}`);
    }
    
    migrationData.data.bets = bets;
    console.log(`✅ Extracted ${bets.length} bets`);
    return bets;
    
  } catch (error) {
    console.error('❌ Error extracting bets:', error.message);
    throw error;
  }
}

/**
 * Extract bet selections data
 */
async function extractBetSelections() {
  console.log('🔍 Extracting bet selections...');
  
  try {
    const { data: betSelections, error } = await oldSupabase
      .from('bet_selections')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to extract bet selections: ${error.message}`);
    }
    
    migrationData.data.betSelections = betSelections;
    console.log(`✅ Extracted ${betSelections.length} bet selections`);
    return betSelections;
    
  } catch (error) {
    console.error('❌ Error extracting bet selections:', error.message);
    throw error;
  }
}

/**
 * Extract weekly performance data
 */
async function extractWeeklyPerformance() {
  console.log('🔍 Extracting weekly performance...');
  
  try {
    const { data: weeklyPerformance, error } = await oldSupabase
      .from('weekly_performance')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to extract weekly performance: ${error.message}`);
    }
    
    migrationData.data.weeklyPerformance = weeklyPerformance;
    console.log(`✅ Extracted ${weeklyPerformance.length} weekly performance records`);
    return weeklyPerformance;
    
  } catch (error) {
    console.error('❌ Error extracting weekly performance:', error.message);
    throw error;
  }
}

/**
 * Extract news data
 */
async function extractNews() {
  console.log('🔍 Extracting news...');
  
  try {
    const { data: news, error } = await oldSupabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to extract news: ${error.message}`);
    }
    
    migrationData.data.news = news;
    console.log(`✅ Extracted ${news.length} news items`);
    return news;
    
  } catch (error) {
    console.error('❌ Error extracting news:', error.message);
    throw error;
  }
}

/**
 * Extract match results data
 */
async function extractMatchResults() {
  console.log('🔍 Extracting match results...');
  
  try {
    const { data: matchResults, error } = await oldSupabase
      .from('match_results')
      .select('*')
      .order('finished_at', { ascending: true });
    
    if (error) {
      throw new Error(`Failed to extract match results: ${error.message}`);
    }
    
    migrationData.data.matchResults = matchResults;
    console.log(`✅ Extracted ${matchResults.length} match results`);
    return matchResults;
    
  } catch (error) {
    console.error('❌ Error extracting match results:', error.message);
    throw error;
  }
}

/**
 * Extract match odds cache
 */
async function extractMatchOddsCache() {
  console.log('🔍 Extracting match odds cache...');
  
  try {
    const { data: cache, error } = await oldSupabase
      .from('match_odds_cache')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to extract match odds cache: ${error.message}`);
    }
    
    migrationData.data.matchOddsCache = cache;
    console.log(`✅ Extracted match odds cache`);
    return cache;
    
  } catch (error) {
    console.error('❌ Error extracting match odds cache:', error.message);
    throw error;
  }
}

/**
 * Generate user mapping for tracking old -> new user IDs
 */
function generateUserMapping() {
  console.log('🔗 Generating user mapping...');
  
  migrationData.data.users.forEach(user => {
    userMapping[user.id] = {
      oldId: user.id,
      email: user.email,
      newId: null, // Will be populated during import
      status: 'pending'
    };
  });
  
  console.log(`✅ Generated mapping for ${Object.keys(userMapping).length} users`);
}

/**
 * Validate data integrity
 */
function validateDataIntegrity() {
  console.log('🔍 Validating data integrity...');
  
  const issues = [];
  
  // Check if all profiles have corresponding users
  const userIds = new Set(migrationData.data.users.map(u => u.id));
  const orphanedProfiles = migrationData.data.profiles.filter(p => !userIds.has(p.id));
  
  if (orphanedProfiles.length > 0) {
    issues.push(`Found ${orphanedProfiles.length} orphaned profiles without corresponding users`);
  }
  
  // Check if all bets have corresponding profiles
  const profileIds = new Set(migrationData.data.profiles.map(p => p.id));
  const orphanedBets = migrationData.data.bets.filter(b => !profileIds.has(b.user_id));
  
  if (orphanedBets.length > 0) {
    issues.push(`Found ${orphanedBets.length} orphaned bets without corresponding profiles`);
  }
  
  // Check if all bet selections have corresponding bets
  const betIds = new Set(migrationData.data.bets.map(b => b.id));
  const orphanedBetSelections = migrationData.data.betSelections.filter(bs => !betIds.has(bs.bet_id));
  
  if (orphanedBetSelections.length > 0) {
    issues.push(`Found ${orphanedBetSelections.length} orphaned bet selections without corresponding bets`);
  }
  
  if (issues.length > 0) {
    console.warn('⚠️  Data integrity issues found:');
    issues.forEach(issue => console.warn(`   - ${issue}`));
  } else {
    console.log('✅ Data integrity validation passed');
  }
  
  return issues;
}

/**
 * Save migration data to files
 */
async function saveMigrationData() {
  console.log('💾 Saving migration data...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = `migration-data-${timestamp}`;
  
  try {
    await fs.mkdir(outputDir, { recursive: true });
    
    // Save main migration data
    await fs.writeFile(
      path.join(outputDir, 'migration-data.json'),
      JSON.stringify(migrationData, null, 2)
    );
    
    // Save user mapping
    await fs.writeFile(
      path.join(outputDir, 'user-mapping.json'),
      JSON.stringify(userMapping, null, 2)
    );
    
    // Save individual table data for easier debugging
    const tables = ['users', 'profiles', 'leagues', 'bets', 'betSelections', 'weeklyPerformance', 'news', 'matchResults'];
    
    for (const table of tables) {
      if (migrationData.data[table] && migrationData.data[table].length > 0) {
        await fs.writeFile(
          path.join(outputDir, `${table}.json`),
          JSON.stringify(migrationData.data[table], null, 2)
        );
      }
    }
    
    // Save match odds cache separately if it exists
    if (migrationData.data.matchOddsCache) {
      await fs.writeFile(
        path.join(outputDir, 'match-odds-cache.json'),
        JSON.stringify(migrationData.data.matchOddsCache, null, 2)
      );
    }
    
    // Save summary report
    const summary = {
      extractedAt: migrationData.metadata.extractedAt,
      oldProjectId: migrationData.metadata.oldProjectId,
      newProjectId: migrationData.metadata.newProjectId,
      counts: {
        users: migrationData.data.users.length,
        profiles: migrationData.data.profiles.length,
        leagues: migrationData.data.leagues.length,
        bets: migrationData.data.bets.length,
        betSelections: migrationData.data.betSelections.length,
        weeklyPerformance: migrationData.data.weeklyPerformance.length,
        news: migrationData.data.news.length,
        matchResults: migrationData.data.matchResults.length,
        hasMatchOddsCache: !!migrationData.data.matchOddsCache
      }
    };
    
    await fs.writeFile(
      path.join(outputDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log(`✅ Migration data saved to: ${outputDir}/`);
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${summary.counts.users}`);
    console.log(`   - Profiles: ${summary.counts.profiles}`);
    console.log(`   - Leagues: ${summary.counts.leagues}`);
    console.log(`   - Bets: ${summary.counts.bets}`);
    console.log(`   - Bet Selections: ${summary.counts.betSelections}`);
    console.log(`   - Weekly Performance: ${summary.counts.weeklyPerformance}`);
    console.log(`   - News: ${summary.counts.news}`);
    console.log(`   - Match Results: ${summary.counts.matchResults}`);
    
    return outputDir;
    
  } catch (error) {
    console.error('❌ Error saving migration data:', error.message);
    throw error;
  }
}

/**
 * Main extraction function
 */
async function main() {
  console.log('🚀 Starting Supabase Migration Data Extraction');
  console.log('=' .repeat(60));
  
  try {
    // Extract all data
    await extractUsers();
    await extractProfiles();
    await extractLeagues();
    await extractBets();
    await extractBetSelections();
    await extractWeeklyPerformance();
    await extractNews();
    await extractMatchResults();
    await extractMatchOddsCache();
    
    // Generate user mapping
    generateUserMapping();
    
    // Validate data integrity
    const issues = validateDataIntegrity();
    
    // Save migration data
    const outputDir = await saveMigrationData();
    
    console.log('=' .repeat(60));
    console.log('✅ Migration data extraction completed successfully!');
    console.log(`📁 Data saved to: ${outputDir}/`);
    
    if (issues.length > 0) {
      console.log('⚠️  Please review the data integrity issues before proceeding with import.');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Review the extracted data in the output directory');
    console.log('2. Run the import script on the NEW project');
    console.log('3. Verify the migration was successful');
    
  } catch (error) {
    console.error('❌ Migration extraction failed:', error.message);
    process.exit(1);
  }
}

// Run the extraction
if (require.main === module) {
  main();
}

module.exports = {
  extractUsers,
  extractProfiles,
  extractLeagues,
  extractBets,
  extractBetSelections,
  extractWeeklyPerformance,
  extractNews,
  extractMatchResults,
  extractMatchOddsCache,
  generateUserMapping,
  validateDataIntegrity,
  saveMigrationData
};
