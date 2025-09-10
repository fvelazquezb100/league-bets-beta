#!/usr/bin/env node

/**
 * Supabase User Migration - Data Import Script
 * 
 * This script imports user data and related information to the NEW Supabase project
 * from the JSON files exported by the extraction script.
 * 
 * IMPORTANT: 
 * 1. Run the extraction script on the OLD project first
 * 2. Ensure the NEW project has the same schema as the old one
 * 3. Run this script on the NEW project
 * 
 * Usage: node migration-import-new-project.js <migration-data-directory>
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// NEW PROJECT CONFIGURATION
const NEW_PROJECT_URL = 'https://lflxrkkzudsecvdfdxwl.supabase.co';
const NEW_PROJECT_SERVICE_KEY = 'sb_secret_A22qw961Z_bCCcMwnnxWZw_t7xleJt_';

// Create Supabase client for new project
const newSupabase = createClient(NEW_PROJECT_URL, NEW_PROJECT_SERVICE_KEY);

// Migration tracking
const migrationLog = {
  startTime: new Date().toISOString(),
  endTime: null,
  status: 'running',
  errors: [],
  warnings: [],
  stats: {
    usersCreated: 0,
    usersSkipped: 0,
    profilesCreated: 0,
    leaguesCreated: 0,
    betsCreated: 0,
    betSelectionsCreated: 0,
    weeklyPerformanceCreated: 0,
    newsCreated: 0,
    matchResultsCreated: 0
  }
};

// User mapping for tracking old -> new user IDs
let userMapping = {};

/**
 * Load migration data from files
 */
async function loadMigrationData(migrationDir) {
  console.log(`📂 Loading migration data from: ${migrationDir}`);
  
  try {
    // Load main migration data
    const migrationDataPath = path.join(migrationDir, 'migration-data.json');
    const migrationDataContent = await fs.readFile(migrationDataPath, 'utf8');
    const migrationData = JSON.parse(migrationDataContent);
    
    // Load user mapping
    const userMappingPath = path.join(migrationDir, 'user-mapping.json');
    const userMappingContent = await fs.readFile(userMappingPath, 'utf8');
    userMapping = JSON.parse(userMappingContent);
    
    console.log('✅ Migration data loaded successfully');
    return migrationData;
    
  } catch (error) {
    console.error('❌ Error loading migration data:', error.message);
    throw error;
  }
}

/**
 * Create users in the new project
 */
async function createUsers(users) {
  console.log('👥 Creating users...');
  
  for (const user of users) {
    try {
      // Check if user already exists by email
      const { data: existingUsers } = await newSupabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === user.email);
      
      if (existingUser) {
        console.log(`⏭️  User ${user.email} already exists, skipping creation`);
        userMapping[user.id].newId = existingUser.id;
        userMapping[user.id].status = 'skipped';
        migrationLog.stats.usersSkipped++;
        continue;
      }
      
      // Create new user
      const { data: newUser, error } = await newSupabase.auth.admin.createUser({
        email: user.email,
        email_confirm: true,
        user_metadata: user.raw_user_meta_data || {},
        app_metadata: user.raw_app_meta_data || {}
      });
      
      if (error) {
        throw new Error(`Failed to create user ${user.email}: ${error.message}`);
      }
      
      // Update user mapping
      userMapping[user.id].newId = newUser.user.id;
      userMapping[user.id].status = 'created';
      migrationLog.stats.usersCreated++;
      
      console.log(`✅ Created user: ${user.email} (${newUser.user.id})`);
      
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error.message);
      migrationLog.errors.push(`User creation failed for ${user.email}: ${error.message}`);
      userMapping[user.id].status = 'failed';
    }
  }
  
  console.log(`✅ User creation completed: ${migrationLog.stats.usersCreated} created, ${migrationLog.stats.usersSkipped} skipped`);
}

/**
 * Create profiles in the new project
 */
async function createProfiles(profiles) {
  console.log('👤 Creating profiles...');
  
  for (const profile of profiles) {
    try {
      const newUserId = userMapping[profile.id]?.newId;
      
      if (!newUserId) {
        console.warn(`⚠️  No new user ID found for profile ${profile.id}, skipping`);
        migrationLog.warnings.push(`No new user ID found for profile ${profile.id}`);
        continue;
      }
      
      // Create profile with new user ID
      const { error } = await newSupabase
        .from('profiles')
        .insert({
          id: newUserId,
          username: profile.username,
          weekly_budget: profile.weekly_budget,
          total_points: profile.total_points,
          league_id: profile.league_id,
          role: profile.role,
          global_role: profile.global_role,
          last_week_points: profile.last_week_points
        });
      
      if (error) {
        throw new Error(`Failed to create profile for user ${newUserId}: ${error.message}`);
      }
      
      migrationLog.stats.profilesCreated++;
      console.log(`✅ Created profile for user: ${newUserId}`);
      
    } catch (error) {
      console.error(`❌ Error creating profile for user ${profile.id}:`, error.message);
      migrationLog.errors.push(`Profile creation failed for user ${profile.id}: ${error.message}`);
    }
  }
  
  console.log(`✅ Profile creation completed: ${migrationLog.stats.profilesCreated} created`);
}

