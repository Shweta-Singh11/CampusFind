/**
 * API Layer — components never call Supabase directly.
 * All Supabase interactions go through this module.
 */
import { supabase } from './supabase.js'
import imageCompression from 'browser-image-compression'

// ─── Helpers ────────────────────────────────────────────────────────────────

function handleError(error, friendlyMessage) {
  console.error(friendlyMessage, error)
  const detail = error?.message || error?.error_description || (typeof error === 'string' ? error : '')
  const msg = detail ? `${friendlyMessage}: ${detail}` : friendlyMessage
  throw new Error(msg)
}

async function compressImage(file) {
  if (!file) return file
  if (!file.type || !file.type.startsWith('image/')) return file
  const options = {
    maxSizeMB: 4.5,
    maxWidthOrHeight: 1920,
    useWebWorker: false,
    fileType: file.type || 'image/jpeg',
  }
  try {
    const compressed = await imageCompression(file, options)
    return compressed || file
  } catch (err) {
    console.warn('Image compression bypassed, using original file:', err)
    return file
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    if (error.message.toLowerCase().includes('invalid')) {
      throw new Error('Invalid email or password. Please try again.')
    }
    if (error.message.toLowerCase().includes('rate') || error.status === 429) {
      throw new Error('Too many failed attempts. Please wait 15 minutes before trying again.')
    }
    throw new Error(error.message || 'Sign-in failed. Please try again.')
  }
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) handleError(error, 'Sign-out failed.')
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data?.session ?? null
}

export async function getAdminProfile() {
  const { data, error } = await supabase
    .from('office_administrator')
    .select('admin_id, admin_name, admin_contact_no')
    .single()
  if (error) return null
  return data
}

// ─── Public: Found Items ─────────────────────────────────────────────────────

export async function getPublicFoundItems({ page = 1, pageSize = 12, search = '', category = '' } = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('public_found_items')
    .select('*', { count: 'exact' })
    .order('found_datetime', { ascending: false })
    .range(from, to)

  if (search.trim()) {
    query = query.or(`item_name.ilike.%${search.trim()}%,item_description.ilike.%${search.trim()}%`)
  }
  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  const { data, error, count } = await query
  if (error) handleError(error, 'Failed to load found items. Please refresh the page.')
  return { items: data ?? [], total: count ?? 0 }
}

export async function getPublicItemById(itemId) {
  const { data, error } = await supabase
    .from('public_found_items')
    .select('*')
    .eq('item_id', itemId)
    .single()
  if (error) handleError(error, 'Item not found.')
  return data
}

export function getPublicItemPhotoUrl(photoPath) {
  if (!photoPath) return null
  const { data } = supabase.storage.from('item-photos-public').getPublicUrl(photoPath)
  return data?.publicUrl ?? null
}

// ─── Public: Submit Claim ─────────────────────────────────────────────────────

