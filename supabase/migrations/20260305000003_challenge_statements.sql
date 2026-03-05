-- Epic 11 performance: store problem and outcome statements for phase-2 recommendations
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS problem_statement TEXT;
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS desired_outcome_statement TEXT;