/**
 * Create leagues in the new project
 */
async function createLeagues(leagues) {
  console.log('🏆 Creating leagues...');
  
  for (const league of leagues) {
    try {
      const { error } = await newSupabase
        .from('leagues')
        .insert({
          id: league.id,
          created_at: league.created_at,
          name: league.name,
          join_code: league.join_code,
          type: league.type,
          week: league.week,
          reset_budget: league.reset_budget,
          budget: league.budget,
          min_bet: league.min_bet,
          max_bet: league.max_bet,
          league_season: league.league_season,
          previous_champion: league.previous_champion,
          previous_last: league.previous_last
        });
      
      if (error) {
        throw new Error(`Failed to create league ${league.id}: ${error.message}`);
      }
      
      migrationLog.stats.leaguesCreated++;
      console.log(`✅ Created league: ${league.name} (${league.id})`);
      
    } catch (error) {
      console.error(`❌ Error creating league ${league.id}:`, error.message);
      migrationLog.errors.push(`League creation failed for ${league.id}: ${error.message}`);
    }
  }
  
  console.log(`✅ League creation completed: ${migrationLog.stats.leaguesCreated} created`);
}

/**
 * Create bets in the new project
 */
async function createBets(bets) {
  console.log('🎯 Creating bets...');
  
  for (const bet of bets) {
    try {
      const newUserId = userMapping[bet.user_id]?.newId;
      
      if (!newUserId) {
        console.warn(`⚠️  No new user ID found for bet ${bet.id}, skipping`);
        migrationLog.warnings.push(`No new user ID found for bet ${bet.id}`);
        continue;
      }
      
      const { error } = await newSupabase
        .from('bets')
        .insert({
          id: bet.id,
          user_id: newUserId,
          match_description: bet.match_description,
          bet_selection: bet.bet_selection,
          stake: bet.stake,
          odds: bet.odds,
          status: bet.status,
          payout: bet.payout,
          fixture_id: bet.fixture_id,
          bet_type: bet.bet_type,
          week: bet.week,
          market_bets: bet.market_bets
        });
      
      if (error) {
        throw new Error(`Failed to create bet ${bet.id}: ${error.message}`);
      }
      
      migrationLog.stats.betsCreated++;
      console.log(`✅ Created bet: ${bet.id} for user ${newUserId}`);
      
    } catch (error) {
      console.error(`❌ Error creating bet ${bet.id}:`, error.message);
      migrationLog.errors.push(`Bet creation failed for ${bet.id}: ${error.message}`);
    }
  }
  
  console.log(`✅ Bet creation completed: ${migrationLog.stats.betsCreated} created`);
}

/**
 * Create bet selections in the new project
 */
async function createBetSelections(betSelections) {
  console.log('🎲 Creating bet selections...');
  
  for (const betSelection of betSelections) {
    try {
      const { error } = await newSupabase
        .from('bet_selections')
        .insert({
          id: betSelection.id,
          bet_id: betSelection.bet_id,
          fixture_id: betSelection.fixture_id,
          market: betSelection.market,
          selection: betSelection.selection,
          odds: betSelection.odds,
          status: betSelection.status,
          created_at: betSelection.created_at,
          match_description: betSelection.match_description
        });
      
      if (error) {
        throw new Error(`Failed to create bet selection ${betSelection.id}: ${error.message}`);
      }
      
      migrationLog.stats.betSelectionsCreated++;
      console.log(`✅ Created bet selection: ${betSelection.id}`);
      
    } catch (error) {
      console.error(`❌ Error creating bet selection ${betSelection.id}:`, error.message);
      migrationLog.errors.push(`Bet selection creation failed for ${betSelection.id}: ${error.message}`);
    }
  }
  
  console.log(`✅ Bet selection creation completed: ${migrationLog.stats.betSelectionsCreated} created`);
}

/**
 * Create weekly performance records in the new project
 */
