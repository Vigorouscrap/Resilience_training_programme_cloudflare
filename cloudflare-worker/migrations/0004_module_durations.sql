ALTER TABLE module_runs ADD COLUMN practice_duration_seconds INTEGER;
ALTER TABLE module_runs ADD COLUMN elapsed_duration_seconds INTEGER;
-- Historical timer values cannot be reconstructed. Preserve only known elapsed time.
UPDATE module_runs SET elapsed_duration_seconds = duration_seconds WHERE status = 'completed';
