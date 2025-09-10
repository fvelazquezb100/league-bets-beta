# Supabase User Migration Guide

This guide provides step-by-step instructions for migrating users and their data from your old Supabase project to a new one. The migration process is designed to minimize disruption and ensure data integrity.

## ⚠️ Important Warnings

- **This is a live environment migration** - plan accordingly
- **Backup your data** before starting the migration
- **Test the migration process** in a development environment first
- **Coordinate with your team** to minimize user disruption
- **Have a rollback plan** ready in case issues arise

## 📋 Prerequisites

- Node.js installed on your system
- Access to both old and new Supabase projects
- Service role keys for both projects
- Sufficient permissions to manage users and data

## 🏗️ Project Information

### Old Project
- **Project ID**: `jhsjszflscbpcfzuurwq`
- **URL**: `https://jhsjszflscbpcfzuurwq.supabase.co`
- **Service Key**: `sb_secret_LeZr-ZgkpGrSodT8llyx1Q_dTYiiGhm`

### New Project
- **Project ID**: `lflxrkkzudsecvdfdxwl`
- **URL**: `https://lflxrkkzudsecvdfdxwl.supabase.co`
- **Service Key**: `sb_secret_A22qw961Z_bCCcMwnnxWZw_t7xleJt_`

## 📦 Installation

1. Install required dependencies:
```bash
npm install @supabase/supabase-js
```

2. Ensure all migration scripts are in your project directory:
- `migration-extract-old-project.js`
- `migration-import-new-project.js`
- `migration-validate.js`
- `migration-rollback.js`

## 🚀 Migration Process

### Step 1: Extract Data from Old Project

Run the extraction script on the **OLD** project to export all user data and related information:

```bash
node migration-extract-old-project.js
```

This script will:
- Extract all users from `auth.users`
- Extract all profiles, leagues, bets, and related data
- Generate user mapping for tracking old → new user IDs
- Validate data integrity
- Save everything to timestamped JSON files

**Output**: A directory named `migration-data-YYYY-MM-DDTHH-MM-SS-sssZ/` containing:
- `migration-data.json` - Complete migration data
- `user-mapping.json` - User ID mapping
- `summary.json` - Migration summary
- Individual table files for debugging

### Step 2: Import Data to New Project

Run the import script on the **NEW** project to import all the extracted data:

```bash
node migration-import-new-project.js <migration-data-directory>
```

Replace `<migration-data-directory>` with the directory created in Step 1.

This script will:
- Create users in the new project (skip existing ones)
- Import all profiles, leagues, bets, and related data
- Update user ID references to maintain relationships
- Update database sequences to prevent ID conflicts
- Generate detailed migration logs

**Output**: A migration log file with detailed results and any errors.

### Step 3: Validate Migration

Run the validation script to verify the migration was successful:

```bash
node migration-validate.js <migration-data-directory>
```

This script will:
- Compare data between old and new projects
- Validate user ID mappings
- Check data integrity and relationships
- Generate a comprehensive validation report

**Output**: A validation results file with pass/fail status for each table.

### Step 4: Update Application Configuration

Update your application to point to the new project:

1. **Update environment variables**:
   ```bash
   VITE_SUPABASE_URL=https://lflxrkkzudsecvdfdxwl.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-new-anon-key>
   ```

2. **Update any hardcoded project references** in your code

3. **Test user authentication** and core functionality

## 🔄 Rollback Procedure

If issues are discovered after migration, you can rollback using the rollback script:

```bash
node migration-rollback.js <migration-data-directory> --confirm
```

**⚠️ WARNING**: This will DELETE all migrated data from the new project!

The rollback script will:
- Delete all imported data in reverse order
- Remove all migrated users
- Reset database sequences
- Generate a rollback log

## 📊 Data Tables Migrated

The migration process handles the following tables:

| Table | Description | Dependencies |
|-------|-------------|--------------|
| `auth.users` | User authentication data | None |
| `profiles` | User profile information | `auth.users`, `leagues` |
| `leagues` | League configurations | None |
| `bets` | User betting data | `profiles` |
| `bet_selections` | Individual bet selections | `bets` |
| `weekly_performance` | User performance tracking | `profiles`, `leagues` |
| `news` | News articles | `profiles` |
| `match_results` | Match outcome data | None |
| `match_odds_cache` | Cached odds data | None |

## 🔍 Troubleshooting

### Common Issues

1. **User creation fails**
   - Check if user already exists in new project
   - Verify email format and uniqueness
   - Check service role permissions

2. **Foreign key constraint errors**
   - Ensure data is imported in correct order
   - Check user ID mappings
   - Verify league IDs exist

3. **Sequence conflicts**
   - Run the sequence update function
   - Check for duplicate IDs
   - Verify sequence values

### Error Handling

- All scripts generate detailed logs
- Check log files for specific error messages
- Use validation script to identify data inconsistencies
- Consider partial rollback if only some data is problematic

## 📝 Log Files

The migration process generates several log files:

- `migration-log-<timestamp>.json` - Import process log
- `validation-results-<timestamp>.json` - Validation results
- `rollback-log-<timestamp>.json` - Rollback process log

Each log contains:
- Timestamps and status information
- Detailed error messages
- Statistics on processed records
- Warnings and recommendations

## 🛡️ Security Considerations

- **Service keys are sensitive** - keep them secure
- **Rotate keys** after migration completion
- **Monitor access logs** during migration
- **Use least privilege** principles for service accounts

## 📞 Support

If you encounter issues during migration:

1. Check the log files for detailed error messages
2. Verify your project configurations
3. Ensure you have proper permissions
4. Test in a development environment first

## 🎯 Best Practices

1. **Plan the migration window** during low-usage periods
2. **Communicate with users** about potential downtime
3. **Monitor system performance** during migration
4. **Have a rollback plan** ready
5. **Test thoroughly** before going live
6. **Keep old project** as backup until migration is confirmed successful

## 📈 Performance Considerations

- Migration scripts are designed to handle large datasets
- Data is processed in batches to avoid memory issues
- Foreign key constraints are respected during import
- Sequences are updated to prevent ID conflicts

## 🔐 Data Privacy

- User data is handled securely during migration
- No data is stored permanently in migration scripts
- All temporary files are cleaned up after migration
- User passwords are not migrated (users will need to reset)

---

**Remember**: This is a complex migration process. Take your time, test thoroughly, and don't hesitate to rollback if issues arise. The goal is to minimize disruption to your users while ensuring data integrity.
