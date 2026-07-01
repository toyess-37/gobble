## Local Development & Seeding

If you need to seed your local database for testing authentication and matchmaking, use the standalone seed script:

```bash
node server/scripts/seed.js
```

**WARNING:** This script creates test users with known, hardcoded credentials (`password123`). It is for local development only. **NEVER** run this script against a production database or commit it alongside a production database connection string.