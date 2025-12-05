# MySQL API Documentation

This API provides CRUD (Create, Read, Update, Delete) operations for all database tables.

## Database Configuration

The API uses environment variables for database connection. Create a `.env.local` file with:

```env
DB_HOST=localhost
DB_USER=u690251984_yashop8848
DB_PASSWORD=Yashop8848
DB_NAME=u690251984_yashop8848
```

## Base URL

All API endpoints are prefixed with `/api`

## API Endpoints

### 1. Users (`/api/users`)

- **GET** `/api/users` - Get all users
- **GET** `/api/users?uid={uid}` - Get single user by uid
- **POST** `/api/users` - Create new user
- **PUT** `/api/users` - Update user (requires `uid` in body)
- **DELETE** `/api/users?uid={uid}` - Delete user

**Example POST:**
```json
{
  "uid": "user123",
  "email": "user@example.com",
  "display_name": "John Doe",
  "phone": "+1234567890"
}
```

---

### 2. Tours (`/api/tours`)

- **GET** `/api/tours` - Get all tours
- **GET** `/api/tours?id={id}` - Get single tour by id
- **GET** `/api/tours?category={category}` - Filter by category
- **GET** `/api/tours?isActive={true|false}` - Filter by active status
- **POST** `/api/tours` - Create new tour
- **PUT** `/api/tours` - Update tour (requires `id` in body)
- **DELETE** `/api/tours?id={id}` - Delete tour

**Example POST:**
```json
{
  "id": "tour123",
  "title": "Mountain Adventure",
  "description": "Amazing mountain tour",
  "duration": "3 days",
  "price": 299.99,
  "imageUrl": "https://example.com/image.jpg",
  "location": "Mountains",
  "category": "Adventure",
  "subCategory": "Hiking"
}
```

---

### 3. Tour Reviews (`/api/tour-reviews`)

- **GET** `/api/tour-reviews` - Get all reviews
- **GET** `/api/tour-reviews?id={id}` - Get single review
- **GET** `/api/tour-reviews?tour_id={tour_id}` - Get reviews for a tour
- **GET** `/api/tour-reviews?user_id={user_id}` - Get reviews by user
- **POST** `/api/tour-reviews` - Create new review
- **PUT** `/api/tour-reviews` - Update review (requires `id` in body)
- **DELETE** `/api/tour-reviews?id={id}` - Delete review

**Example POST:**
```json
{
  "id": "review123",
  "tour_id": "tour123",
  "user_name": "John Doe",
  "rating": 5,
  "comment": "Amazing experience!"
}
```

---

### 4. Favorites (`/api/favorites`)

- **GET** `/api/favorites` - Get all favorites
- **GET** `/api/favorites?id={id}` - Get single favorite
- **GET** `/api/favorites?user_id={user_id}` - Get user's favorites
- **GET** `/api/favorites?tour_id={tour_id}` - Get favorites for a tour
- **POST** `/api/favorites` - Add to favorites
- **PUT** `/api/favorites` - Update favorite (requires `id` in body)
- **DELETE** `/api/favorites?id={id}` - Remove from favorites

**Example POST:**
```json
{
  "id": "fav123",
  "user_id": "user123",
  "tour_id": "tour123",
  "tour_name": "Mountain Adventure"
}
```

---

### 5. Travel History (`/api/travel-history`)

- **GET** `/api/travel-history` - Get all travel history
- **GET** `/api/travel-history?id={id}` - Get single entry
- **GET** `/api/travel-history?user_id={user_id}` - Get user's travel history
- **GET** `/api/travel-history?tour_id={tour_id}` - Get history for a tour
- **GET** `/api/travel-history?status={status}` - Filter by status (completed/cancelled/upcoming)
- **POST** `/api/travel-history` - Create new travel history entry
- **PUT** `/api/travel-history` - Update entry (requires `id` in body)
- **DELETE** `/api/travel-history?id={id}` - Delete entry

**Example POST:**
```json
{
  "id": "travel123",
  "user_id": "user123",
  "tour_id": "tour123",
  "tour_name": "Mountain Adventure",
  "booking_date": "2024-01-01T00:00:00Z",
  "travel_date": "2024-02-01T00:00:00Z",
  "status": "upcoming"
}
```

---

### 6. Payment Methods (`/api/payment-methods`)

