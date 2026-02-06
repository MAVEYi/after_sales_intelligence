# Database Setup Guide for Alpha-2

## Prerequisites

- Supabase account (you already have one)
- Access to Supabase SQL Editor

---

## Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select your project: `knxetrlfdvacgxomvlkn`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

---

## Step 2: Run the Setup Script

1. Copy the entire contents of this file:

   ```
   backend/src/db/setup.sql
   ```

2. Paste it into the Supabase SQL Editor

3. Click **Run** or press `Ctrl/Cmd + Enter`

4. You should see a success message like:
   ```
   Success. No rows returned.
   ```

---

## Step 3: Verify Tables Were Created

Run this query in the SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'db3_%'
ORDER BY table_name;
```

You should see:

- `db3_brand_contacts`
- `db3_cases` (your existing table)
- `db3_investigations`
- `db3_signals`

---

## Step 4: Verify Sample Data

Run this query:

```sql
SELECT brand_name, contact_type, contact_value, city
FROM db3_brand_contacts
ORDER BY brand_name;
```

You should see dummy contact data for:

- Samsung (phone, email, service centers in Mumbai & Delhi)
- LG (phone, email, service center in Bangalore)
- OnePlus (phone, email, website)

---

## Troubleshooting

### Error: "relation already exists"

This means tables were already created. You can either:

- Ignore it (tables exist, that's good!)
- Or drop and recreate by running:
  ```sql
  DROP TABLE IF EXISTS db3_investigations CASCADE;
  DROP TABLE IF EXISTS db3_brand_contacts CASCADE;
  DROP TABLE IF EXISTS db3_signals CASCADE;
  ```
  Then run setup.sql again.

### Error: "permission denied"

Make sure you're logged in to the correct Supabase project.

---

## Next Steps

After database setup is complete:

1. ✅ Get your Groq API key (see `groq-setup-guide.md`)
2. ✅ Add it to `backend/.env`
3. ✅ Start the backend: `npm run dev`
4. ✅ Test Agent 0: `curl -X POST http://localhost:4000/api/signals/fetch`
