-- Switch email verification from a long link token to a six-digit OTP.
--
-- The previous table stored hashed link tokens. Those links are being retired,
-- so pending (unused) tokens are intentionally discarded: affected users can
-- request a fresh code from the app.

DROP TABLE "email_verification_tokens";

CREATE TABLE "email_verification_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "email_verification_codes_userId_idx"
    ON "email_verification_codes"("userId");

ALTER TABLE "email_verification_codes"
    ADD CONSTRAINT "email_verification_codes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
