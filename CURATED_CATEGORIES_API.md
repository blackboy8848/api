# Curated Categories API

Backend API for curated categories (e.g. homepage carousel). Implement on your API server (e.g. `api-topaz-psi-42.vercel.app`) so the frontend can use them.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/curated-categories` | List (optional `?active=1` or `?active=0`) |
| GET | `/api/curated-categories/:id` | Get one |
| POST | `/api/curated-categories` | Create |
| PUT | `/api/curated-categories/:id` | Update |
| DELETE | `/api/curated-categories/:id` | Delete |

## Request body (create / update)

- `name` (string) — **Required for create.** Display name.
- `image` (string, optional) — Image URL.
- `tag` (string, optional) — Tag label.
- `main_category` (string, optional) — Main category.
- `sub_category` (string, optional) — Sub category.
- `sort_order` (number, optional) — Sort order (default `0`). Lower first.
- `is_active` (boolean or 0/1, optional) — Active flag (default `1`).

## GET `/api/curated-categories`

List all curated categories. Ordered by `sort_order` ASC, then `id` ASC.

**Query parameters:**

- `active` (optional) — `1` or `true` = only active; `0` or `false` = only inactive. Omit for all.

**Response (200):** Array of objects:

```json
[
  {
    "id": 1,
    "name": "Adventure",
    "image": "https://example.com/adventure.jpg",
    "tag": "Trending",
    "main_category": "Tours",
    "sub_category": "Adventure",
    "sort_order": 0,
    "is_active": 1,
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
]
```

## GET `/api/curated-categories/:id`

Get a single curated category by numeric `id`.

**Response (200):** Single object (same shape as list items).

**Errors:** `400` missing id; `404` not found.

## POST `/api/curated-categories`

Create a new curated category.

**Request body (required):**

- `name` (string) — Required.

**Request body (optional):** `image`, `tag`, `main_category`, `sub_category`, `sort_order`, `is_active`.

**Response (201):**

```json
{
  "message": "Curated category created successfully",
  "id": 1
}
```

**Errors:** `400` missing name; `500` server error.

## PUT `/api/curated-categories/:id`

Update an existing curated category. Send only the fields to update.

**Request body (all optional):** `name`, `image`, `tag`, `main_category`, `sub_category`, `sort_order`, `is_active`.

**Response (200):**

```json
{
  "message": "Curated category updated successfully",
  "id": "1"
}
```

**Errors:** `400` missing id or no fields; `404` not found; `500` server error.

## DELETE `/api/curated-categories/:id`

Delete a curated category.

**Response (200):**

```json
{
  "message": "Curated category deleted successfully"
}
```

**Errors:** `400` missing id; `404` not found; `500` server error.

## Database

Run the migration to create the table:

```sql
-- See migration_curated_categories.sql
CREATE TABLE IF NOT EXISTS curated_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image VARCHAR(1024) DEFAULT NULL,
  tag VARCHAR(255) DEFAULT NULL,
  main_category VARCHAR(255) DEFAULT NULL,
  sub_category VARCHAR(255) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_sort (sort_order)
);
```
