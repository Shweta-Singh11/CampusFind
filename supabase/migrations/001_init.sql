-- ============================================================
-- Migration: 001_init.sql
-- Lost and Found Management System
-- ============================================================

-- ─── Core Tables ─────────────────────────────────────────────

create table if not exists finder (
  finder_id       bigint generated always as identity primary key,
  finder_name     varchar(100),
  finder_contact_no varchar(13) unique
);

create table if not exists office_administrator (
  admin_id        bigint generated always as identity primary key,
  auth_user_id    uuid not null unique references auth.users(id) on delete cascade,
  admin_name      varchar(100) not null,
  admin_contact_no varchar(13) not null unique
);

create table if not exists found_item (
  item_id           bigint generated always as identity primary key,
  item_name         varchar(100) not null,
  category          varchar(30) not null default 'Others'
    check (category in ('Electronics','Wallets & Cards','IDs','Keys','Bags','Clothing','Books & Stationery','Others')),
  item_description  text not null,
  item_picture_path text not null,
  found_location    varchar(255) not null,
  found_datetime    timestamptz not null,
  logged_at         timestamptz not null default now(),
  is_high_value     boolean not null default false,
  finder_id         bigint references finder(finder_id) on delete set null on update cascade,
  logged_by         bigint references office_administrator(admin_id) on delete set null on update cascade
);

create table if not exists claimant (
  claimant_id       bigint generated always as identity primary key,
  claimant_name     varchar(100) not null,
  claimant_contact_no varchar(13) not null unique,
  claimant_type     varchar(30) not null check (claimant_type in ('Student','Faculty','Staff')),
  school_id         varchar(30) not null,
  cys               varchar(255),
  department        varchar(100)
);

create table if not exists item_claim (
  item_claim_id     bigint generated always as identity primary key,
  claim_code        varchar(12) not null unique,
  item_id           bigint not null references found_item(item_id) on delete restrict on update cascade,
  claimant_id       bigint not null references claimant(claimant_id) on delete restrict on update cascade,
  submitted_at      timestamptz not null default now(),
  lost_location     varchar(255),
  evidence_statement text,
  evidence_picture_path text,
  claim_status      varchar(20) not null default 'Pending'
    check (claim_status in ('Pending','Approved','Rejected')),
  reviewed_by       bigint references office_administrator(admin_id) on delete restrict on update cascade,
  reviewed_at       timestamptz,
  rejection_reason  text,
  check (evidence_statement is not null or evidence_picture_path is not null),
  check (
    (claim_status = 'Pending' and reviewed_by is null)
    or (claim_status <> 'Pending' and reviewed_by is not null)
  ),
  check (claim_status <> 'Rejected' or rejection_reason is not null)
);

-- One active (Pending or Approved) claim per person per item
create unique index if not exists uq_active_claim
  on item_claim(item_id, claimant_id)
  where claim_status <> 'Rejected';

-- Only one Approved claim per item
create unique index if not exists uq_one_approved
  on item_claim(item_id)
  where claim_status = 'Approved';

create table if not exists item_return (
  item_return_id    bigint generated always as identity primary key,
  item_claim_id     bigint not null unique references item_claim(item_claim_id) on delete cascade on update cascade,
  returned_by       bigint not null references office_administrator(admin_id) on delete restrict on update cascade,
  returned_at       timestamptz not null default now(),
  return_evidence_path text
);

-- ─── Indexes (FK + frequently filtered columns) ───────────────

create index if not exists idx_found_item_finder_id    on found_item(finder_id);
create index if not exists idx_found_item_logged_by    on found_item(logged_by);
create index if not exists idx_found_item_found_datetime on found_item(found_datetime desc);
create index if not exists idx_found_item_is_high_value on found_item(is_high_value);

create index if not exists idx_item_claim_item_id      on item_claim(item_id);
create index if not exists idx_item_claim_claimant_id  on item_claim(claimant_id);
create index if not exists idx_item_claim_reviewed_by  on item_claim(reviewed_by);
create index if not exists idx_item_claim_claim_status on item_claim(claim_status);
create index if not exists idx_item_claim_submitted_at on item_claim(submitted_at desc);

create index if not exists idx_item_return_item_claim_id on item_return(item_claim_id);
create index if not exists idx_item_return_returned_by   on item_return(returned_by);

-- ─── Helper Function ──────────────────────────────────────────

