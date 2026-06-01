-- Cap uploads to the attachments bucket at 15 MB per file.
-- Enforced server-side by Supabase Storage, independent of the client UI,
-- so an oversized file is rejected even if the upload is attempted directly.
update storage.buckets
set file_size_limit = 15728640 -- 15 * 1024 * 1024
where id = 'attachments';
