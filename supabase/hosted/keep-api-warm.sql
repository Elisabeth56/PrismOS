-- Keeps the Render API awake by pinging /health every 10 minutes from the database.
-- Run once in the hosted project's SQL editor. Not a migration: it names the production URL, and the
-- local stack doesn't need it. GitHub's scheduled workflow (keep-warm.yml) is the backup, but GitHub
-- delays scheduled runs by hours on a quiet repo, so it can't do this job alone.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'keep-api-warm',
  '*/10 * * * *',
  $$ select net.http_get('https://prismos-1.onrender.com/health', timeout_milliseconds := 60000) $$
);

-- To check it: select * from cron.job_run_details order by start_time desc limit 5;
-- To stop it:  select cron.unschedule('keep-api-warm');
