# Pagefolio Backend

A clean Node.js + Express backend API for the Pagefolio multi-user public profile platform. This backend is designed to work with a static frontend hosted separately on GitHub Pages.

## Folder Tree

```text
backend/
  src/
    server.js
    app.js
    config/
      db.js
      env.js
    routes/
      auth.routes.js
      profile.routes.js
      user.routes.js
      analytics.routes.js
    controllers/
      auth.controller.js
      profile.controller.js
      user.controller.js
      analytics.controller.js
    middleware/
      auth.middleware.js
      error.middleware.js
      notfound.middleware.js
    models/
      User.js
      Profile.js
      ProfileView.js
    utils/
      generateToken.js
      slugifyUsername.js
      apiResponse.js
  package.json
  .env.example
  README.md
```

## Features

- User signup and login
- JWT authentication
- Create and update profile
- Fetch public profile by username
- Username availability check
- Basic profile view analytics
- CORS support for GitHub Pages frontend
- Environment-based configuration
- Modular folder structure for easier maintenance

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- JWT
- bcryptjs
- dotenv
- cors
- helmet
- morgan

## Install Steps

```bash
cd backend
npm install
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Update the values with your real credentials

Example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/pagefolio
JWT_SECRET=replace_this_with_a_strong_secret
CLIENT_URL=https://your-username.github.io
```

You can also allow multiple frontend origins by separating them with commas:

```env
CLIENT_URL=https://your-username.github.io,https://your-custom-domain.com
```

## Run Steps

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

## Sample CORS Config For GitHub Pages

The backend already reads `CLIENT_URL` from `.env` and supports comma-separated origins.

Example GitHub Pages frontend origin:

```env
CLIENT_URL=https://aaditya99999.github.io
```

Example with custom domain too:

```env
CLIENT_URL=https://aaditya99999.github.io,https://mydomain.in
```

## API Endpoints

### Health

- `GET /api/health`

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

Signup body:

```json
{
  "name": "Aaditya",
  "email": "aaditya@example.com",
  "username": "aaditya",
  "password": "strongpassword"
}
```

Login body:

```json
{
  "identifier": "aaditya",
  "password": "strongpassword"
}
```

You can also pass `email` or `username` instead of `identifier`.

### Profile

- `GET /api/profile/:username`
- `POST /api/profile`
- `PUT /api/profile`
- `GET /api/profile/check-username/:username`

Create/update profile body example:

```json
{
  "username": "aaditya",
  "displayName": "Aaditya Sharma",
  "headline": "Web Designer and Developer",
  "bio": "I build portfolios and landing pages.",
  "location": "India",
  "profileImage": "https://example.com/profile.jpg",
  "coverImage": "https://example.com/cover.jpg",
  "whatsapp": "+919999999999",
  "email": "contact@example.com",
  "website": "https://example.com",
  "socialLinks": [
    {
      "platform": "Instagram",
      "url": "https://instagram.com/example"
    }
  ],
  "services": [
    {
      "title": "Portfolio Website",
      "description": "Custom portfolio setup"
    }
  ],
  "projects": [
    {
      "title": "Brand Site",
      "description": "Landing page for a personal brand",
      "link": "https://example.com/project",
      "image": "https://example.com/project.jpg"
    }
  ],
  "theme": {
    "accent": "#111111",
    "background": "#f8f6f1"
  },
  "isPublic": true
}
```

### User

- `GET /api/user/me`
- `PUT /api/user/me`

Update user body example:

```json
{
  "name": "Aaditya Sharma",
  "email": "aaditya@example.com",
  "username": "aaditya"
}
```

### Analytics

- `POST /api/analytics/view/:username`
- `GET /api/analytics/:username`

Analytics route note:

- `POST /api/analytics/view/:username` is public for tracking views.
- `GET /api/analytics/:username` requires a Bearer token and only allows the profile owner to view analytics.

## Frontend Integration Notes

Your static frontend can call this API like this:

- `login.html` for signup and login
- `dashboard.html` to save or update profile
- `profile.html?u=username` to fetch public profile and send a profile view event

Example profile fetch from static frontend:

```js
const username = new URLSearchParams(window.location.search).get("u");
const response = await fetch(`https://api.mydomain.in/api/profile/${username}`);
const result = await response.json();
```

Example analytics tracking from public profile page:

```js
await fetch(`https://api.mydomain.in/api/analytics/view/${username}`, {
  method: "POST"
});
```

Example authenticated request:

```js
await fetch("https://api.mydomain.in/api/profile", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify(profileData)
});
```

## Important Notes

- Passwords are hashed with `bcryptjs` before being stored.
- JWT tokens expire in 7 days by default.
- `GET /api/profile/:username` only returns public-safe profile fields.
- Analytics stores IP and user-agent for basic insights.
- The backend is ready for cleaner routing later without changing the core data model.