async function createWeeklyPerformance(weeklyPerformance) {
  console.log('📊 Creating weekly performance records...');
  
  for (const performance of weeklyPerformance) {
    try {
      const newUserId = userMapping[performance.user_id]?.newId;
      
      if (!newUserId) {
        console.warn(`⚠️  No new user ID found for weekly performance ${performance.id}, skipping`);
        migrationLog.warnings.push(`No new user ID found for weekly performance ${performance.id}`);
        continue;
      }
      
      const { error } = await newSupabase
        .from('weekly_performance')
        .insert({
          id: performance.id,
          user_id: newUserId,
          start_date: performance.start_date,
          end_date: performance.end_date,
          net_profit: performance.net_profit,
          league_id: performance.league_id,
          created_at: performance.created_at
        });
      
      if (error) {
        throw new Error(`Failed to create weekly performance ${performance.id}: ${error.message}`);
      }
      
      migrationLog.stats.weeklyPerformanceCreated++;
      console.log(`✅ Created weekly performance: ${performance.id}`);
      
    } catch (error) {
      console.error(`❌ Error creating weekly performance ${performance.id}:`, error.message);
      migrationLog.errors.push(`Weekly performance creation failed for ${performance.id}: ${error.message}`);
    }
  }
  
  console.log(`✅ Weekly performance creation completed: ${migrationLog.stats.weeklyPerformanceCreated} created`);
}

/**
 * Create news records in the new project
 */
async function createNews(news) {
  console.log('📰 Creating news records...');
  
  for (const newsItem of news) {
    try {
      const newUserId = userMapping[newsItem.created_by]?.newId;
      
      if (!newUserId) {
        console.warn(`⚠️  No new user ID found for news ${newsItem.id}, skipping`);
        migrationLog.warnings.push(`No new user ID found for news ${newsItem.id}`);
        continue;
      }
      
      const { error } = await newSupabase
        .from('news')
        .insert({
          id: newsItem.id,
          title: newsItem.title,
          content: newsItem.content,
          created_at: newsItem.created_at,
          created_by: newUserId,
          is_active: newsItem.is_active,
          is_frozen: newsItem.is_frozen
        });
      
      if (error) {
        throw new Error(`Failed to create news ${newsItem.id}: ${error.message}`);
      }
      
      migrationLog.stats.newsCreated++;
      console.log(`✅ Created news: ${newsItem.title} (${newsItem.id})`);
      
    } catch (error) {
      console.error(`❌ Error creating news ${newsItem.id}:`, error.message);
      migrationLog.errors.push(`News creation failed for ${newsItem.id}: ${error.message}`);
    }
  }
  
  console.log(`✅ News creation completed: ${migrationLog.stats.newsCreated} created`);
}

/**
 * Create match results in the new project
 */
async function createMatchResults(matchResults) {
  console.log('⚽ Creating match results...');
  
  for (const matchResult of matchResults) {
    try {
      const { error } = await newSupabase
        .from('match_results')
        .insert({
          fixture_id: matchResult.fixture_id,
          match_name: matchResult.match_name,
          home_team: matchResult.home_team,
          away_team: matchResult.away_team,
          league_id: matchResult.league_id,
          season: matchResult.season,
          home_goals: matchResult.home_goals,
          away_goals: matchResult.away_goals,
          halftime_home: matchResult.halftime_home,
          halftime_away: matchResult.halftime_away,
          outcome: matchResult.outcome,
          finished_at: matchResult.finished_at,
          match_result: matchResult.match_result
        });
      
      if (error) {
        throw new Error(`Failed to create match result ${matchResult.fixture_id}: ${error.message}`);
      }
      
      migrationLog.stats.matchResultsCreated++;
      console.log(`✅ Created match result: ${matchResult.fixture_id}`);
      
    } catch (error) {
      console.error(`❌ Error creating match result ${matchResult.fixture_id}:`, error.message);
      migrationLog.errors.push(`Match result creation failed for ${matchResult.fixture_id}: ${error.message}`);
    }
  }
  
  console.log(`✅ Match result creation completed: ${migrationLog.stats.matchResultsCreated} created`);
}

/**
 * Create match odds cache in the new project
 */
async function createMatchOddsCache(matchOddsCache) {
  if (!matchOddsCache) {
    console.log('⏭️  No match odds cache to import');
    return;
  }
  
  console.log('🎲 Creating match odds cache...');
  
  try {
    const { error } = await newSupabase
      .from('match_odds_cache')
      .upsert({
        id: matchOddsCache.id,
        data: matchOddsCache.data,
        last_updated: matchOddsCache.last_updated
      });
    
    if (error) {
      throw new Error(`Failed to create match odds cache: ${error.message}`);
    }
    
    console.log('✅ Created match odds cache');
    
  } catch (error) {
    console.error('❌ Error creating match odds cache:', error.message);
    migrationLog.errors.push(`Match odds cache creation failed: ${error.message}`);
  }
}