-- Returns true when the calling user is a registered administrator.
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from office_administrator
    where auth_user_id = auth.uid()
  );
$$;

-- ─── Row-Level Security ───────────────────────────────────────

alter table finder               enable row level security;
alter table office_administrator enable row level security;
alter table found_item           enable row level security;
alter table claimant             enable row level security;
alter table item_claim           enable row level security;
alter table item_return          enable row level security;

-- office_administrator
create policy "Admins can read all administrators"
  on office_administrator for select
  using (is_admin());

create policy "Admins can manage administrators"
  on office_administrator for all
  using (is_admin())
  with check (is_admin());

-- finder
create policy "Admins can manage finders"
  on finder for all
  using (is_admin())
  with check (is_admin());

-- found_item
create policy "Admins have full access to found_item"
  on found_item for all
  using (is_admin())
  with check (is_admin());

-- claimant
create policy "Admins have full access to claimant"
  on claimant for all
  using (is_admin())
  with check (is_admin());

-- item_claim
create policy "Admins have full access to item_claim"
  on item_claim for all
  using (is_admin())
  with check (is_admin());

-- item_return
create policy "Admins have full access to item_return"
  on item_return for all
  using (is_admin())
  with check (is_admin());

-- ─── Public View (definer-style security) ────────────────────
-- Anon users query this view, not the base tables.
-- NFR-002: high-value items have photo/description/location redacted.

create or replace view public_found_items
with (security_invoker = false)
as
select
  fi.item_id,
  fi.item_name,
  fi.category,
  fi.found_datetime,
  fi.logged_at,
  fi.is_high_value,
  case
    when fi.is_high_value then null
    else fi.item_description
  end as item_description,
  case
    when fi.is_high_value then null
    else fi.found_location
  end as found_location,
  case
    when fi.is_high_value then null
    else fi.item_picture_path
  end as photo_path
from found_item fi
-- Only show items that have NOT been returned
where not exists (
  select 1 from item_claim ic
  join item_return ir on ir.item_claim_id = ic.item_claim_id
  where ic.item_id = fi.item_id
);

-- Grant select on the view to anon (the view itself uses definer rights)
grant select on public_found_items to anon;

-- ─── RPC: submit_claim ───────────────────────────────────────
-- Callable by anon. Validates input, upserts claimant, creates claim.

create or replace function submit_claim(
  p_item_id             bigint,
  p_claimant_name       text,
  p_claimant_contact_no text,
  p_claimant_type       text,
  p_school_id           text,
  p_cys                 text    default null,
  p_department          text    default null,
  p_lost_location       text    default null,
  p_evidence_statement  text    default null,
  p_evidence_picture_path text  default null
)
returns text   -- returns claim_code
language plpgsql
security definer
as $$
declare
  v_claimant_id bigint;
  v_claim_code  text;
  v_is_returned boolean;
begin
  -- Validate required fields
  if p_claimant_name is null or trim(p_claimant_name) = '' then
    raise exception 'Claimant name is required.';
  end if;
  if p_claimant_contact_no is null or trim(p_claimant_contact_no) = '' then
    raise exception 'Contact number is required.';
  end if;
  if p_claimant_type not in ('Student','Faculty','Staff') then
    raise exception 'Invalid claimant type.';
  end if;
  if p_school_id is null or trim(p_school_id) = '' then
    raise exception 'School ID is required.';
  end if;

  -- At least one proof must be provided
  if (p_evidence_statement is null or trim(p_evidence_statement) = '')
     and (p_evidence_picture_path is null or trim(p_evidence_picture_path) = '') then
    raise exception 'At least one proof of ownership (statement or photo) is required.';
  end if;

  -- Check item exists and is not already returned
  select exists (
    select 1 from item_claim ic
    join item_return ir on ir.item_claim_id = ic.item_claim_id
    where ic.item_id = p_item_id
  ) into v_is_returned;

  if v_is_returned then
    raise exception 'This item has already been returned to its owner.';
  end if;

  if not exists (select 1 from found_item where item_id = p_item_id) then
    raise exception 'Item not found.';
  end if;

  -- Upsert claimant by contact number (allows re-use across multiple claims)
  insert into claimant (
    claimant_name, claimant_contact_no, claimant_type,
    school_id, cys, department
  )
  values (
    trim(p_claimant_name), trim(p_claimant_contact_no), p_claimant_type,
    trim(p_school_id), p_cys, p_department
  )
  on conflict (claimant_contact_no) do update
    set claimant_name = excluded.claimant_name,
        claimant_type = excluded.claimant_type,
        school_id     = excluded.school_id,
        cys           = coalesce(excluded.cys, claimant.cys),
        department    = coalesce(excluded.department, claimant.department)
  returning claimant_id into v_claimant_id;

  -- Generate claim code
  v_claim_code := 'CLM-' || upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));

  -- Insert claim
  insert into item_claim (
    claim_code, item_id, claimant_id,
    lost_location, evidence_statement, evidence_picture_path
  )
  values (
    v_claim_code, p_item_id, v_claimant_id,
    p_lost_location,
    nullif(trim(coalesce(p_evidence_statement, '')), ''),
    nullif(trim(coalesce(p_evidence_picture_path, '')), '')
  );

  return v_claim_code;
