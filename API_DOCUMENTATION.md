# MySQL API Documentation

This API provides CRUD (Create, Read, Update, Delete) operations for all database tables.

## Database Configuration

The API uses environment variables for database connection. Create a `.env.local` file with:

```env
DB_HOST=localhost
DB_USER=u690251984_yashop8848
DB_PASSWORD=Yashop8848
DB_NAME=u690251984_yashop8848

# SMTP Configuration for OTP Service
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your-email@mountainmiragebackpackers.in
SMTP_PASSWORD=your-email-password
SMTP_FROM=your-email@mountainmiragebackpackers.in
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

#### GET `/api/users`

Returns all users or a single user if `uid` query parameter is provided.

**Query Parameters:**
- `uid` (optional) - User ID to retrieve a specific user

**Response (All Users):**
```json
[
  {
    "uid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "display_name": "John Doe",
    "phone": "+1234567890",
    "location": "New York",
    "bio": "Travel enthusiast",
    "avatar": "https://example.com/avatar.jpg",
    "join_date": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "hashedPassword": "$2b$10$...",
    "pref_notifications": 1,
    "pref_newsletter": 1,
    "pref_marketing": 0,
    "pref_profile_visibility": "public",
    "pref_show_email": 1,
    "pref_show_phone": 1,
    "pref_show_location": 1
  }
]
```

**Response (Single User):**
```json
{
  "uid": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "display_name": "John Doe",
  "phone": "+1234567890",
  "location": "New York",
  "bio": "Travel enthusiast",
  "avatar": "https://example.com/avatar.jpg",
  "join_date": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z",
  "hashedPassword": "$2b$10$...",
  "pref_notifications": 1,
  "pref_newsletter": 1,
  "pref_marketing": 0,
  "pref_profile_visibility": "public",
  "pref_show_email": 1,
  "pref_show_phone": 1,
  "pref_show_location": 1
}
```

**Note:** The `password` field is excluded from responses. The `hashedPassword` field contains the bcrypt-hashed password stored in the database.

#### POST `/api/users`

Creates a new user. The `uid` is automatically generated if not provided.

**Request Body:**
```json
{
  "uid": "user123",  // Optional - auto-generated UUID if not provided
  "email": "user@example.com",  // Required
  "password": "userPassword123",  // Required - will be hashed with bcrypt
  "display_name": "John Doe",  // Optional - defaults to "Adventure Seeker"
  "phone": "+1234567890",  // Optional
  "location": "New York",  // Optional
  "bio": "Travel enthusiast",  // Optional
  "avatar": "https://example.com/avatar.jpg"  // Optional
}
```

**Required Fields:**
- `email` - User's email address (must be unique)
- `password` - User's password (will be hashed with bcrypt before saving)

**Optional Fields:**
- `uid` - User ID (auto-generated UUID if not provided)
- `display_name` - Display name (defaults to "Adventure Seeker")
- `phone` - Phone number
- `location` - Location
- `bio` - Biography
- `avatar` - Avatar URL

**Response (Success - 201):**
```json
{
  "message": "User created successfully",
  "uid": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**
- `400` - Missing required fields (`email` or `password`)
- `409` - User with this email already exists

**Security Features:**
- Passwords are automatically hashed using bcrypt (10 salt rounds) before saving to the database
- Email uniqueness is validated before user creation
- UID collision detection and regeneration (if manually provided UID already exists)

#### PUT `/api/users`

Updates an existing user. Requires `uid` in the request body.

**Request Body:**
```json
{
  "uid": "550e8400-e29b-41d4-a716-446655440000",  // Required
  "display_name": "Jane Doe",  // Optional
  "phone": "+9876543210",  // Optional
  "location": "Los Angeles",  // Optional
  "bio": "Updated bio",  // Optional
  "avatar": "https://example.com/new-avatar.jpg",  // Optional
  "password": "newPassword123"  // Optional - will be hashed if provided
}
```

**Note:** If `password` is included in the update, it will be automatically hashed with bcrypt before saving.

**Response (Success - 200):**
```json
{
  "message": "User updated successfully",
  "uid": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### DELETE `/api/users`

Deletes a user by `uid`.

**Query Parameters:**
- `uid` (required) - User ID to delete

**Response (Success - 200):**
```json
{
  "message": "User deleted successfully"
}
```

#### POST `/api/users/login`

Authenticates a user by validating their credentials (uid/email and password).

**Request Body:**
```json
{
  "email": "user@example.com",  // Required (if uid not provided)
  "password": "userPassword123"  // Required
}
```

Or with user ID:
```json
{
  "uid": "550e8400-e29b-41d4-a716-446655440000",  // Required (if email not provided)
  "password": "userPassword123"  // Required
}
```

**Required Fields:**
- `password` - User's password (will be compared with bcrypt-hashed password)
- Either `uid` OR `email` - User identifier

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "uid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "display_name": "John Doe",
    "phone": "+1234567890",
    "location": "New York",
    "bio": "Travel enthusiast",
    "avatar": "https://example.com/avatar.jpg",
    "join_date": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "pref_notifications": 1,
    "pref_newsletter": 1,
    "pref_marketing": 0,
    "pref_profile_visibility": "public",
    "pref_show_email": 1,
    "pref_show_phone": 1,
    "pref_show_location": 1
  }
}
```

**Error Responses:**
- `400` - Missing `password` or both `uid` and `email`, or user has no password set
- `401` - Invalid password
- `404` - User not found
- `500` - Login failed (server error)

**Note:** The password field is never included in the response. Passwords are compared using bcrypt.

---

### 2. Tours (`/api/tours`)

- **GET** `/api/tours` - Get all tours or filtered tours
- **GET** `/api/tours?id={id}` - Get single tour by id
- **GET** `/api/tours?category={category}` - Filter tours by category
- **GET** `/api/tours?isActive={true|false}` - Filter tours by active status
- **GET** `/api/tours?category={category}&isActive={true}` - Combine multiple filters
- **POST** `/api/tours` - Create new tour
- **PUT** `/api/tours` - Update tour (requires `id` in body)
- **DELETE** `/api/tours?id={id}` - Delete tour

#### GET `/api/tours`

Returns all tours or a filtered/single tour based on query parameters. Results are ordered by `created_at` in descending order (newest first).

**Query Parameters:**
- `id` (optional) - Tour ID to retrieve a specific tour
- `category` (optional) - Filter tours by category
- `isActive` (optional) - Filter by active status (`true` or `false`)

**Response (All Tours):**
```json
[
  {
    "id": "tour123",
    "banner": "https://example.com/banner.jpg",
    "title": "Mountain Adventure",
    "subdescription": "Experience the thrill of mountain climbing",
    "description": "Join us for an amazing 3-day mountain adventure...",
    "max_altitude": "5000m",
    "duration": "3 days",
    "price": 299.99,
    "difficulty": "Moderate",
    "imageUrl": "https://example.com/image.jpg",
    "images": ["url1", "url2"],
    "location": "Himalayas, Nepal",
    "lat": 28.3949,
    "lng": 84.1240,
    "maxGroupSize": 20,
    "startDates": ["2024-06-01", "2024-07-01"],
    "included": ["Meals", "Accommodation", "Guide"],
    "notIncluded": ["Flights", "Insurance"],
    "category": "Adventure",
    "subCategory": "Hiking",
    "isWeekendTrip": false,
    "schedule": {
      "day1": "Arrival and briefing",
      "day2": "Trekking",
      "day3": "Return"
    },
    "isActive": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Response (Single Tour):**
```json
{
  "id": "tour123",
  "banner": "https://example.com/banner.jpg",
  "title": "Mountain Adventure",
  "subdescription": "Experience the thrill of mountain climbing",
  "description": "Join us for an amazing 3-day mountain adventure...",
  "max_altitude": "5000m",
  "duration": "3 days",
  "price": 299.99,
  "difficulty": "Moderate",
  "imageUrl": "https://example.com/image.jpg",
  "images": ["url1", "url2"],
  "location": "Himalayas, Nepal",
  "lat": 28.3949,
  "lng": 84.1240,
  "maxGroupSize": 20,
  "startDates": ["2024-06-01", "2024-07-01"],
  "included": ["Meals", "Accommodation", "Guide"],
  "notIncluded": ["Flights", "Insurance"],
  "category": "Adventure",
  "subCategory": "Hiking",
  "isWeekendTrip": false,
  "schedule": {
    "day1": "Arrival and briefing",
    "day2": "Trekking",
    "day3": "Return"
  },
  "isActive": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `404` - Tour not found (when using `id` parameter)
- `500` - Database error

#### POST `/api/tours`

Creates a new tour.

**Request Body:**
```json
{
  "id": "tour123",  // Required
  "title": "Mountain Adventure",  // Required
  "description": "Join us for an amazing 3-day mountain adventure...",  // Required
  "duration": "3 days",  // Required
  "imageUrl": "https://example.com/image.jpg",  // Required
  "location": "Himalayas, Nepal",  // Required
  "category": "Adventure",  // Required
  "subCategory": "Hiking",  // Required
  "subdescription": "Experience the thrill of mountain climbing",  // Optional
  "price": 299.99,  // Optional - defaults to 0
  "difficulty": "Moderate",  // Optional - defaults to "Moderate" (Easy/Moderate/Difficult/Expert)
  "banner": "https://example.com/banner.jpg",  // Optional
  "max_altitude": "5000m",  // Optional
  "images": ["url1", "url2"],  // Optional - JSON array, will be stringified
  "lat": 28.3949,  // Optional
  "lng": 84.1240,  // Optional
  "maxGroupSize": 20,  // Optional - defaults to 20
  "startDates": ["2024-06-01", "2024-07-01"],  // Optional - JSON array, will be stringified
  "included": ["Meals", "Accommodation", "Guide"],  // Optional - JSON array, will be stringified
  "notIncluded": ["Flights", "Insurance"],  // Optional - JSON array, will be stringified
  "isWeekendTrip": false,  // Optional - defaults to false
  "schedule": {  // Optional - JSON object, will be stringified
    "day1": "Arrival and briefing",
    "day2": "Trekking",
    "day3": "Return"
  },
  "isActive": true  // Optional - defaults to true
}
```

**Required Fields:**
- `id` - Unique tour identifier
- `title` - Tour title
- `description` - Tour description
- `duration` - Tour duration (e.g., "3 days", "1 week")
- `imageUrl` - Main tour image URL
- `location` - Tour location
- `category` - Tour category
- `subCategory` - Tour subcategory

**Optional Fields:**
- `subdescription` - Short description/subtitle
- `price` - Tour price (defaults to 0)
- `difficulty` - Difficulty level: `Easy`, `Moderate`, `Difficult`, or `Expert` (defaults to "Moderate")
- `banner` - Banner image URL
- `max_altitude` - Maximum altitude
- `images` - Array of image URLs (automatically stringified as JSON)
- `lat` - Latitude coordinate
- `lng` - Longitude coordinate
- `maxGroupSize` - Maximum group size (defaults to 20)
- `startDates` - Array of available start dates (automatically stringified as JSON)
- `included` - Array of included items (automatically stringified as JSON)
- `notIncluded` - Array of not included items (automatically stringified as JSON)
- `isWeekendTrip` - Boolean indicating if it's a weekend trip (defaults to false)
- `schedule` - Schedule object (automatically stringified as JSON)
- `isActive` - Boolean indicating if tour is active (defaults to true)

**Response (Success - 201):**
```json
{
  "message": "Tour created successfully",
  "id": "tour123"
}
```

**Error Responses:**
- `400` - Missing required fields
- `409` - Tour with this ID already exists
- `500` - Database error

**Note:** JSON fields (`images`, `startDates`, `included`, `notIncluded`, `schedule`) are automatically stringified when saving to the database.

#### PUT `/api/tours`

Updates an existing tour. Requires `id` in the request body.

**Request Body:**
```json
{
  "id": "tour123",  // Required
  "title": "Updated Mountain Adventure",  // Optional
  "description": "Updated description...",  // Optional
  "price": 349.99,  // Optional
  "difficulty": "Difficult",  // Optional
  "isActive": false,  // Optional
  "images": ["new-url1", "new-url2"],  // Optional - will be stringified
  "schedule": {  // Optional - will be stringified
    "day1": "Updated schedule"
  }
}
```

**Note:** 
- Only include fields you want to update
- JSON fields (`images`, `startDates`, `included`, `notIncluded`, `schedule`) are automatically stringified if provided
- At least one field (besides `id`) must be provided

**Response (Success - 200):**
```json
{
  "message": "Tour updated successfully",
  "id": "tour123"
}
```

**Error Responses:**
- `400` - Missing `id` or no fields to update
- `500` - Database error

#### DELETE `/api/tours`

Deletes a tour by `id`.

**Query Parameters:**
- `id` (required) - Tour ID to delete

**Response (Success - 200):**
```json
{
  "message": "Tour deleted successfully"
}
```

**Error Responses:**
- `400` - Missing `id` parameter
- `500` - Database error

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

### 8. Tour Slots (`/api/tour-slots`)

Tour slots represent specific dates and times for tours. Each slot can have multiple variants (transport options).

- **GET** `/api/tour-slots` - Get all tour slots
- **GET** `/api/tour-slots?id={id}` - Get single slot by id
- **GET** `/api/tour-slots?tour_id={tour_id}` - Get slots for a tour
- **POST** `/api/tour-slots` - Create new tour slot
- **PUT** `/api/tour-slots` - Update tour slot (requires `id` in body)
- **DELETE** `/api/tour-slots?id={id}` - Delete tour slot

#### GET `/api/tour-slots`

Returns all tour slots or filtered slots based on query parameters. Results are ordered by `slot_date` and `slot_time` in ascending order.

**Query Parameters:**
- `id` (optional) - Slot ID to retrieve a specific slot
- `tour_id` (optional) - Filter slots by tour ID

**Response (All Slots):**
```json
[
  {
    "id": 1,
    "tour_id": "tour123",
    "slot_date": "2024-12-24",
    "slot_time": "20:00:00",
    "slot_end_date": "2024-12-28",
    "total_capacity": 50,
    "duration_label": "3 hours",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Response (Single Slot):**
```json
{
  "id": 1,
  "tour_id": "tour123",
  "slot_date": "2024-12-24",
  "slot_time": "20:00:00",
  "slot_end_date": "2024-12-28",
  "total_capacity": 50,
  "duration_label": "3 hours",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

#### POST `/api/tour-slots`

Creates a new tour slot.

**Request Body:**
```json
{
  "tour_id": "tour123",  // Required
  "slot_date": "2024-12-24",  // Required - DATE format: YYYY-MM-DD
  "slot_time": "20:00:00",  // Required - TIME format: HH:MM:SS
  "slot_end_date": "2024-12-28",  // Optional - End date only (YYYY-MM-DD, no time)
  "total_capacity": 50,  // Optional - Slot capacity
  "duration_label": "3 hours"  // Optional
}
```

**Required Fields:**
- `tour_id` - Tour ID (must exist in tours table)
- `slot_date` - Slot date in YYYY-MM-DD format
- `slot_time` - Slot time in HH:MM:SS format

**Optional Fields:**
- `slot_end_date` - End date only in YYYY-MM-DD format (no time)
- `total_capacity` - Slot capacity (integer)
- `duration_label` - Human-readable duration label (e.g., "3 hours", "Full Day")

**Response (Success - 201):**
```json
{
  "message": "Tour slot created successfully",
  "id": 1
}
```

**Error Responses:**
- `400` - Missing required fields
- `404` - Tour not found
- `500` - Database error

#### PUT `/api/tour-slots`

Updates an existing tour slot. Requires `id` in the request body.

**Request Body:**
```json
{
  "id": 1,  // Required
  "slot_date": "2024-12-26",  // Optional
  "slot_time": "21:00:00",  // Optional
  "slot_end_date": "2024-12-30",  // Optional - End date only (YYYY-MM-DD, no time)
  "total_capacity": 60,  // Optional - Slot capacity
  "duration_label": "4 hours"  // Optional
}
```

**Response (Success - 200):**
```json
{
  "message": "Tour slot updated successfully",
  "id": 1
}
```

#### DELETE `/api/tour-slots`

Deletes a tour slot by `id`. This will cascade delete all associated variants.

**Query Parameters:**
- `id` (required) - Slot ID to delete

**Response (Success - 200):**
```json
{
  "message": "Tour slot deleted successfully"
}
```

---

### 9. Tour Slot Variants (`/api/tour-slot-variants`)

Tour slot variants represent transport options (Bus/Train/Without Transport) for each slot, with individual pricing and capacity.

- **GET** `/api/tour-slot-variants` - Get all variants
- **GET** `/api/tour-slot-variants?id={id}` - Get single variant by id
- **GET** `/api/tour-slot-variants?slot_id={slot_id}` - Get variants for a slot
- **GET** `/api/tour-slot-variants/{id}/availability` - Get availability for a variant
- **POST** `/api/tour-slot-variants` - Create new variant
- **PUT** `/api/tour-slot-variants` - Update variant (requires `id` in body)
- **DELETE** `/api/tour-slot-variants?id={id}` - Delete variant

#### GET `/api/tour-slot-variants`

Returns all variants or filtered variants based on query parameters.

**Query Parameters:**
- `id` (optional) - Variant ID to retrieve a specific variant
- `slot_id` (optional) - Filter variants by slot ID

**Response (All Variants):**
```json
[
  {
    "id": 12,
    "slot_id": 5,
    "variant_name": "Without Transport",
    "description": "Self-transport to location",
    "price": 799.00,
    "capacity": 20,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 13,
    "slot_id": 5,
    "variant_name": "By Train",
    "description": "Transport included via train",
    "price": 1099.00,
    "capacity": 15,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST `/api/tour-slot-variants`

Creates a new tour slot variant.

**Request Body:**
```json
{
  "slot_id": 5,  // Required
  "variant_name": "By Bus",  // Required
  "description": "Transport included via bus",  // Optional
  "price": 1499.00,  // Required - must be >= 0
  "capacity": 10  // Required - must be > 0
}
```

**Required Fields:**
- `slot_id` - Slot ID (must exist in tour_slots table)
- `variant_name` - Name of the variant (e.g., "Without Transport", "By Train", "By Bus")
- `price` - Price for this variant (must be >= 0)
- `capacity` - Maximum number of seats (must be > 0)

**Optional Fields:**
- `description` - Description of the variant

**Response (Success - 201):**
```json
{
  "message": "Tour slot variant created successfully",
  "id": 12
}
```

**Error Responses:**
- `400` - Missing required fields, invalid price (< 0), or invalid capacity (<= 0)
- `404` - Tour slot not found
- `500` - Database error

#### GET `/api/tour-slot-variants/{id}/availability`

Get real-time availability for a specific variant.

**Path Parameters:**
- `id` (required) - Variant ID

**Response (Success - 200):**
```json
{
  "variant_id": 12,
  "variant_name": "Without Transport",
  "capacity": 20,
  "available_seats": 15,
  "availability": "Available"
}
```

**Response Fields:**
- `variant_id` - Variant ID
- `variant_name` - Name of the variant
- `capacity` - Total capacity
- `available_seats` - Number of available seats (capacity - booked seats)
- `availability` - Either "Available" or "Sold Out"

**Error Responses:**
- `400` - Invalid variant ID
- `404` - Variant not found
- `500` - Database error

#### PUT `/api/tour-slot-variants`

Updates an existing variant. Requires `id` in the request body.

**Request Body:**
```json
{
  "id": 12,  // Required
  "variant_name": "Updated Name",  // Optional
  "price": 899.00,  // Optional - must be >= 0
  "capacity": 25  // Optional - must be > 0
}
```

**Response (Success - 200):**
```json
{
  "message": "Tour slot variant updated successfully",
  "id": 12
}
```

#### DELETE `/api/tour-slot-variants`

Deletes a variant by `id`.

**Query Parameters:**
- `id` (required) - Variant ID to delete

**Response (Success - 200):**
```json
{
  "message": "Tour slot variant deleted successfully"
}
```

---

### 10. Tour Slots with Availability (`/api/tours/{id}/slots`)

Get all slots for a tour with their variants and real-time availability information.

- **GET** `/api/tours/{id}/slots` - Get all slots for a tour with availability

#### GET `/api/tours/{id}/slots`

Returns all slots for a specific tour, grouped by slot, with each slot containing its variants and availability information.

**Path Parameters:**
- `id` (required) - Tour ID

**Response (Success - 200):**
```json
[
  {
    "slot_id": 5,
    "slot_date": "2024-12-24",
    "slot_time": "20:00:00",
    "duration_label": "3 hours",
    "variants": [
      {
        "variant_id": 12,
        "variant_name": "Without Transport",
        "description": "Self-transport to location",
        "price": 799.00,
        "capacity": 20,
        "available_seats": 15,
        "availability": "Available"
      },
      {
        "variant_id": 13,
        "variant_name": "By Train",
        "description": "Transport included via train",
        "price": 1099.00,
        "capacity": 15,
        "available_seats": 0,
        "availability": "Sold Out"
      },
      {
        "variant_id": 14,
        "variant_name": "By Bus",
        "description": "Transport included via bus",
        "price": 1499.00,
        "capacity": 10,
        "available_seats": 5,
        "availability": "Available"
      }
    ]
  },
  {
    "slot_id": 6,
    "slot_date": "2024-12-26",
    "slot_time": "20:00:00",
    "duration_label": "3 hours",
    "variants": [
      {
        "variant_id": 15,
        "variant_name": "Without Transport",
        "description": "Self-transport to location",
        "price": 799.00,
        "capacity": 20,
        "available_seats": 20,
        "availability": "Available"
      }
    ]
  }
]
```

**Response Fields:**
- `slot_id` - Slot ID
- `slot_date` - Slot date (YYYY-MM-DD)
- `slot_time` - Slot time (HH:MM:SS)
- `duration_label` - Human-readable duration
- `variants` - Array of variants for this slot, each containing:
  - `variant_id` - Variant ID
  - `variant_name` - Variant name
  - `description` - Variant description
  - `price` - Price per person
  - `capacity` - Total capacity
  - `available_seats` - Number of available seats
  - `availability` - "Available" or "Sold Out"

**Error Responses:**
- `400` - Missing tour ID
- `404` - Tour not found
- `500` - Database error

**Note:** Results are ordered by `slot_date` and `slot_time` in ascending order.

---

### 11. Bookings (`/api/bookings`)

Bookings are now integrated with tour slots and variants, with real-time availability checks and transaction-based booking to prevent overbooking.

- **GET** `/api/bookings` - Get all bookings
- **GET** `/api/bookings?id={id}` - Get single booking
- **GET** `/api/bookings?user_id={user_id}` - Get user's bookings
- **GET** `/api/bookings?tour_id={tour_id}` - Get bookings for a tour
- **GET** `/api/bookings?booking_status={status}` - Filter by booking status
- **GET** `/api/bookings?status={status}` - Filter by status (confirmed/completed/cancelled)
- **GET** `/api/bookings?payment_status={status}` - Filter by payment status
- **POST** `/api/bookings` - Create new booking (with availability check)
- **PUT** `/api/bookings` - Update booking (requires `id` in body)
- **PATCH** `/api/bookings` - Cancel booking (releases seats)
- **DELETE** `/api/bookings?id={id}` - Delete booking

#### GET `/api/bookings`

Returns all bookings or filtered bookings based on query parameters. Results are ordered by `booking_date` and `created_at` in descending order.

**Query Parameters:**
- `id` (optional) - Booking ID to retrieve a specific booking
- `user_id` (optional) - Filter bookings by user ID
- `tour_id` (optional) - Filter bookings by tour ID
- `booking_status` (optional) - Filter by booking status
- `status` (optional) - Filter by status (confirmed/completed/cancelled)
- `payment_status` (optional) - Filter by payment status

**Response (All Bookings):**
```json
[
  {
    "id": "booking123",
    "user_id": "user123",
    "tour_id": "tour123",
    "slot_id": 5,
    "variant_id": 12,
    "seats": 2,
    "tour_name": "Mountain Adventure",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "phone_number": "+1234567890",
    "travel_date": "2024-12-24T20:00:00Z",
    "total_amount": 1598.00,
    "status": "confirmed",
    "booking_status": "Confirmed",
    "payment_status": "Verified",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST `/api/bookings`

Creates a new booking with real-time availability check and transaction-based booking to prevent overbooking.

**Request Body:**
```json
{
  "user_id": "user123",  // Required
  "tour_id": "tour123",  // Required
  "slot_id": 5,  // Required
  "variant_id": 12,  // Required
  "seats": 2,  // Required - must be > 0
  "total_amount": 1598.00,  // Optional - defaults to 0
  "tour_name": "Mountain Adventure",  // Optional
  "customer_name": "John Doe",  // Optional
  "customer_email": "john@example.com",  // Optional
  "phone_number": "+1234567890",  // Optional
  "travel_date": "2024-12-24T20:00:00Z",  // Optional
  "payment_status": "Not Verified"  // Optional - defaults to "Not Verified"
}
```

**Required Fields:**
- `user_id` - User ID
- `tour_id` - Tour ID
- `slot_id` - Slot ID (must exist in tour_slots table)
- `variant_id` - Variant ID (must exist in tour_slot_variants table)
- `seats` - Number of seats to book (must be > 0)

**Optional Fields:**
- `id` - Booking ID (auto-generated UUID if not provided)
- `total_amount` - Total booking amount (defaults to 0)
- `tour_name` - Tour name
- `customer_name` - Customer name
- `customer_email` - Customer email
- `phone_number` - Customer phone number
- `travel_date` - Travel date (ISO 8601 format)
- `payment_status` - Payment status (defaults to "Not Verified")

**Response (Success - 201):**
```json
{
  "message": "Booking created successfully",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**
- `400` - Missing required fields, invalid seats (<= 0), or not enough available seats
- `404` - Variant not found
- `500` - Database error

**Booking Flow:**
1. Validates required fields
2. Locks the variant row using `FOR UPDATE` to prevent race conditions
3. Checks real-time availability (capacity - confirmed/completed bookings)
4. If available seats >= requested seats, creates booking with status 'confirmed'
5. Uses database transaction to ensure atomicity
6. Rolls back if any error occurs

**Example Error Response (Not Enough Seats):**
```json
{
  "error": "Not enough available seats",
  "available_seats": 1,
  "requested_seats": 2
}
```

#### PATCH `/api/bookings`

Cancels a booking, which automatically releases the seats (availability only counts confirmed/completed bookings).

**Request Body:**
```json
{
  "id": "booking123"  // Required
}
```

**Response (Success - 200):**
```json
{
  "message": "Booking cancelled successfully",
  "id": "booking123"
}
```

**Error Responses:**
- `400` - Missing `id`
- `404` - Booking not found
- `500` - Database error

**Note:** When a booking is cancelled, its status is set to 'cancelled'. The seats are automatically freed because availability queries only count bookings with status 'confirmed' or 'completed'.

#### PUT `/api/bookings`

Updates an existing booking. Requires `id` in the request body.

**Request Body:**
```json
{
  "id": "booking123",  // Required
  "payment_status": "Verified",  // Optional
  "customer_name": "Jane Doe",  // Optional
  "total_amount": 1798.00  // Optional
}
```

**Response (Success - 200):**
```json
{
  "message": "Booking updated successfully",
  "id": "booking123"
}
```

#### DELETE `/api/bookings`

Deletes a booking by `id`.

**Query Parameters:**
- `id` (required) - Booking ID to delete

**Response (Success - 200):**
```json
{
  "message": "Booking deleted successfully"
}
```

---

### 12. Events (`/api/events`)

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

### 13. Blog Posts (`/api/blog-posts`)

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

### 14. Leads (`/api/leads`)

Lead capture from the **Contact Us** form and **Lead Channels** dashboard. Supports filtering by state (Hot/Warm/Cold), source (manual/onelink/other), status, and assignment.

- **GET** `/api/leads` - List all leads with optional filters
- **GET** `/api/leads?search={term}` - Search by name or email
- **GET** `/api/leads?lead_state=Hot|Warm|Cold` - Filter by state
- **GET** `/api/leads?lead_source=manual|onelink|other` - Filter by source
- **GET** `/api/leads?lead_status={status}` - Filter by lead status
- **GET** `/api/leads?assigned_to={uid}` - Filter by assigned user
- **GET** `/api/leads?sort=newest|oldest` - Sort by created date (default: newest)
- **POST** `/api/leads` - Create lead (e.g. from Contact Us form)
- **GET** `/api/leads/{id}` - Get single lead (View Details)
- **PUT** `/api/leads/{id}` - Update lead (Edit Enquiry)
- **DELETE** `/api/leads/{id}` - Delete lead (Delete Enquiry)

#### GET `/api/leads`

Returns leads with optional filters. Ordered by `created_at` descending by default.

**Query Parameters:**
- `search` (optional) - Search in `name` or `email`
- `lead_state` (optional) - `Hot`, `Warm`, `Cold`
- `lead_source` (optional) - `other`, `manual`, `onelink`
- `lead_status` (optional) - e.g. `New Enquiry`, `Contacted`, `Booked`, etc.
- `assigned_to` (optional) - `users.uid`
- `sort` (optional) - `newest` (default) or `oldest`

**Response (200):**
```json
[
  {
    "id": 11,
    "name": "yash mhatre",
    "email": "yash@example.com",
    "phone_country_code": "91",
    "phone_number": "8291616335",
    "lead_source": "other",
    "lead_state": "Cold",
    "lead_status": "New Enquiry",
    "assigned_to": "user-uid-here",
    "enquiry_destination": "Bali Adventure",
    "tour_id": null,
    "event_id": null,
    "slot_id": null,
    "notes": null,
    "remarks": null,
    "converted_to_booking_id": null,
    "created_at": "2026-01-15T00:00:00.000Z",
    "updated_at": "2026-01-15T00:00:00.000Z"
  }
]
```

#### POST `/api/leads`

Create a lead (e.g. from the Contact Us form or manual entry in Lead Channels).

**Request Body (required):**
- `name` (string) - Required
- `email` (string) - Required
- `phone_number` (string) - Required

**Request Body (optional):**
- `phone_country_code` (string) - Default `91`
- `lead_source` - `other` (default), `manual`, `onelink`
- `lead_state` - `Hot`, `Warm`, `Cold` (default `Cold`)
- `lead_status` (string) - Default `New Enquiry`
- `assigned_to` (string) - `users.uid`
- `enquiry_destination` (string) - e.g. "Bali Adventure", "MANALI - KASOL-MANIKARAN"
- `tour_id` (string) - For "Select Event" when it is a tour
- `event_id` (string) - For "Select Event" when it is an event
- `slot_id` (number) - For "Select Departure Batch" (`tour_slots.id`)
- `notes` (string) - From Contact Us "Notes"
- `remarks` (string) - Internal remarks

**Example (Contact Us form):**
```json
{
  "name": "Alex Rose",
  "email": "alexrose123@gmail.com",
  "phone_country_code": "91",
  "phone_number": "9876543210",
  "event_id": "evt-1",
  "slot_id": 5,
  "notes": "Interested in Manali batch"
}
```

**Response (201):**
```json
{
  "message": "Lead created successfully",
  "id": 12
}
```

#### GET `/api/leads/{id}`

Returns a single lead by numeric `id`.

**Response (200):** Same shape as one element in the GET list. **404** if not found.

#### PUT `/api/leads/{id}`

Update a lead (Edit Enquiry). Send only the fields to change.

**Example:**
```json
{
  "lead_state": "Warm",
  "lead_status": "Contacted",
  "assigned_to": "user-uid",
  "remarks": "Spoke on call, sending quote"
}
```

**Response (200):**
```json
{
  "message": "Lead updated successfully",
  "id": "11"
}
```

#### DELETE `/api/leads/{id}`

Deletes a lead.

**Response (200):**
```json
{
  "message": "Lead deleted successfully"
}
```

**Lead status values:** New Enquiry, Call Not Picked, Contacted, Qualified, Plan & Quote Sent, In Pipeline, Negotiating, Awaiting Payment, Booked, Lost & Closed, Future Prospect.

**Lead state values:** Hot, Warm, Cold.

**Lead source values:** other, manual, onelink.

---

### 15. Coupons (`/api/coupons`)

Bulk coupon creation and management. Coupons can be scoped at **Company**, **Event**, or **Batch** level. Discount is applied per ticket.

- **GET** `/api/coupons` - List coupons with optional filters
- **GET** `/api/coupons?search={term}` - Search by coupon code
- **GET** `/api/coupons?coupon_level=company|event|batch` - Filter by level
- **GET** `/api/coupons?coupon_type=private|public` - Filter by type
- **GET** `/api/coupons?sort=newest|oldest` - Sort by created date (default: newest)
- **POST** `/api/coupons` - Create coupon (optionally with `event_ids`, `slot_ids`)
- **GET** `/api/coupons/{id}` - Get single coupon with `event_ids` and `slot_ids`
- **PUT** `/api/coupons/{id}` - Update coupon and/or event/slot associations
- **DELETE** `/api/coupons/{id}` - Delete coupon (cascades to `coupon_events`, `coupon_slots`)

#### POST `/api/coupons`

**Required:**
- `coupon_code` (string) - Unique code
- `discount` (number) - Discount value (e.g. 10 for 10%, or fixed amount)

**Optional (with defaults):**
- `coupon_level` - `company` \| `event` \| `batch` (default: `event`)
- `discount_type` - `percentage` \| `fixed` (default: `percentage`)
- `discount_applicable` - `per_person` \| `per_order` \| `per_ticket` (default: `per_person`)
- `coupon_inventory` (number, default: 0)
- `group_size` (number, optional)
- `affiliate_email` (string, optional)
- `coupon_type` - `private` \| `public` (default: `private`)
- `valid_from`, `valid_till` (date `YYYY-MM-DD`, optional)
- `validity_type` - `fixed_date` \| `relative_date` (default: `fixed_date`)
- `company_id` (string, optional)
- `event_ids` (string[]) - For event/batch level; `events.id` values
- `slot_ids` (number[]) - For batch level; `tour_slots.id` values

**Example POST:**
```json
{
  "coupon_code": "SAVE10",
  "discount": 10,
  "coupon_level": "event",
  "discount_type": "percentage",
  "discount_applicable": "per_person",
  "coupon_inventory": 100,
  "group_size": 2,
  "affiliate_email": "affiliate@example.com",
  "coupon_type": "private",
  "valid_from": "2025-01-01",
  "valid_till": "2025-12-31",
  "validity_type": "fixed_date",
  "event_ids": ["event123", "event456"]
}
```

**Response (201):**
```json
{
  "message": "Coupon created successfully",
  "id": 1,
  "event_ids": ["event123", "event456"],
  "slot_ids": []
}
```

#### GET `/api/coupons/{id}`

Returns the coupon with `event_ids` and `slot_ids` populated.

**Response (200):**
```json
{
  "id": 1,
  "coupon_level": "event",
  "coupon_code": "SAVE10",
  "discount_type": "percentage",
  "discount_applicable": "per_person",
  "discount": 10,
  "coupon_inventory": 100,
  "group_size": 2,
  "affiliate_email": "affiliate@example.com",
  "coupon_type": "private",
  "valid_from": "2025-01-01",
  "valid_till": "2025-12-31",
  "validity_type": "fixed_date",
  "company_id": null,
  "created_at": "2025-01-15T00:00:00.000Z",
  "updated_at": "2025-01-15T00:00:00.000Z",
  "event_ids": ["event123", "event456"],
  "slot_ids": []
}
```

#### PUT `/api/coupons/{id}`

Send only the fields to update. To replace event/slot links, send `event_ids` and/or `slot_ids`; existing links are replaced. Omit `event_ids`/`slot_ids` to leave them unchanged.

#### DELETE `/api/coupons/{id}`

Deletes the coupon. Rows in `coupon_events` and `coupon_slots` are removed by CASCADE.

---

### 16. Supervisor (`/api/supervisor`)

Super user/supervisor role management with role-based navigation permissions. This endpoint manages super admin accounts with granular access control to different navigation items.

- **POST** `/api/supervisor/login` - Super user login (email + password)
- **POST** `/api/supervisor/register` - Super user registration (email + OTP + password)
- **GET** `/api/supervisor` - List all super users
- **GET** `/api/supervisor?id={id}` - Get single super user by id
- **GET** `/api/supervisor?user_id={user_id}` - Get single super user by user_id
- **GET** `/api/supervisor?email={email}` - Get super user by email
- **GET** `/api/supervisor?is_active={true|false}` - Filter by active status
- **POST** `/api/supervisor` - Create new super user (admin use; requires user_id, email, navigation_permissions)
- **PUT** `/api/supervisor` - Update super user (requires `id` or `user_id` in body)
- **DELETE** `/api/supervisor?id={id}` - Delete super user by id
- **DELETE** `/api/supervisor?user_id={user_id}` - Delete super user by user_id

#### GET `/api/supervisor`

Returns all super users or a single super user if query parameters are provided.

**Query Parameters:**
- `id` (optional) - Super user ID to retrieve a specific super user
- `user_id` (optional) - User ID (references `users.uid`) to retrieve a specific super user
- `email` (optional) - Email address to filter by
- `is_active` (optional) - Filter by active status (`true` or `false`)

**Response (All Super Users - 200):**
```json
[
  {
    "id": 1,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "supervisor@example.com",
    "display_name": "Super Admin",
    "is_active": true,
    "navigation_permissions": {
      "my_events": true,
      "leads": {
        "enabled": true,
        "channel_leads": true,
        "missed_checkouts": true
      },
      "bookings": {
        "enabled": true,
        "all_bookings": true,
        "transactions": true,
        "settlements": true,
        "customers": true,
        "refunds": true
      },
      "calendar": true,
      "coupons": true,
      "operations": true,
      "oneinbox": true,
      "onelink": true,
      "instagram": true,
      "whatsapp": true,
      "pickup_points": true,
      "analytics": {
        "enabled": true,
        "lead_analytics": true,
        "booking_analytics": true
      },
      "policies": true,
      "settings": true,
      "user_management": true
    },
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Response (Single Super User - 200):**
Returns a single object instead of an array when `id` or `user_id` is provided.

#### POST `/api/supervisor`

Creates a new super user with role-based navigation permissions.

**Request Body (required):**
- `user_id` (string) - User ID (references `users.uid`) - must be unique
- `email` (string) - Super user email address - must be unique
- `navigation_permissions` (object | string) - JSON object or JSON string defining navigation permissions

**Request Body (optional):**
- `display_name` (string) - Display name for the super user
- `is_active` (boolean) - Active status (default: `true`)

**Example Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "supervisor@example.com",
  "display_name": "Super Admin",
  "is_active": true,
  "navigation_permissions": {
    "my_events": true,
    "leads": {
      "enabled": true,
      "channel_leads": true,
      "missed_checkouts": true
    },
    "bookings": {
      "enabled": true,
      "all_bookings": true,
      "transactions": true,
      "settlements": true,
      "customers": true,
      "refunds": true
    },
    "calendar": true,
    "coupons": true,
    "operations": true,
    "oneinbox": true,
    "onelink": true,
    "instagram": true,
    "whatsapp": true,
    "pickup_points": true,
    "analytics": {
      "enabled": true,
      "lead_analytics": true,
      "booking_analytics": true
    },
    "policies": true,
    "settings": true,
    "user_management": true
  }
}
```

**Response (201):**
```json
{
  "message": "Super user created successfully",
  "id": 1
}
```

**Error Responses:**
- `400` - Missing required fields (`user_id`, `email`, or `navigation_permissions`)
- `409` - Super user with this `user_id` or `email` already exists

#### PUT `/api/supervisor`

Updates a super user. Send only the fields to update.

**Request Body (required):**
- `id` (number) OR `user_id` (string) - Required to identify which super user to update

**Request Body (optional):**
- `email` (string) - Update email address
- `display_name` (string) - Update display name (can be set to `null`)
- `is_active` (boolean) - Update active status
- `navigation_permissions` (object | string) - Update navigation permissions

**Example Request:**
```json
{
  "id": 1,
  "is_active": false,
  "navigation_permissions": {
    "my_events": true,
    "leads": {
      "enabled": false,
      "channel_leads": false,
      "missed_checkouts": false
    },
    "user_management": true
  }
}
```

**Response (200):**
```json
{
  "message": "Super user updated successfully"
}
```

**Error Responses:**
- `400` - Missing `id` or `user_id` in request body, or no fields to update
- `404` - Super user not found

#### DELETE `/api/supervisor`

Deletes a super user.

**Query Parameters:**
- `id` (required if `user_id` not provided) - Super user ID
- `user_id` (required if `id` not provided) - User ID (references `users.uid`)

**Response (200):**
```json
{
  "message": "Super user deleted successfully"
}
```

**Error Responses:**
- `400` - Missing `id` or `user_id` query parameter
- `404` - Super user not found

#### POST `/api/supervisor/login`

Super user login with email and password. Validates credentials against the `users` table and ensures the user is an active super user in `super_users`.

**Request Body:**
```json
{
  "email": "supervisor@example.com",
  "password": "yourPassword123"
}
```

**Required Fields:**
- `email` - Super user email address
- `password` - Account password (stored in `users` table)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Super user login successful",
  "user": {
    "uid": "550e8400-e29b-41d4-a716-446655440000",
    "email": "supervisor@example.com",
    "display_name": "Super Admin",
    "phone": null,
    "location": null,
    "bio": null,
    "avatar": null,
    "join_date": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  "supervisor": {
    "id": 1,
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "supervisor@example.com",
    "display_name": "Super Admin",
    "is_active": true,
    "navigation_permissions": { "my_events": true, "leads": { "enabled": true }, "bookings": { "enabled": true } },
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Missing email or password, or invalid email format
- `401` - Invalid email or password
- `403` - User is not an active super user
- `500` - Server error

#### POST `/api/supervisor/register`

Super user registration using email OTP verification. **Two-step flow:**

1. **Request OTP:** `POST /api/otp` with body `{ "email": "your@email.com" }`. User receives a 6-digit OTP by email (valid 10 minutes).
2. **Register:** `POST /api/supervisor/register` with email, OTP, password, and optional display name.

If the email already exists in `users`, the account is linked and the password is updated. A new row is created in `super_users` with default full navigation permissions.

**Request Body:**
```json
{
  "email": "new-supervisor@example.com",
  "otp": "123456",
  "password": "securePassword123",
  "display_name": "New Super Admin"
}
```

**Required Fields:**
- `email` - Email address (must match the email used to request OTP)
- `otp` - 6-digit OTP received by email
- `password` - Password (min 6 characters; stored hashed in `users`)

**Optional Fields:**
- `display_name` - Display name for the super user

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Super user registered successfully. You can now log in.",
  "uid": "550e8400-e29b-41d4-a716-446655440000",
  "email": "new-supervisor@example.com",
  "display_name": "New Super Admin"
}
```

**Error Responses:**
- `400` - Missing email, OTP, or password; invalid/expired OTP; invalid email format; password too short
- `409` - A super user with this email already exists
- `500` - Server error

**Navigation Permissions Structure:**

The `navigation_permissions` field is a JSON object that defines which navigation items are active for the super user. Each top-level key represents a navigation section, and nested objects can define sub-items:

- Simple boolean values: `"my_events": true` - enables/disables the feature
- Nested objects: `"leads": { "enabled": true, "channel_leads": true, "missed_checkouts": true }` - enables the parent feature and its sub-items
- All navigation items default to `false` if not specified

**Available Navigation Items:**
- `my_events` - My Events section
- `leads` - Leads section (with `channel_leads`, `missed_checkouts` sub-items)
- `bookings` - Bookings section (with `all_bookings`, `transactions`, `settlements`, `customers`, `refunds` sub-items)
- `calendar` - Calendar feature
- `coupons` - Coupons management
- `operations` - Operations section
- `oneinbox` - OneInbox feature
- `onelink` - OneLink feature
- `instagram` - Instagram integration
- `whatsapp` - WhatsApp integration
- `pickup_points` - Pickup Points management
- `analytics` - Analytics section (with `lead_analytics`, `booking_analytics` sub-items)
- `policies` - Policies management
- `settings` - Settings section
- `user_management` - User Management section

---

### 15. OTP Service (`/api/otp`)

One-Time Password (OTP) service for email verification. Generates a random 6-digit OTP and sends it via email.

- **POST** `/api/otp` - Generate and send OTP to email
- **GET** `
### 15. OTP Service (`/api/otp`)

One-Time Password (OTP) service for email verification. Generates a random 6-digit OTP and sends it via email.

- **POST** `/api/otp` - Generate and send OTP to email
- **GET** `/api/otp?email={email}&otp={otp}` - Verify OTP

#### POST `/api/otp`

Generates a random 6-digit OTP and sends it to the specified email address. The OTP is valid for 10 minutes.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "email": "user@example.com",
  "expiresIn": "10 minutes",
  "note": "Please check your email inbox for the OTP code"
}
```

**Error Responses:**
- `400` - Missing or invalid email format
- `500` - SMTP configuration error or email sending failure

**Security Note:** The OTP is **never** returned in the API response for security reasons. It is only sent via email to the specified address. Users must check their email inbox to retrieve the OTP code.

#### GET `/api/otp`

Verifies an OTP code for a given email address.

**Query Parameters:**
- `email` (required) - Email address associated with the OTP
- `otp` (required) - The OTP code to verify

**Response (Success - 200):**
```json
{
  "message": "OTP verified successfully",
  "valid": true
}
```

**Error Responses:**
- `400` - Missing email or OTP, invalid OTP, or expired OTP
- `404` - OTP not found for the email address

**Example Usage:**

**Request OTP:**
```bash
curl -X POST http://localhost:3000/api/otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Verify OTP:**
```bash
curl "http://localhost:3000/api/otp?email=user@example.com&otp=123456"
```

**Environment Variables Required:**
- `SMTP_HOST` - SMTP server hostname (default: `smtp.hostinger.com`)
- `SMTP_PORT` - SMTP server port (default: `465`)
- `SMTP_USER` - Your email address
- `SMTP_PASSWORD` - Your email password
- `SMTP_FROM` - Sender email address (optional, defaults to `SMTP_USER`)

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
` - Verify OTP

#### POST `/api/otp`

Generates a random 6-digit OTP and sends it to the specified email address. The OTP is valid for 10 minutes.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email",
  "email": "user@example.com",
  "expiresIn": "10 minutes",
  "note": "Please check your email inbox for the OTP code"
}
```

**Error Responses:**
- `400` - Missing or invalid email format
- `500` - SMTP configuration error or email sending failure

**Security Note:** The OTP is **never** returned in the API response for security reasons. It is only sent via email to the specified address. Users must check their email inbox to retrieve the OTP code.

#### GET `/api/otp`

Verifies an OTP code for a given email address.

**Query Parameters:**
- `email` (required) - Email address associated with the OTP
- `otp` (required) - The OTP code to verify

**Response (Success - 200):**
```json
{
  "message": "OTP verified successfully",
  "valid": true
}
```

**Error Responses:**
- `400` - Missing email or OTP, invalid OTP, or expired OTP
- `404` - OTP not found for the email address

**Example Usage:**

**Request OTP:**
```bash
curl -X POST http://localhost:3000/api/otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Verify OTP:**
```bash
curl "http://localhost:3000/api/otp?email=user@example.com&otp=123456"
```

**Environment Variables Required:**
- `SMTP_HOST` - SMTP server hostname (default: `smtp.hostinger.com`)
- `SMTP_PORT` - SMTP server port (default: `465`)
- `SMTP_USER` - Your email address
- `SMTP_PASSWORD` - Your email password
- `SMTP_FROM` - Sender email address (optional, defaults to `SMTP_USER`)

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
- Date fields for slots use DATE format (YYYY-MM-DD)
- Time fields for slots use TIME format (HH:MM:SS)
- JSON fields (images, tags, sections, etc.) are automatically stringified when saving
- Foreign key constraints are enforced by the database
- All endpoints support CORS
- **Password Security:** User passwords are automatically hashed using bcrypt (10 salt rounds) before being stored in the database. Passwords are never returned in API responses. The `hashedPassword` field in GET responses is for verification purposes only and should not be exposed in production.
- **OTP Security:** OTP codes are **never** returned in API responses for security reasons. They are only sent via email to the user's registered email address. Users must check their email inbox to retrieve the OTP code.
- **UID Generation:** User UIDs are automatically generated as UUIDs if not provided in POST requests. This ensures unique identifiers for all users.
- **Booking Safety:** Bookings use database transactions with row-level locking (`FOR UPDATE`) to prevent race conditions and overbooking. Availability is checked in real-time before booking creation.
- **Availability Calculation:** Availability only counts bookings with status 'confirmed' or 'completed'. Cancelled bookings automatically free seats.

