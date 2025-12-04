const { Client } = require('pg');
const fs = require('fs');

const connectionString = 'postgresql://postgres.hpflcuyxmwzrknxjgavd:Fuckgambling123!@aws-1-ca-central-1.pooler.supabase.com:6543/postgres';

async function generateSchemaDocs() {
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('🔌 Connected to database\n');

        // Get all tables
        const tablesQuery = `
            SELECT
                table_name,
                obj_description((quote_ident(table_schema) || '.' || quote_ident(table_name))::regclass, 'pg_class') as table_comment
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;

        const tablesResult = await client.query(tablesQuery);
        console.log(`📊 Found ${tablesResult.rows.length} tables\n`);

        let markdown = `# LootVibe Database Schema Documentation

*Auto-generated on ${new Date().toISOString()}*

---

## Overview

This database powers the LootVibe loot box platform, including:
- User management and authentication
- Loot box system with provably fair mechanics
- Inventory and item management
- Affiliate program
- Streamer management system
- Transaction and withdrawal tracking

---

## Tables Summary

| Table Name | Purpose |
|------------|---------|
`;

        // Add table summary
        for (const table of tablesResult.rows) {
            const purpose = table.table_comment || 'No description';
            markdown += `| \`${table.table_name}\` | ${purpose} |\n`;
        }

        markdown += '\n---\n\n## Detailed Table Schemas\n\n';

        // Get detailed info for each table
        for (const table of tablesResult.rows) {
            console.log(`📋 Processing table: ${table.table_name}`);

            markdown += `### \`${table.table_name}\`\n\n`;
            if (table.table_comment) {
                markdown += `**Description:** ${table.table_comment}\n\n`;
            }

            // Get columns
            const columnsQuery = `
                SELECT
                    column_name,
                    data_type,
                    character_maximum_length,
                    is_nullable,
                    column_default,
                    col_description((quote_ident(table_schema) || '.' || quote_ident(table_name))::regclass, ordinal_position) as column_comment
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = $1
                ORDER BY ordinal_position;
            `;

            const columnsResult = await client.query(columnsQuery, [table.table_name]);

            markdown += '**Columns:**\n\n';
            markdown += '| Column | Type | Nullable | Default | Description |\n';
            markdown += '|--------|------|----------|---------|-------------|\n';

            for (const col of columnsResult.rows) {
                const type = col.character_maximum_length
                    ? `${col.data_type}(${col.character_maximum_length})`
                    : col.data_type;
                const nullable = col.is_nullable === 'YES' ? '✓' : '✗';
                const defaultVal = col.column_default || '-';
                const comment = col.column_comment || '-';

                markdown += `| \`${col.column_name}\` | ${type} | ${nullable} | ${defaultVal} | ${comment} |\n`;
            }

            // Get foreign keys
            const fkQuery = `
                SELECT
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name = $1;
            `;

            const fkResult = await client.query(fkQuery, [table.table_name]);

            if (fkResult.rows.length > 0) {
                markdown += '\n**Relationships:**\n\n';
                for (const fk of fkResult.rows) {
                    markdown += `- \`${fk.column_name}\` → \`${fk.foreign_table_name}.${fk.foreign_column_name}\`\n`;
                }
            }

            // Get indexes
            const indexQuery = `
                SELECT
                    indexname,
                    indexdef
                FROM pg_indexes
                WHERE schemaname = 'public'
                AND tablename = $1
                AND indexname NOT LIKE '%_pkey';
            `;

            const indexResult = await client.query(indexQuery, [table.table_name]);

            if (indexResult.rows.length > 0) {
                markdown += '\n**Indexes:**\n\n';
                for (const idx of indexResult.rows) {
                    markdown += `- \`${idx.indexname}\`\n`;
                }
            }

            markdown += '\n---\n\n';
        }

        // Get functions
        const functionsQuery = `
            SELECT
                routine_name,
                routine_type,
                data_type as return_type,
                routine_definition
            FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name NOT LIKE 'pg_%'
            AND routine_name NOT LIKE 'uuid_%'
            ORDER BY routine_name;
        `;

        const functionsResult = await client.query(functionsQuery);

        if (functionsResult.rows.length > 0) {
            markdown += '## Database Functions\n\n';
            markdown += 'Custom functions for business logic and data operations.\n\n';

            for (const func of functionsResult.rows) {
                markdown += `### \`${func.routine_name}()\`\n\n`;
                markdown += `- **Type:** ${func.routine_type}\n`;
                markdown += `- **Returns:** ${func.return_type}\n\n`;
            }

            markdown += '---\n\n';
        }

        // Add RLS policies section
        const rlsQuery = `
            SELECT
                schemaname,
                tablename,
                policyname,
                permissive,
                roles,
                cmd,
                qual,
                with_check
            FROM pg_policies
            WHERE schemaname = 'public'
            ORDER BY tablename, policyname;
        `;

        const rlsResult = await client.query(rlsQuery);

        if (rlsResult.rows.length > 0) {
            markdown += '## Row Level Security (RLS) Policies\n\n';
            markdown += 'Security policies that control data access.\n\n';

            let currentTable = '';
            for (const policy of rlsResult.rows) {
                if (policy.tablename !== currentTable) {
                    if (currentTable !== '') markdown += '\n';
                    markdown += `### \`${policy.tablename}\`\n\n`;
                    currentTable = policy.tablename;
                }
                markdown += `**${policy.policyname}**\n`;
                markdown += `- Command: ${policy.cmd}\n`;
                markdown += `- Roles: ${Array.isArray(policy.roles) ? policy.roles.join(', ') : policy.roles}\n\n`;
            }

            markdown += '---\n\n';
        }

        // Add key features section
        markdown += `## Key Features

### Provably Fair System
The platform uses a cryptographic provably fair system:
- **Server Seed**: Secret seed stored server-side
- **Client Seed**: User-generated seed
- **Nonce**: Incrementing counter for each bet
- **Result**: HMAC-SHA256(serverSeed, clientSeed:nonce)

Users can verify any box opening result using the seeds and nonce.

### Streamer System (Private)
- Streamers get boosted odds on high-value items
- Multiplier ranges from 1.00x to 10.00x
- Only affects items worth ≥ box price
- Completely hidden from public view
- Only admins can see streamer status and multipliers

### Affiliate Program
- Users get unique affiliate codes
- Earn commission on referrals' wagers
- Bonus on first deposit
- Tiered commission rates based on volume

### Withdrawal System
- Support for BTC and ETH withdrawals
- Manual approval workflow
- Hot wallet monitoring
- Configurable limits and thresholds

---

## Entity Relationship Diagram

\`\`\`
users
├─→ inventory_items (user_id)
├─→ box_openings (user_id)
├─→ transactions (user_id)
├─→ withdrawals (user_id)
├─→ crypto_deposits (user_id)
├─→ shipments (user_id)
├─→ notifications (user_id)
├─→ affiliate_referrals (referrer_user_id)
├─→ affiliate_earnings (user_id)
├─→ withdrawal_limits (user_id)
└─→ streamer_activity_log (user_id, admin_id)

boxes
├─→ box_openings (box_id)
└─→ battles (box_id)

battles
└─→ battle_players (battle_id)
\`\`\`

---

*Generated by LootVibe Schema Documentation Tool*
`;

        // Save to file
        fs.writeFileSync('./DATABASE_SCHEMA.md', markdown);
        console.log('\n✅ Documentation saved to DATABASE_SCHEMA.md');

        // Also create a JSON version for programmatic access
        const schemaJson = {
            generated_at: new Date().toISOString(),
            tables: {}
        };

        for (const table of tablesResult.rows) {
            const columnsResult = await client.query(`
                SELECT
                    column_name,
                    data_type,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = $1
                ORDER BY ordinal_position;
            `, [table.table_name]);

            schemaJson.tables[table.table_name] = {
                columns: columnsResult.rows,
                comment: table.table_comment
            };
        }

        fs.writeFileSync('./database-schema.json', JSON.stringify(schemaJson, null, 2));
        console.log('✅ JSON schema saved to database-schema.json\n');

        await client.end();

    } catch (error) {
        console.error('❌ Error:', error);
        await client.end();
        process.exit(1);
    }
}

generateSchemaDocs();
