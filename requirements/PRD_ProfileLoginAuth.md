# PRD — Lightweight Profile, Login & Auth (MVP)

## 1. Objective

Enable users to create a **Contexta account after completing their first challenge**, allowing them to:
- Save their progress
- Return to existing challenges
- Manage their account (email + password)

Authentication will be implemented using **Supabase Auth** with a minimal profile system.

The goal is **low friction onboarding** while enabling persistence.

---

# 2. Product Principles

1. **Challenge-first experience**
   - No login required to start a challenge

2. **Delayed signup**
   - Account creation happens **after the first challenge**

3. **Minimal profile**
   - Only email and password for MVP

4. **Fast implementation**
   - Use Supabase Auth built-in functionality

---

# 3. User Flow

## 3.1 New User (No Account)

1. User lands on homepage
2. Clicks **Start a Challenge**
3. Completes the challenge flow
4. At the results/recommendations screen:

Prompt:

> "Save your progress and come back anytime"

Options:
- Create account
- Continue without account

If user chooses **Create Account**:
- Show **Sign Up form**

Fields:
- Email
- Password

After signup:
- User is logged in
- Challenge is saved to the account

---

## 3.2 Returning User

1. User opens homepage
2. Clicks **Login** in navbar
3. Login via:

Fields:
- Email
- Password

After login:
- Redirect to **Your Journey**

---

# 4. Auth System

Use:

**Supabase Auth**

Features used:
- Email/password signup
- Email/password login
- Session handling
- User ID management

Supabase manages:
- password hashing
- sessions
- auth tokens

---


# 5. Challenge Persistence

When user signs up after first challenge:

System must:

1. Create Supabase user
2. Create profile row
3. Attach existing challenge to user

Example:

```
challenge.user_id = auth.user.id
```

This allows:
- challenge history
- journey dashboard
- saved recommendations

---

# 6. Security

Handled by Supabase:

- Password hashing
- Session tokens
- Auth middleware

Frontend protection:

Routes requiring login:

```
/journey
/profile
```

Redirect if not authenticated.

---

# 7. Future Extensions (Not MVP)

Extended profile

## context management
- Role
- Experience
- Company stage

---


# 8. Success Criteria

Users can:

- complete a challenge without login
- create account after first challenge
- login later
- access their journey
- manage email/password