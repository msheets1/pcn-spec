import { supabase } from './supabase.js'

// Load the current user's scripture data from Supabase
export async function loadUserData(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error loading user data:', error)
    return null
  }

  return data?.data || null
}

// Save the current user's scripture data to Supabase
export async function saveUserData(userId, data) {
  const { error } = await supabase
    .from('user_data')
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() })

  if (error) {
    console.error('Error saving user data:', error)
    return false
  }
  return true
}

// Load all shared scriptures (visible to all approved users)
export async function loadSharedScriptures() {
  const { data, error } = await supabase
    .from('shared_scriptures')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading shared scriptures:', error)
    return []
  }

  return data || []
}

// Share a scripture to the community
export async function shareScripture(scripture, sharedByName, sharedByUserId) {
  // Check for duplicate
  const { data: existing } = await supabase
    .from('shared_scriptures')
    .select('id')
    .eq('reference', scripture.reference || '')
    .eq('text', scripture.text)
    .single()

  if (existing) return { duplicate: true }

  const { data, error } = await supabase
    .from('shared_scriptures')
    .insert({
      type: scripture.type || 'scripture',
      reference: scripture.reference || '',
      author: scripture.author || '',
      title: scripture.title || '',
      text: scripture.text,
      language: scripture.language || 'English',
      context: scripture.context || '',
      url: scripture.url || '',
      shared_by_name: sharedByName,
      shared_by_user_id: sharedByUserId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error sharing scripture:', error)
    return { error }
  }

  return { data }
}

// Delete a shared scripture (only the person who shared it, enforced by RLS)
export async function deleteSharedScripture(id) {
  const { error } = await supabase
    .from('shared_scriptures')
    .delete()
    .eq('id', id)

  return !error
}

// Check if a user's email is on the approved list
export async function checkUserApproved(email) {
  const { data, error } = await supabase
    .from('approved_users')
    .select('email')
    .eq('email', email.toLowerCase())
    .single()

  return !error && !!data
}

// Admin: Add a user to the approved list
export async function approveUser(email, approvedByUserId) {
  const { error } = await supabase
    .from('approved_users')
    .insert({ email: email.toLowerCase(), approved_by: approvedByUserId })

  return !error
}

// Admin: Remove a user from the approved list
export async function revokeUser(email) {
  const { error } = await supabase
    .from('approved_users')
    .delete()
    .eq('email', email.toLowerCase())

  return !error
}

// Admin: List all approved users
export async function listApprovedUsers() {
  const { data, error } = await supabase
    .from('approved_users')
    .select('*')
    .order('created_at', { ascending: false })

  return data || []
}