- **GET** `/api/payment-methods` - Get all payment methods
- **GET** `/api/payment-methods?id={id}` - Get single payment method
- **GET** `/api/payment-methods?user_id={user_id}` - Get user's payment methods
- **POST** `/api/payment-methods` - Add payment method
- **PUT** `/api/payment-methods` - Update payment method (requires `id` in body)
- **DELETE** `/api/payment-methods?id={id}` - Delete payment method

**Example POST:**
```json
{
  "id": "pm123",
  "user_id": "user123",
  "type": "card",
  "last4": "1234",
  "card_type": "Visa"
}
```

---

### 7. Tickets (`/api/tickets`)

- **GET** `/api/tickets` - Get all tickets
- **GET** `/api/tickets?ticket_id={ticket_id}` - Get single ticket
- **GET** `/api/tickets?user_id={user_id}` - Get user's tickets
- **GET** `/api/tickets?event_id={event_id}` - Get tickets for an event
- **GET** `/api/tickets?status={status}` - Filter by status (booked/cancelled/used)
- **POST** `/api/tickets` - Create new ticket
- **PUT** `/api/tickets` - Update ticket (requires `ticket_id` in body)
- **DELETE** `/api/tickets?ticket_id={ticket_id}` - Delete ticket

**Example POST:**
```json
{
  "ticket_id": "ticket123",
  "user_id": "user123",
  "user_name": "John Doe",
  "event_id": "event123",
  "event_name": "Summer Festival",
  "valid_until": "2024-12-31T23:59:59Z"
}
```

---

### 8. Bookings (`/api/bookings`)

- **GET** `/api/bookings` - Get all bookings
- **GET** `/api/bookings?id={id}` - Get single booking
- **GET** `/api/bookings?user_id={user_id}` - Get user's bookings
- **GET** `/api/bookings?tour_id={tour_id}` - Get bookings for a tour
- **GET** `/api/bookings?booking_status={status}` - Filter by booking status
- **GET** `/api/bookings?payment_status={status}` - Filter by payment status
- **POST** `/api/bookings` - Create new booking
- **PUT** `/api/bookings` - Update booking (requires `id` in body)
- **DELETE** `/api/bookings?id={id}` - Delete booking

**Example POST:**
```json
{
  "id": "booking123",
  "user_id": "user123",
  "tour_id": "tour123",
  "tour_name": "Mountain Adventure",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "phone_number": "+1234567890",
  "travel_date": "2024-02-01T00:00:00Z",
  "number_of_seats": 2,
  "total_amount": 599.98
}
```

---

### 9. Events (`/api/events`)

- **GET** `/api/events` - Get all events
- **GET** `/api/events?id={id}` - Get single event
- **GET** `/api/events?category={category}` - Filter by category
- **GET** `/api/events?is_active={true|false}` - Filter by active status
- **POST** `/api/events` - Create new event
- **PUT** `/api/events` - Update event (requires `id` in body)
- **DELETE** `/api/events?id={id}` - Delete event

**Example POST:**
```json
{
  "id": "event123",
  "title": "Summer Festival",
  "description": "Amazing summer event",
  "date": "2024-07-15T10:00:00Z",
  "location": "Central Park",
  "imageUrl": "https://example.com/event.jpg",
  "category": "Festival",
  "team_leader": "Jane Smith"
}
```

---

### 10. Blog Posts (`/api/blog-posts`)

- **GET** `/api/blog-posts` - Get all blog posts
- **GET** `/api/blog-posts?id={id}` - Get single post
- **GET** `/api/blog-posts?author={author}` - Filter by author
- **GET** `/api/blog-posts?is_published={true|false}` - Filter by published status
- **POST** `/api/blog-posts` - Create new blog post
- **PUT** `/api/blog-posts` - Update blog post (requires `id` in body)
- **DELETE** `/api/blog-posts?id={id}` - Delete blog post

**Example POST:**
```json
{
  "id": "post123",
  "title": "My Travel Experience",
  "content": "This was an amazing trip...",
  "author": "John Doe",
  "is_published": true
}
```

---

## Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "id": "resource_id"
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (missing required fields)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

## Notes

- All dates should be in ISO 8601 format (e.g., `2024-01-01T00:00:00Z`)
- JSON fields (images, tags, sections, etc.) are automatically stringified when saving
- Foreign key constraints are enforced by the database
- All endpoints support CORS

