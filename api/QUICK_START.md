# Quick Start Guide

## Important: API Route URLs

All API endpoints must be accessed with the `/api` prefix:

✅ **Correct URLs:**
- `http://localhost:3000/api/users`
- `http://localhost:3000/api/tours`
- `http://localhost:3000/api/bookings`

❌ **Incorrect URLs (will return 404):**
- `http://localhost:3000/users`
- `http://localhost:3000/tours`
- `http://localhost:3000/bookings`

## Testing the API

### Using Browser
Navigate to: `http://localhost:3000/api/users`

### Using curl
```bash
# Get all users
curl http://localhost:3000/api/users

# Get all tours
curl http://localhost:3000/api/tours

# Get single user
curl http://localhost:3000/api/users?uid=user123
```

### Using Postman or Thunder Client
1. Set method to `GET`
2. URL: `http://localhost:3000/api/users`
3. Send request

## Environment Setup

Make sure you have a `.env.local` file in the root directory with:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=u690251984_yashop8848
DB_PASSWORD=Yashop8848
DB_NAME=u690251984_yashop8848
```

**Note:** If your database is on a remote server (like Hostinger), update `DB_HOST` to your database hostname.

## Available Endpoints

- `/api/users`
- `/api/tours`
- `/api/tour-reviews`
- `/api/favorites`
- `/api/travel-history`
- `/api/payment-methods`
- `/api/tickets`
- `/api/bookings`
- `/api/events`
- `/api/blog-posts`

See `API_DOCUMENTATION.md` for complete details on each endpoint.

