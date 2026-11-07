-- ============================================================
-- Migration: 002_allow_student_log_item.sql
-- Enables students and community members to log found items
-- ============================================================

-- 1. Make logged_by nullable so student/finder submissions are supported
alter table found_item
  alter column logged_by drop not null;

-- 2. Update log_found_item function to be callable by both anon and authenticated
create or replace function log_found_item(
  p_item_name         text,
  p_category          text,
  p_item_description  text,
  p_item_picture_path text,
  p_found_location    text,
  p_found_datetime    timestamptz,
  p_is_high_value     boolean  default false,
  p_finder_name       text     default null,
  p_finder_contact_no text     default null
)
returns bigint
language plpgsql
security definer
as $$
declare
  v_admin_id  bigint := null;
  v_finder_id bigint := null;
  v_item_id   bigint;
begin
  -- Validate required fields
  if p_item_name is null or trim(p_item_name) = '' then
    raise exception 'Item name is required.';
  end if;
  if p_item_picture_path is null or trim(p_item_picture_path) = '' then
    raise exception 'Item picture is required.';
  end if;
  if p_found_location is null or trim(p_found_location) = '' then
    raise exception 'Found location is required.';
  end if;

  -- Reject future found_datetime
  if p_found_datetime > now() then
    raise exception 'Found date and time cannot be in the future.';
  end if;

  -- If an authenticated administrator is calling, record their admin_id; otherwise null
  if is_admin() then
    select admin_id into v_admin_id
    from office_administrator
    where auth_user_id = auth.uid();
  end if;

  -- Upsert finder if info provided
  if p_finder_contact_no is not null and trim(p_finder_contact_no) <> '' then
    insert into finder (finder_name, finder_contact_no)
    values (trim(p_finder_name), trim(p_finder_contact_no))
    on conflict (finder_contact_no) do update
      set finder_name = coalesce(excluded.finder_name, finder.finder_name)
    returning finder_id into v_finder_id;
  elsif p_finder_name is not null and trim(p_finder_name) <> '' then
    insert into finder (finder_name) values (trim(p_finder_name))
    returning finder_id into v_finder_id;
  end if;

  -- Insert item
  insert into found_item (
    item_name, category, item_description, item_picture_path,
    found_location, found_datetime, is_high_value, finder_id, logged_by
  )
  values (
    trim(p_item_name), p_category, trim(p_item_description), p_item_picture_path,
    trim(p_found_location), p_found_datetime, p_is_high_value, v_finder_id, v_admin_id
  )
  returning item_id into v_item_id;

  return v_item_id;
end;
$$;

grant execute on function log_found_item to anon, authenticated;

