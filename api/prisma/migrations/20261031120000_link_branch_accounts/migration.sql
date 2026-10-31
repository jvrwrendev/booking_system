-- Branch accounts store their branch id on the user record. Older seeded and
-- self-registered accounts could point at an id that had no matching row in
-- "branches", which made branch-order creation fail with "Branch not found".
-- Backfill one branch row per orphaned branch account.
INSERT INTO "branches" ("id", "name", "status", "createdAt", "updatedAt")
SELECT
    u."branchId",
    CASE
        WHEN u."name" ILIKE '%branch%' THEN u."name"
        ELSE u."name" || ' Branch'
    END,
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users" u
LEFT JOIN "branches" b ON b."id" = u."branchId"
WHERE u."role" = 'BRANCH'
    AND u."branchId" IS NOT NULL
    AND b."id" IS NULL
ON CONFLICT ("id") DO NOTHING;
