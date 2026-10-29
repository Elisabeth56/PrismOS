-- The pipeline names conflicts c1, c2... in spec order and the resolver answers by that name (ADR-003).
-- Storing it lets a resumed run upsert the same conflicts instead of adding duplicates.

alter table public.conflicts add column label text;
update public.conflicts c set label = 'c' || n.rn
  from (select id, row_number() over (partition by run_id order by created_at, id) as rn from public.conflicts) n
  where n.id = c.id;
alter table public.conflicts
  alter column label set not null,
  add constraint conflicts_label_format check (label ~ '^c[1-9][0-9]*$'),
  add constraint conflicts_run_label_key unique (run_id, label);
