# API Routes Documentation

Table of Contents and quick reference for API routes on this backend (e.g. `api-topaz-psi-42.vercel.app`).

## Table of Contents

- [Curated Categories](#curated-categories)
- [Other APIs](#other-apis)

---

## Curated Categories

Full reference: [CURATED_CATEGORIES_API.md](./CURATED_CATEGORIES_API.md).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/curated-categories` | List (optional `?active=1` or `?active=0`) |
| GET | `/api/curated-categories/:id` | Get one |
| POST | `/api/curated-categories` | Create |
| PUT | `/api/curated-categories/:id` | Update |
| DELETE | `/api/curated-categories/:id` | Delete |

**Request body for create/update:** `name`, `image`, `tag`, `main_category`, `sub_category`, `sort_order`, `is_active`. Only `name` is required for create.

---

## Other APIs

For full details (users, tours, bookings, coupons, leads, supervisor, OTP, mail, etc.), see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).
