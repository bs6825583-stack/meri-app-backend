# 🌍 Tourism App Backend

Node.js + Express + MongoDB backend for a Flutter tourism app, with **Gemini AI** trip generation, JWT auth, role-based access (tourist / local / admin), image uploads, reviews, search, and more.

---

## ⚡ Quick Start (5 steps)

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file (a working copy is already included as .env)
#    Open .env and fill in MONGO_URI and GEMINI_API_KEY (minimum required)

# 3. (Optional) Seed default categories + an admin user
npm run seed

# 4. Run in development (auto-restart)
npm run dev

# 5. Production
npm start
```

Server runs at `http://localhost:5000`. Test it: open `http://localhost:5000/api/health`.

---

## 🔑 Required vs Optional Config

| Variable | Required? | Notes |
|---|---|---|
| `MONGO_URI` | ✅ Required | Local Mongo or MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ Required | Any long random string |
| `GEMINI_API_KEY` | ✅ Required for AI trips | Free key: https://aistudio.google.com/app/apikey |
| `GEMINI_MODEL` | optional | Defaults to `gemini-1.5-flash`. Update if Google releases a newer one. |
| `CLOUDINARY_*` | optional | If empty → images saved to local `/uploads` instead |
| `EMAIL_*` | optional | If empty → reset tokens printed to the console |

> The app **runs out of the box** with just `MONGO_URI` + `JWT_SECRET`. Add `GEMINI_API_KEY` to enable AI trips. Cloudinary and email are optional.

### Install MongoDB
- **Easiest (cloud, free):** create a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas), copy the connection string into `MONGO_URI`.
- **Local:** install MongoDB Community Server, then `MONGO_URI=mongodb://127.0.0.1:27017/tourism_app`.

---

## 📡 API Endpoints

Base URL: `http://localhost:5000/api`

### Auth
| Method | Endpoint | Access | Body |
|---|---|---|---|
| POST | `/auth/register` | Public | `{ name, email, password, role }` (role: `tourist`/`local`) |
| POST | `/auth/login` | Public | `{ email, password }` |
| POST | `/auth/forgot-password` | Public | `{ email }` |
| POST | `/auth/reset-password/:token` | Public | `{ password }` |
| GET | `/auth/profile` | Private | — |
| PUT | `/auth/profile` | Private | `{ name?, avatar?, password? }` |

### Trips (AI) — all require login
| Method | Endpoint | Body |
|---|---|---|
| POST | `/trips/generate` | `{ destination, days, budget, preference, travelers?, extraNotes? }` |
| POST | `/trips/save` | the trip object returned from `/generate` |
| GET | `/trips/saved` | — |
| GET | `/trips/:id` | — |
| DELETE | `/trips/:id` | — |

### Places
| Method | Endpoint | Access |
|---|---|---|
| GET | `/places?search=&category=&city=&page=&limit=` | Public |
| GET | `/places/:id` | Public (returns place + reviews) |
| POST | `/places` | Private (local/admin) — multipart, field `images` |
| PUT | `/places/:id` | Private (owner/admin) |
| DELETE | `/places/:id` | Private (owner/admin) |
| GET | `/places/mine/list` | Private (my uploads) |

### Reviews
| Method | Endpoint | Access |
|---|---|---|
| GET | `/places/:placeId/reviews` | Public |
| POST | `/places/:placeId/reviews` | Private — `{ rating, comment }` |
| DELETE | `/places/:placeId/reviews/:reviewId` | Private |

### Categories
| Method | Endpoint | Access |
|---|---|---|
| GET | `/categories` | Public |
| POST | `/categories` | Admin |
| DELETE | `/categories/:id` | Admin |

**Auth header for private routes:** `Authorization: Bearer <token>`

---

## 🤖 AI Trip Generation Response Shape

`POST /api/trips/generate` returns strict, validated JSON:

```json
{
  "success": true,
  "trip": {
    "destination": "Hunza",
    "overview": "...",
    "bestTimeToVisit": "April to October",
    "estimatedTotalCost": "PKR 45,000",
    "travelTips": ["Carry warm clothes", "..."],
    "itinerary": [
      {
        "day": 1,
        "title": "Arrival & Karimabad",
        "activities": [
          {
            "time": "09:00 AM",
            "title": "Visit Baltit Fort",
            "description": "Explore the 700-year-old fort.",
            "location": "Karimabad",
            "estimatedCost": "PKR 500"
          }
        ]
      }
    ],
    "meta": { "model": "gemini-1.5-flash", "generatedAt": "..." }
  }
}
```

To save it: send this `trip` object to `POST /api/trips/save`.

---

## 📱 Flutter Integration (using `dio`)

```dart
import 'package:dio/dio.dart';

final dio = Dio(BaseOptions(baseUrl: 'http://10.0.2.2:5000/api'));
// Note: use 10.0.2.2 for Android emulator, localhost for iOS sim,
//       or your PC's LAN IP (e.g. 192.168.1.5) for a real device.

// Login
final res = await dio.post('/auth/login', data: {
  'email': 'ali@gmail.com',
  'password': '123456',
});
final token = res.data['token'];

// Authenticated request
dio.options.headers['Authorization'] = 'Bearer $token';

// Generate a trip
final trip = await dio.post('/trips/generate', data: {
  'destination': 'Hunza',
  'days': 3,
  'budget': 'medium',
  'preference': 'adventure',
});
```

Save the JWT with `flutter_secure_storage` and attach it via a Dio interceptor.

---

## 📂 Folder Structure

```
backend/
├── config/        # db + cloudinary setup
├── controllers/   # request logic
├── middleware/    # auth, roles, uploads, errors
├── models/        # Mongoose schemas
├── routes/        # API endpoints
├── services/      # Gemini AI, Cloudinary, Email
├── utils/         # token, asyncHandler, seed
├── uploads/       # local image fallback
├── .env           # your secrets (not committed)
├── app.js         # express app
└── server.js      # entry point
```

---

## 🚀 Deployment (free tiers)
- **Backend:** [Render](https://render.com) or [Railway](https://railway.app) — set the same env vars in their dashboard.
- **Database:** MongoDB Atlas.
- **Images:** Cloudinary (recommended for production; local `/uploads` won't persist on most hosts).

---

## 🔐 Security included
JWT auth · bcrypt password hashing · Helmet headers · rate limiting (general + stricter auth) · CORS · input validation · role-based access · per-user data isolation.
