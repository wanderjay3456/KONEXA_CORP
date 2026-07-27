-- Cover the final reviewer foreign key reported by the Supabase performance advisor.
create index if not exists konexa_applications_reviewer_idx
on public.konexa_applications(reviewed_by)
where reviewed_by is not null;
