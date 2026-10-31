-- Read-only preview through the existing WordPress sync credential.
-- No secrets, no new public function, no write grants, no change to French data.
-- Applied through Supabase apply_migration as cfo_nl_be_server_preview_read_only.
create policy "CFO server may preview reviewed Dutch translations"
on public.cfo_content_translations
for select to anon
using (
  source_system = 'wordpress'
  and locale = 'nl-BE'
  and status in ('review', 'approved')
  and (select private.wp_sync_authorized())
);
