
-- Migration 021: Line-aware product stage flows.
-- Backfill line_id from the existing stage-to-line mapping.

-- 0. Clean up line_id if partially added in previous failed run
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_stage_flow' AND COLUMN_NAME = 'line_id');
SET @drop_col = IF(@col > 0, 'ALTER TABLE product_stage_flow DROP COLUMN line_id', 'SELECT 1');
PREPARE stmt_drop FROM @drop_col;
EXECUTE stmt_drop;
DEALLOCATE PREPARE stmt_drop;

-- 1. Add line_id to product_stage_flow.
ALTER TABLE product_stage_flow
    ADD COLUMN line_id INT NULL AFTER product_id;

-- 2. Populate each flow's line from its existing stage.
UPDATE product_stage_flow psf
JOIN stages s ON s.id = psf.stage_id
SET psf.line_id = s.line_id;

-- 3. Require a valid line for every flow.
ALTER TABLE product_stage_flow
    MODIFY COLUMN line_id INT NOT NULL;

-- 4. Temporary index to support foreign key fk_psf_product
ALTER TABLE product_stage_flow
    ADD INDEX idx_temp_product (product_id);

-- 5. Remove old product-only unique indexes.
ALTER TABLE product_stage_flow
    DROP INDEX uq_product_stage,
    DROP INDEX uq_product_sequence;

-- 6. Renumber sequences independently per product and line.
CREATE TEMPORARY TABLE tmp_psf_line_sequence AS
SELECT
    id,
    ROW_NUMBER() OVER (
        PARTITION BY product_id, line_id
        ORDER BY sequence_no, id
    ) AS new_sequence_no
FROM product_stage_flow;

UPDATE product_stage_flow psf
JOIN tmp_psf_line_sequence t ON t.id = psf.id
SET psf.sequence_no = t.new_sequence_no;

DROP TEMPORARY TABLE tmp_psf_line_sequence;

-- 7. Add line-aware unique constraints and foreign key.
ALTER TABLE product_stage_flow
    ADD CONSTRAINT uq_product_line_stage
        UNIQUE (product_id, line_id, stage_id),
    ADD CONSTRAINT uq_product_line_sequence
        UNIQUE (product_id, line_id, sequence_no),
    ADD CONSTRAINT fk_psf_line
        FOREIGN KEY (line_id)
        REFERENCES production_lines(id);

-- 8. Remove temporary index
ALTER TABLE product_stage_flow
    DROP INDEX idx_temp_product;