export async function uploadClaimProofPhoto(file) {
  const rawName = (file && file.name) ? file.name : 'proof.jpg'
  const ext = rawName.includes('.') ? rawName.split('.').pop().toLowerCase() : 'jpg'
  const filename = `claims/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

  let uploadData = file
  try {
    uploadData = await compressImage(file)
  } catch (compErr) {
    console.warn('Compression skipped:', compErr)
    uploadData = file
  }

  const contentType = (uploadData && uploadData.type) || (file && file.type) || 'image/jpeg'

  const { error } = await supabase.storage
    .from('restricted-files')
    .upload(filename, uploadData, { contentType, upsert: false })

  if (error) {
    console.error('Proof upload error details:', error)
    if (error.message?.toLowerCase().includes('bucket not found') || error.statusCode === 404 || error.statusCode === '404' || error.error === 'Bucket not found') {
      throw new Error("Upload failed: Storage bucket 'restricted-files' was not found in Supabase. Please run 'supabase/migrations/003_storage_setup.sql' in your Supabase SQL Editor.")
    }
    if (error.message?.toLowerCase().includes('row-level security') || error.statusCode === 403 || error.statusCode === '403') {
      throw new Error("Upload failed: Permission denied by Supabase Storage RLS policy. Please run 'supabase/migrations/003_storage_setup.sql' in your Supabase SQL Editor.")
    }
    handleError(error, 'Failed to upload proof photo')
  }

  return filename
}

export async function submitClaim(payload) {
  const { data, error } = await supabase.rpc('submit_claim', payload)
  if (error) {
    // Surface friendly RPC-level errors
    if (error.message.includes('already has an active claim')) {
      throw new Error('You already have a pending or approved claim for this item.')
    }
    if (error.message.includes('item has already been returned')) {
      throw new Error('This item has already been returned to its owner.')
    }
    if (error.message.includes('proof')) {
      throw new Error('Please provide at least one form of proof (statement or photo).')
    }
    handleError(error, 'Failed to submit claim. Please check your details and try again.')
  }
  return data // returns claim_code
}

export async function trackClaim(claimCode, contactNo) {
  const { data, error } = await supabase.rpc('track_claim', {
    p_claim_code: claimCode,
    p_contact_no: contactNo,
  })
  if (error) handleError(error, 'Could not find a matching claim. Please check your claim code and contact number.')
  if (!data || data.length === 0) {
    throw new Error('No claim found with that code and contact number.')
  }
  return data[0]
}

// ─── Admin: Items ─────────────────────────────────────────────────────────────

export async function uploadItemPhoto(file, isHighValue) {
  const bucket = isHighValue ? 'restricted-files' : 'item-photos-public'
  const prefix = isHighValue ? 'items/' : ''
  const rawName = (file && file.name) ? file.name : 'item.jpg'
  const ext = rawName.includes('.') ? rawName.split('.').pop().toLowerCase() : 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`
  const fullPath = `${prefix}${filename}`

  let uploadData = file
  try {
    uploadData = await compressImage(file)
  } catch (compErr) {
    console.warn('Compression skipped:', compErr)
    uploadData = file
  }

  const contentType = (uploadData && uploadData.type) || (file && file.type) || 'image/jpeg'

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fullPath, uploadData, { contentType, upsert: false })

  if (error) {
    console.error('Item photo upload error details:', error)
    if (error.message?.toLowerCase().includes('bucket not found') || error.statusCode === 404 || error.statusCode === '404' || error.error === 'Bucket not found') {
      throw new Error(`Upload failed: Storage bucket '${bucket}' was not found in Supabase. Please run 'supabase/migrations/003_storage_setup.sql' in your Supabase SQL Editor.`)
    }
    if (error.message?.toLowerCase().includes('row-level security') || error.statusCode === 403 || error.statusCode === '403') {
      throw new Error(`Upload failed: Permission denied by Supabase Storage RLS policy for '${bucket}'. Please run 'supabase/migrations/003_storage_setup.sql' in your Supabase SQL Editor.`)
    }
    handleError(error, `Failed to upload item photo to '${bucket}'`)
  }

  return fullPath
}

export async function logFoundItem(payload) {
  const { data, error } = await supabase.rpc('log_found_item', payload)
  if (error) {
    if (error.message.includes('future')) {
      throw new Error('The "found date and time" cannot be in the future.')
    }
    handleError(error, 'Failed to log item. Please check the form and try again.')
  }
  return data
}

export async function getAdminItems({ page = 1, pageSize = 20, search = '' } = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('found_item')
    .select(`
      item_id, item_name, category, found_location, found_datetime, logged_at,
      is_high_value, item_picture_path,
      finder:finder_id(finder_name, finder_contact_no),
      logged_by_admin:logged_by(admin_name),
      item_return:item_return(item_return_id)
    `, { count: 'exact' })
    .order('logged_at', { ascending: false })
    .range(from, to)

  if (search.trim()) {
    query = query.ilike('item_name', `%${search.trim()}%`)
  }

  const { data, error, count } = await query
  if (error) handleError(error, 'Failed to load items.')
  return { items: data ?? [], total: count ?? 0 }
}

export async function getAdminItemById(itemId) {
  const { data, error } = await supabase
    .from('found_item')
    .select(`
      *,
      finder:finder_id(finder_name, finder_contact_no),
      logged_by_admin:logged_by(admin_name)
    `)
    .eq('item_id', itemId)
    .single()
  if (error) handleError(error, 'Item not found.')
  return data
}

export async function getAdminItemPhotoUrl(item) {
  if (!item?.item_picture_path) return null
  if (!item.is_high_value) {
    const { data } = supabase.storage.from('item-photos-public').getPublicUrl(item.item_picture_path)
    return data?.publicUrl ?? null
  }
  // High-value: get signed URL
  const { data, error } = await supabase.storage
    .from('restricted-files')
    .createSignedUrl(item.item_picture_path, 60 * 10) // 10 min
  if (error) return null
  return data?.signedUrl ?? null
}

// ─── Admin: Claims ───────────────────────────────────────────────────────────