end;
$$;

grant execute on function submit_claim to anon;

-- ─── RPC: track_claim ────────────────────────────────────────
-- Anon-callable. Returns claim status only if code + contact match.

create or replace function track_claim(
  p_claim_code text,
  p_contact_no text
)
returns table (
  claim_code      text,
  claim_status    text,
  item_name       text,
  item_id         bigint,
  submitted_at    timestamptz,
  reviewed_at     timestamptz,
  rejection_reason text
)
language plpgsql
security definer
as $$
begin
  return query
  select
    ic.claim_code::text,
    ic.claim_status::text,
    fi.item_name::text,
    fi.item_id,
    ic.submitted_at,
    ic.reviewed_at,
    ic.rejection_reason::text
  from item_claim ic
  join claimant c  on c.claimant_id = ic.claimant_id
  join found_item fi on fi.item_id = ic.item_id
  where ic.claim_code = upper(trim(p_claim_code))
    and c.claimant_contact_no = trim(p_contact_no);
end;
$$;

grant execute on function track_claim to anon;

-- ─── RPC: log_found_item ─────────────────────────────────────
-- Admin-only. Creates optional finder + found_item record.

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
returns bigint  -- returns new item_id
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

  -- If authenticated administrator, record admin_id; otherwise null for students/finders
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
    -- Name only, no contact
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

-- ─── RPC: review_claim ───────────────────────────────────────
-- Admin-only. Approve or Reject a claim.

create or replace function review_claim(
  p_claim_id  bigint,
  p_decision  text,
  p_reason    text default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_admin_id bigint;
begin
  if not is_admin() then
    raise exception 'Unauthorized.';
  end if;

  if p_decision not in ('Approved','Rejected') then
    raise exception 'Decision must be "Approved" or "Rejected".';
  end if;

  if p_decision = 'Rejected' and (p_reason is null or trim(p_reason) = '') then
    raise exception 'A rejection reason is required.';
  end if;

  select admin_id into v_admin_id
  from office_administrator
  where auth_user_id = auth.uid();

  update item_claim
  set
    claim_status    = p_decision,
    reviewed_by     = v_admin_id,
    reviewed_at     = now(),
    rejection_reason = case when p_decision = 'Rejected' then trim(p_reason) else null end
  where item_claim_id = p_claim_id
    and claim_status = 'Pending';

  if not found then
    raise exception 'Claim not found or is no longer pending.';
  end if;
end;
$$;

grant execute on function review_claim to authenticated;

-- ─── RPC: record_return ──────────────────────────────────────
-- Admin-only. Mark an approved claim as returned.

create or replace function record_return(
  p_claim_id      bigint,
  p_evidence_path text default null
)
returns bigint  -- returns item_return_id
language plpgsql
security definer
as $$
declare
  v_admin_id      bigint;
  v_claim_status  text;
  v_return_id     bigint;
begin
  if not is_admin() then
    raise exception 'Unauthorized.';
  end if;

  select claim_status into v_claim_status
  from item_claim
  where item_claim_id = p_claim_id;

  if v_claim_status is null then
    raise exception 'Claim not found.';
  end if;

  if v_claim_status <> 'Approved' then
    raise exception 'Only Approved claims can be marked as returned.';
  end if;

  select admin_id into v_admin_id
  from office_administrator
  where auth_user_id = auth.uid();

  insert into item_return (item_claim_id, returned_by, return_evidence_path)
  values (p_claim_id, v_admin_id, nullif(trim(coalesce(p_evidence_path, '')), ''))
  returning item_return_id into v_return_id;

  return v_return_id;
end;
$$;

grant execute on function record_return to authenticated;