/**
 * Update sequences to prevent ID conflicts
 */
async function updateSequences() {
  console.log('🔄 Updating sequences...');
  
  try {
    // Update bets sequence
    const { data: maxBetId } = await newSupabase
      .from('bets')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    if (maxBetId && maxBetId.length > 0) {
      await newSupabase.rpc('sql', {
        query: `SELECT setval('public.bets_id_seq', ${maxBetId[0].id + 1}, false);`
      });
    }
    
    // Update weekly performance sequence
    const { data: maxWeeklyPerfId } = await newSupabase
      .from('weekly_performance')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    if (maxWeeklyPerfId && maxWeeklyPerfId.length > 0) {
      await newSupabase.rpc('sql', {
        query: `SELECT setval('public.weekly_performance_id_seq', ${maxWeeklyPerfId[0].id + 1}, false);`
      });
    }
    
    console.log('✅ Sequences updated');
    
  } catch (error) {
    console.error('❌ Error updating sequences:', error.message);
    migrationLog.warnings.push(`Sequence update failed: ${error.message}`);
  }
}

/**
 * Save migration log
 */
async function saveMigrationLog() {
  migrationLog.endTime = new Date().toISOString();
  migrationLog.status = migrationLog.errors.length > 0 ? 'completed_with_errors' : 'completed_successfully';
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = `migration-log-${timestamp}.json`;
  
  try {
    await fs.writeFile(logPath, JSON.stringify(migrationLog, null, 2));
    console.log(`📝 Migration log saved to: ${logPath}`);
  } catch (error) {
    console.error('❌ Error saving migration log:', error.message);
  }
}

/**
 * Main import function
 */
async function main() {
  const migrationDir = process.argv[2];
  
  if (!migrationDir) {
    console.error('❌ Please provide the migration data directory path');
    console.log('Usage: node migration-import-new-project.js <migration-data-directory>');
    process.exit(1);
  }
  
  console.log('🚀 Starting Supabase Migration Data Import');
  console.log('=' .repeat(60));
  
  try {
    // Load migration data
    const migrationData = await loadMigrationData(migrationDir);
    
    // Import data in the correct order (respecting foreign key constraints)
    await createUsers(migrationData.data.users);
    await createLeagues(migrationData.data.leagues);
    await createProfiles(migrationData.data.profiles);
    await createBets(migrationData.data.bets);
    await createBetSelections(migrationData.data.betSelections);
    await createWeeklyPerformance(migrationData.data.weeklyPerformance);
    await createNews(migrationData.data.news);
    await createMatchResults(migrationData.data.matchResults);
    await createMatchOddsCache(migrationData.data.matchOddsCache);
    
    // Update sequences
    await updateSequences();
    
    // Save migration log
    await saveMigrationLog();
    
    console.log('=' .repeat(60));
    console.log('✅ Migration import completed!');
    console.log('\n📊 Migration Summary:');
    console.log(`   - Users: ${migrationLog.stats.usersCreated} created, ${migrationLog.stats.usersSkipped} skipped`);
    console.log(`   - Profiles: ${migrationLog.stats.profilesCreated} created`);
    console.log(`   - Leagues: ${migrationLog.stats.leaguesCreated} created`);
    console.log(`   - Bets: ${migrationLog.stats.betsCreated} created`);
    console.log(`   - Bet Selections: ${migrationLog.stats.betSelectionsCreated} created`);
    console.log(`   - Weekly Performance: ${migrationLog.stats.weeklyPerformanceCreated} created`);
    console.log(`   - News: ${migrationLog.stats.newsCreated} created`);
    console.log(`   - Match Results: ${migrationLog.stats.matchResultsCreated} created`);
    
    if (migrationLog.errors.length > 0) {
      console.log(`\n❌ Errors: ${migrationLog.errors.length}`);
      migrationLog.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (migrationLog.warnings.length > 0) {
      console.log(`\n⚠️  Warnings: ${migrationLog.warnings.length}`);
      migrationLog.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Verify the migration was successful by checking the data');
    console.log('2. Test user authentication and functionality');
    console.log('3. Update any hardcoded project references in your application');
    console.log('4. Consider running the rollback script if issues are found');
    
  } catch (error) {
    console.error('❌ Migration import failed:', error.message);
    migrationLog.status = 'failed';
    migrationLog.errors.push(`Migration failed: ${error.message}`);
    await saveMigrationLog();
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  main();
}

module.exports = {
  createUsers,
  createProfiles,
  createLeagues,
  createBets,
  createBetSelections,
  createWeeklyPerformance,
  createNews,
  createMatchResults,
  createMatchOddsCache,
  updateSequences,
  saveMigrationLog
};
