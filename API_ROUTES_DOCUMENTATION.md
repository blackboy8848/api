# API Routes Documentation

Quick reference for API routes on this backend (e.g. `api-topaz-psi-42.vercel.app`).  
**Full detail for every endpoint:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Quick reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/users`, `/api/users/login` | Users & login |
| GET/POST/PUT/DELETE | `/api/tours`, `/api/tours/[id]`, `/api/tours/[id]/slots` | Tours & slots with availability |
| GET/POST/PUT/DELETE | `/api/tour-reviews`, `/api/favorites`, `/api/travel-history` | Reviews, favorites, travel history |
| GET/POST/PUT/DELETE | `/api/payment-methods`, `/api/tickets` | Payment methods, tickets |
| GET/POST/PUT/DELETE | `/api/tour-slots`, `/api/tour-slot-variants`, `/api/tour-slot-variants/[id]/availability` | Slots & variants |
| GET/POST/PUT/PATCH/DELETE | `/api/bookings`, `/api/bookings/[id]` | Bookings (create, cancel, details) |
| GET/POST/PUT/DELETE | `/api/events`, `/api/blog-posts` | Events, blog posts |
| GET/POST/PUT/DELETE | `/api/leads`, `/api/leads/[id]` | Leads (Contact Us, Lead Channels) |
| GET/POST/PUT/DELETE | `/api/coupons`, `/api/coupons/[id]` | Coupons (company/event/batch) |
| GET/POST/PUT/DELETE | `/api/supervisor`, `/api/supervisor/login`, `/api/supervisor/register` | Super user / supervisor |
| POST/GET | `/api/otp` | OTP send & verify |
| GET/POST/PUT/DELETE | `/api/curated-categories`, `/api/curated-categories/[id]` | Curated categories (homepage) |
| GET/POST | `/api/mail/inbox`, `/api/mail/send`, `/api/mail/[id]` | Mail (inbox, send, get); same under `/api/email/*` |
| POST | `/api/email/tour-details` | Send tour details to all users |
| POST | `/api/subscribe` | Newsletter subscribe (save email, send thank-you email) |
| GET/POST/PUT/DELETE | `/api/policies`, `/api/policies/[id]` | Global policies (terms, FAQs, etc.) |
| GET/POST/PUT/DELETE | `/api/pickup-points` | Pickup points |
| GET/POST | `/api/members` | Members (trip participants) |
| GET/POST | `/api/upload` | Upload images to S3 |
| GET/POST | `/api/tours/[id]/itinerary-pdf` | Upload tour itinerary PDF to S3 (updates `itinerary_pdf_url`) |
| GET/POST | `/api/instagram/webhook` | Instagram/Meta webhook |

For request/response bodies, query params, and error codes, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).
