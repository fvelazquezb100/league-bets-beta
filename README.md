# League Bets Beta

## Project Overview

This is a League Bets application built with React, TypeScript, and Supabase, featuring a staging/production environment setup using Supabase Branching 2.0.

## Development Workflow

### 🏗️ Environment Strategy
- **Development**: Local development with staging database
- **Staging**: `staging2` branch → Staging Supabase project (`sbfgxxdpppgtgiclmctc`)
- **Production**: `main` branch → Production Supabase project (`lflxrkkzudsecvdfdxwl`)

### �� Workflow Process
1. **Work on staging**: All development happens on the `staging2` branch
2. **Test on staging**: Use staging Supabase project for testing
3. **Deploy to production**: Merge `staging2` → `main` and deploy

### 🗄️ Supabase Configuration
- **No Docker**: We operate directly with remote Supabase instances
- **Environment Variables**: All project references use environment variables
- **Branching 2.0**: Using Supabase's new branching feature for staging

## Project Setup

### Prerequisites
- Node.js & npm installed
- Supabase CLI installed
- Access to both staging and production Supabase projects

### Installation
```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd league-bets-beta

# Install dependencies
npm install

# Set up environment variables (see Environment Configuration below)
```

## Environment Configuration

### Staging Environment (`.env`)
```env
VITE_SUPABASE_URL=https://sbfgxxdpppgtgiclmctc.supabase.co
VITE_SUPABASE_ANON_KEY=[staging_anon_key]
```

### Production Environment (`.env.production`)
```env
VITE_SUPABASE_URL=https://lflxrkkzudsecvdfdxwl.supabase.co
VITE_SUPABASE_ANON_KEY=[production_anon_key]
```

## Available Scripts

### Development
```bash
npm run dev              # Local development (staging environment)
npm run dev:staging      # Explicit staging mode
```

### Building
```bash
npm run build            # Build for current environment
npm run build:staging    # Build for staging
npm run build:production # Build for production
```

### Supabase Operations

#### Staging Operations
```bash
npm run supabase:staging:push     # Push schema changes to staging
npm run supabase:staging:deploy   # Deploy functions to staging
npm run supabase:staging:migrate  # Run migrations on staging
```

#### Production Operations
```bash
npm run supabase:prod:push        # Push schema changes to production
npm run supabase:prod:deploy      # Deploy functions to production
npm run supabase:prod:migrate     # Run migrations on production
```

### Migration Scripts
```bash
npm run extract    # Extract data from old project
npm run import     # Import data to new project
npm run validate   # Validate migration
npm run rollback   # Rollback migration
npm run migrate    # Full migration process
```

## Supabase Project IDs

- **Production**: `lflxrkkzudsecvdfdxwl`
- **Staging**: `sbfgxxdpppgtgiclmctc`

## Development Guidelines

### Database Changes
1. **Always test on staging first**
2. **Use environment-specific scripts** (never hardcode project IDs)
3. **Create migrations using**: `npx supabase migration new [name]`
4. **Ask before pushing migrations** (per project rules)

### Code Changes
1. **Work on `staging2` branch**
2. **Use environment variables** for all Supabase URLs
3. **Test thoroughly on staging** before merging to main
4. **Never hardcode project IDs** in committed files

### Deployment Process
1. **Develop and test on `staging2` branch**
2. **Merge `staging2` → `main`**
3. **Deploy to production** using production scripts
4. **Update Vercel environment variables** as needed

## Technologies Used

- **Frontend**: Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **Deployment**: Vercel
- **Database**: Supabase Branching 2.0

## Important Notes

- **No Docker**: We work directly with remote Supabase instances
- **Environment Safety**: All configurations use environment variables
- **Migration Safety**: Always ask before pushing database changes
- **Staging First**: All development happens on staging before production

## Troubleshooting

### Common Issues
1. **Wrong project ID**: Check your `.env` file matches your current branch
2. **Migration errors**: Ensure you're using the correct project-ref flag
3. **Function deployment**: Use environment-specific deploy scripts

### Getting Help
- Check environment variables are set correctly
- Verify you're on the right Git branch
- Use the appropriate npm scripts for your environment