export async function getAdminClaims({ page = 1, pageSize = 20, status = '', search = '' } = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('item_claim')
    .select(`
      item_claim_id, claim_code, submitted_at, claim_status, reviewed_at,
      item:item_id(item_name, found_location, is_high_value),
      claimant:claimant_id(claimant_name, claimant_contact_no, claimant_type, school_id),
      reviewed_by_admin:reviewed_by(admin_name),
      item_return:item_return(item_return_id)
    `, { count: 'exact' })
    .order('submitted_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'All') {
    query = query.eq('claim_status', status)
  }
  if (search.trim()) {
    query = query.or(`claim_code.ilike.%${search.trim()}%,claimant.claimant_name.ilike.%${search.trim()}%`)
  }

  const { data, error, count } = await query
  if (error) handleError(error, 'Failed to load claims.')
  return { claims: data ?? [], total: count ?? 0 }
}

export async function getAdminClaimById(claimId) {
  const { data, error } = await supabase
    .from('item_claim')
    .select(`
      *,
      item:item_id(*),
      claimant:claimant_id(*),
      reviewed_by_admin:reviewed_by(admin_name),
      item_return:item_return(*)
    `)
    .eq('item_claim_id', claimId)
    .single()
  if (error) handleError(error, 'Claim not found.')
  return data
}

export async function getClaimProofPhotoUrl(path) {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from('restricted-files')
    .createSignedUrl(path, 60 * 10)
  if (error) return null
  return data?.signedUrl ?? null
}

export async function reviewClaim(claimId, decision, reason = null) {
  const { data, error } = await supabase.rpc('review_claim', {
    p_claim_id: claimId,
    p_decision: decision,
    p_reason: reason,
  })
  if (error) {
    if (error.message.includes('reason')) {
      throw new Error('A rejection reason is required.')
    }
    handleError(error, 'Failed to process review. Please try again.')
  }
  return data
}

export async function getAdminClaimCounts() {
  const { data, error } = await supabase
    .from('item_claim')
    .select('claim_status')

  if (error) handleError(error, 'Failed to load claim counts.')

  const counts = { All: 0, Pending: 0, Approved: 0, Rejected: 0 }
  for (const row of data ?? []) {
    counts.All++
    counts[row.claim_status] = (counts[row.claim_status] || 0) + 1
  }
  return counts
}

// ─── Admin: Returns ──────────────────────────────────────────────────────────

export async function getApprovedAwaitingReturn({ page = 1, pageSize = 20 } = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('item_claim')
    .select(`
      item_claim_id, claim_code, claim_status, reviewed_at,
      item:item_id(item_name, found_location, category),
      claimant:claimant_id(claimant_name, claimant_contact_no, school_id),
      item_return:item_return(item_return_id)
    `, { count: 'exact' })
    .eq('claim_status', 'Approved')
    .is('item_return.item_return_id', null)
    .order('reviewed_at', { ascending: true })
    .range(from, to)

  if (error) handleError(error, 'Failed to load approved claims.')
  return { claims: data ?? [], total: count ?? 0 }
}

export async function uploadReturnEvidence(file) {
  const rawName = (file && file.name) ? file.name : 'evidence.jpg'
  const ext = rawName.includes('.') ? rawName.split('.').pop().toLowerCase() : 'jpg'
  const filename = `returns/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

  let uploadData = file
  try {
    uploadData = await compressImage(file)
  } catch (compErr) {
    console.warn('Compression skipped:', compErr)
    uploadData = file
  }

  const contentType = (uploadData && uploadData.type) || (file && file.type) || 'image/jpeg'

  const { error } = await supabase.storage
    .from('restricted-files')
    .upload(filename, uploadData, { contentType, upsert: false })

  if (error) {
    console.error('Return evidence upload error details:', error)
    if (error.message?.toLowerCase().includes('bucket not found') || error.statusCode === 404 || error.statusCode === '404') {
      throw new Error("Upload failed: Storage bucket 'restricted-files' was not found in Supabase. Please run 'supabase/migrations/003_storage_setup.sql' in your Supabase SQL Editor.")
    }
    if (error.message?.toLowerCase().includes('row-level security') || error.statusCode === 403 || error.statusCode === '403') {
      throw new Error("Upload failed: Permission denied by Supabase Storage RLS policy. Please run 'supabase/migrations/003_storage_setup.sql' in your Supabase SQL Editor.")
    }
    handleError(error, 'Failed to upload return evidence')
  }

  return filename
}

export async function recordReturn(claimId, evidencePath = null) {
  const { data, error } = await supabase.rpc('record_return', {
    p_claim_id: claimId,
    p_evidence_path: evidencePath,
  })
  if (error) {
    if (error.message.includes('Approved')) {
      throw new Error('Only approved claims can be marked as returned.')
    }
    handleError(error, 'Failed to record return. Please try again.')
  }
  return data
}

