# System Instruction

**You must update the "Current Status" section of this file immediately after every successful feature implementation.**

---

# Project Overview

**Haul** is an estate sale discovery platform built with Next.js 16, React 19, Supabase, and Google Maps. It connects estate sale shoppers with both professional liquidation companies and private sellers.

**Tech Stack:**
- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- Backend: Supabase (PostgreSQL, Auth, Storage)
- Maps: Google Maps API via @react-google-maps/api
- Auth: Supabase Auth (Google OAuth + Email/Password)

**Design System:**
- Primary: `#2D3B2D` (Deep Green)
- Secondary: `#B8A88A` (Taupe/Gold)
- Background: `#FDFBF7` (Off-white/Cream)
- Typography: Playfair Display (headings), system sans-serif (body)

---

# Current Status

## Working Routes & Pages

| Route | Page | Status |
|-------|------|--------|
| `/` | Landing page with search | Working |
| `/sales` | Browse all published sales with city/zip filter | Working |
| `/sales/[id]` | Sale detail page with photos, map modal, directions | Working |
| `/signin` | Email/password + Google OAuth sign-in | Working |
| `/signup` | Registration with user type selection | Working |
| `/list` | Choose listing type (Company vs Private) | Working |
| `/list/company` | Company profile setup form | Working |
| `/list/company/create` | Create sale listing (company) | Working |
| `/list/private` | Create sale listing (private seller) | Working |
| `/list/success` | Listing success confirmation | Working |
| `/dashboard` | Company dashboard | Working |
| `/auth/callback` | OAuth callback handler | Working |

## Backend Logic

| Feature | Status |
|---------|--------|
| Supabase Auth (email/password) | Working |
| Supabase Auth (Google OAuth) | Working |
| Profile auto-creation on signup (DB trigger) | Working |
| Company CRUD | Working |
| Sales CRUD | Working |
| Row-Level Security (RLS) policies | Working |
| Image upload to Supabase Storage | Working |
| Video upload to Supabase Storage | Working |

## Database Schema

- `profiles` - User profiles (extends auth.users)
- `companies` - Estate sale company profiles
- `sales` - Estate sale listings (supports company + private sellers)
- `saved_sales` - Buyer favorites/bookmarks

## Components

| Component | Location | Status |
|-----------|----------|--------|
| Navbar | `app/components/Navbar.tsx` | Working |
| SalesMap | `app/components/SalesMap.tsx` | Working |
| MapModal | `app/components/MapModal.tsx` | Working |
| Map (provider) | `app/components/Map.tsx` | Working |
| LocationMap | `app/components/LocationMap.tsx` | Working |
| LocationAutocomplete | `app/components/LocationAutocomplete.tsx` | Working |
| GoogleIcon | `app/components/GoogleIcon.tsx` | Working |

## Lib/Utilities

| File | Purpose | Status |
|------|---------|--------|
| `lib/supabase.ts` | Server Supabase client | Working |
| `lib/supabase-browser.ts` | Browser Supabase client | Working |
| `lib/database.types.ts` | TypeScript types for DB | Working |
| `lib/storage.ts` | Supabase Storage upload helpers | Working |

---

# Todo/Missing

## High Priority

- [ ] **Saved sales UI for buyers** - Heart icon exists on sale detail but save functionality is not wired up
- [x] **Real geocoding** - MapModal now geocodes the full address for accurate map pins
- [x] **Company logo upload** - Logo upload wired up on company profile page
- [x] **Dashboard: list of company's sales** - Dashboard now displays all company sales with status badges
- [x] **Dashboard: edit company profile** - Company Profile page at `/dashboard/company`
- [x] **Edit/delete sales** - Edit page at `/dashboard/sales/[id]/edit` with delete option

## Medium Priority

- [ ] **Search refinement** - Sort dropdown on `/sales` is non-functional
- [ ] **Featured sales display** - `is_featured` field exists but no visual distinction
- [ ] **Sale status indicators** - Show if sale is upcoming, ongoing, or ended
- [ ] **Pagination** - Sales list loads all at once; needs pagination for scale
- [ ] **Image optimization** - No resizing/compression before upload

## Low Priority

- [ ] **Email notifications** - No email system for sale alerts
- [ ] **User reviews/ratings** - No review system for companies
- [ ] **Admin dashboard** - No admin interface
- [ ] **Analytics tracking** - No usage analytics
- [ ] **Payment/promoted listings** - No monetization features

## Known Issues

- None currently

---

# Dev Server Startup Guide

**IMPORTANT: The Next.js dev server takes a long time to start and produces NO OUTPUT until it's ready.**

## Quick Start Prompt

When starting a new session, just say:
> "Start the server and wait 2 minutes for it to be ready"

## How to Start the Server

```bash
npm run dev
```

Then **wait 90-120 seconds** before the server responds. The terminal will only show:
```
> haul@0.1.0 dev
> next dev
```

There is NO additional output until compilation completes. This is normal behavior for Next.js 16 with Turbopack.

## Verifying the Server is Running

Do NOT assume the server failed just because there's no output. Instead:

1. **Wait at least 90 seconds** after running `npm run dev`
2. Test with: `curl http://localhost:3000`
3. The server is ready when curl returns HTML

## If the Server Seems Stuck

Before troubleshooting, try these steps IN ORDER:

1. **Wait longer** - First startup after `rm -rf .next` can take 2+ minutes
2. **Check if process exists**: `ps aux | grep next`
3. **Only if truly stuck**, kill and restart:
   ```bash
   pkill -9 -f "next"
   rm -rf .next node_modules
   npm install
   npm run dev
   # Wait 90-120 seconds
   ```

## Why This Happens

- Next.js 16 + Turbopack + React 19 has slow cold starts
- Node.js v24 may have compatibility quirks
- The `.next` cache speeds up subsequent starts significantly

**DO NOT repeatedly kill and restart the server. Give it time.**

## Recently Completed

- **2025-01-26**: "Search this area" button on map - pan/zoom map and search for sales in new visible area
- **2025-01-26**: Map centering based on search query (geocodes searched location instead of hardcoded Austin)
- **2025-01-26**: Location autocomplete search on homepage and /sales page using Google Places API
- **2025-01-25**: Company logo upload on profile page
- **2025-01-25**: Edit/delete sales functionality (`/dashboard/sales/[id]/edit`)
- **2025-01-25**: Image upload to Supabase Storage wired up (photos + video)
- **2025-01-25**: Dashboard now fetches and displays company's sales with Published/Draft badges
- **2025-01-25**: Sale detail page now displays actual uploaded photos with carousel navigation
- **2025-01-25**: Fixed broken dashboard links to point to correct routes
- **2025-01-25**: MapModal now uses Google Geocoding API for accurate address pins
- **2025-01-25**: Hero image selection added to photo upload (star icon to select, reorders on save)
- **2025-01-25**: Account dropdown in Navbar (replaces email display with user icon + dropdown)
- **2025-01-25**: Company Profile page (`/dashboard/company`) - edit company info
- **2025-01-25**: Account Settings page (`/account/settings`) - manage profile, email, password
- **2025-01-25**: Enhanced Dashboard with stats cards, status badges (Draft/Upcoming/Active/Ended), thumbnail previews
