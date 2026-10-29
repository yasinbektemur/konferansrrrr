/** Use with the opportunities alias `o` on every public catalog projection. */
export const institutionalVisibility = `NOT EXISTS (
  SELECT 1 FROM institutional_listings il JOIN institution_accounts ia ON ia.institution_id=il.institution_id
  WHERE il.opportunity_id=o.id AND ia.status!='verified'
)`;
