-- Ensuring a single ROOT at the PostgreSQL level
CREATE UNIQUE INDEX "only_one_root_idx" ON "admins"("role") WHERE "role" = 'ROOT';