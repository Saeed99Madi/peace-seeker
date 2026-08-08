-- Requirement: "Immutable audit log for all moderation and administrative
-- actions" (§7) and M-2 ("Moderator decisions are logged and reviewable").
--
-- Application code has no update or delete path for these tables, but an
-- application is a promise and a trigger is a guarantee. An administrator with
-- a database console must not be able to quietly rewrite the record of a
-- decision they made.

CREATE OR REPLACE FUNCTION peace_reject_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Table % is append-only: % is not permitted.', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_append_only
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION peace_reject_mutation();

CREATE TRIGGER moderation_decisions_append_only
  BEFORE UPDATE OR DELETE ON "moderation_decisions"
  FOR EACH ROW EXECUTE FUNCTION peace_reject_mutation();

-- §3.1 — a single global Voice counter, and only one. Constraining the table to
-- exactly one row makes "the counter, broken down by X" unrepresentable rather
-- than merely discouraged.
ALTER TABLE "voice_counter" ADD CONSTRAINT "voice_counter_singleton" CHECK ("id" = 1);

-- D-3 — one statement per party per stage is already a unique index; this adds
-- the other half of the symmetry guarantee, that a case never holds more than
-- two parties.
CREATE OR REPLACE FUNCTION peace_enforce_two_parties()
RETURNS TRIGGER AS $$
DECLARE
  party_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO party_count FROM "case_parties" WHERE "caseId" = NEW."caseId";
  IF party_count > 2 THEN
    RAISE EXCEPTION 'A case is between two parties.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER case_parties_two_only
  AFTER INSERT ON "case_parties"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION peace_enforce_two_parties();
