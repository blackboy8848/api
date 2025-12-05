# MySQL API Server

A comprehensive REST API built with Next.js for managing a travel/tour booking database.

## Features

- ✅ Full CRUD operations (Create, Read, Update, Delete) for all 10 database tables
- ✅ TypeScript support
- ✅ MySQL connection pooling
- ✅ Error handling
- ✅ RESTful API design

## Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Configure Environment Variables**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Update the database credentials in `.env.local`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=u690251984_yashop8848
   DB_PASSWORD=Yashop8848
   DB_NAME=u690251984_yashop8848
   ```
   
   **Note:** If you're using a remote database (like Hostinger), update `DB_HOST` to your database hostname.

3. **Run the Development Server**
   ```bash
   pnpm dev
   ```

   The API will be available at `http://localhost:3000/api`

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API endpoint documentation.

## Quick Start Example

### Create a User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "user123",
    "email": "user@example.com",
    "display_name": "John Doe"
  }'
```

### Get All Tours
```bash
curl http://localhost:3000/api/tours
```

### Create a Tour
```bash
curl -X POST http://localhost:3000/api/tours \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tour123",
    "title": "Mountain Adventure",
    "description": "Amazing mountain tour",
    "duration": "3 days",
    "price": 299.99,
    "imageUrl": "https://example.com/image.jpg",
    "location": "Mountains",
    "category": "Adventure",
    "subCategory": "Hiking"
  }'
```

## Available Endpoints

- `/api/users` - User management
- `/api/tours` - Tour management
- `/api/tour-reviews` - Tour reviews
- `/api/favorites` - User favorites
- `/api/travel-history` - Travel history
- `/api/payment-methods` - Payment methods
- `/api/tickets` - Event tickets
- `/api/bookings` - Tour bookings
- `/api/events` - Events
- `/api/blog-posts` - Blog posts

Each endpoint supports GET (list/single), POST (create), PUT (update), and DELETE operations.

## Database Tables

1. `users` - User accounts and preferences
2. `tours` - Tour/adventure listings
3. `tour_reviews` - Tour reviews and ratings
4. `favorites` - User favorite tours
5. `travel_history` - User travel history
6. `payment_methods` - User payment methods
7. `tickets` - Event tickets
8. `bookings` - Tour bookings
9. `events` - Events
10. `blog_posts` - Blog posts

## Project Structure

```
├── app/
│   └── api/          # API routes
│       ├── users/
│       ├── tours/
│       ├── tour-reviews/
│       └── ...
├── lib/
│   └── db.ts         # Database connection
├── types/
│   └── database.ts   # TypeScript types
└── .env.local        # Environment variables (create this)
```

## Technologies

- Next.js 16
- TypeScript
- MySQL2
- Node.js
