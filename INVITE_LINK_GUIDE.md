# 📝 INVITE LINK FLOW - How It Works

## ✅ Current Status

The invite link **is working** - it's generating correctly! 

The link `http://localhost:5173/signup?invite=xxx&email=xxx` is going to your existing signup page, which is perfect.

## 🔧 What You Need to Do

Your SignupPage needs to be updated to handle the invite parameters. Here's what needs to happen:

### Step 1: Update SignupPage.tsx

The page needs to:
1. **Read URL parameters** (`invite` and `email`)
2. **Load the invite data** from database
3. **Pre-fill the form** with invite information
4. **Link the profile** when user signs up

### Step 2: The Flow

**Current Flow:**
```
1. Admin creates invite → Gets link
2. User clicks link → Goes to /signup page
3. Signup page loads → (Currently doesn't read invite params)
4. User fills form → Creates new account
5. ❌ Invite profile not linked to new user
```

**Fixed Flow:**
```
1. Admin creates invite → Gets link with invite ID
2. User clicks link → Goes to /signup?invite=xxx&email=xxx
3. Signup page → Reads URL params
4. Load invite from database → Pre-fill name and email
5. User sets password → Creates account
6. Update invite profile → Set user_id and status='active'
7. ✅ User can login with their role!
```

## 📋 Quick Fix Code

Add this to your `SignupPage.tsx` (at the top of the component):

```tsx
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

// Inside component:
const [searchParams] = useSearchParams();
const inviteId = searchParams.get('invite');
const inviteEmail = searchParams.get('email');
const [inviteData, setInviteData] = useState(null);

useEffect(() => {
  if (inviteId) {
    loadInviteData();
  }
}, [inviteId]);

const loadInviteData = async () => {
  const { data } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', inviteId)
    .eq('status', 'pending')
    .single();
  
  if (data) {
    setInviteData(data);
    // Pre-fill form with invite data
    setFormData(prev => ({
      ...prev,
      name: data.name,
      email: data.email
    }));
  }
};
```

Then in your `handleSubmit` function, after creating the user:

```tsx
// After successful signup:
if (inviteId && inviteData) {
  // Link the invite to the new user
  await supabase
    .from('user_profiles')
    .update({
      user_id: authData.user.id,
      status: 'active'
    })
    .eq('id', inviteId);
} else {
  // Regular signup - create new profile
  await supabase
    .from('user_profiles')
    .insert({
      user_id: authData.user.id,
      email: formData.email,
      name: formData.name,
      role: 'agent',
      status: 'active'
    });
}
```

## ✅ Expected Behavior After Fix

**When user clicks invite link:**
1. Opens `/signup?invite=xxx&email=xxx`
2. Form shows with **name and email already filled in**
3. User only needs to **set password**
4. On submit → Creates auth user
5. Updates invite profile → Links to new user_id
6. User can login → Has the role from invite! 🎉

## 🎯 Alternative: Simple Redirect

If you want a quick test, you can also just redirect invite links to the existing signup and handle it there:

```tsx
// In your SignupPage useEffect:
useEffect(() => {
  if (inviteId) {
    alert(`Welcome! You've been invited. Your email: ${inviteEmail }`);
    // Form will pre-fill automatically since we set email in useState
  }
}, [inviteId]);
```

## 📝 Summary

**The invite system IS working!** It's creating pending profiles and generating links correctly.

You just need to update the `/signup` page to:
- Read the URL parameters
- Load and display the invite data
- Link the profile when user completes signup

**Would you like me to create a complete replacement SignupPage.tsx file that handles invites?** Or you can manually add the code snippets above to your existing page.
