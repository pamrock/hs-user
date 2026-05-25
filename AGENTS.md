# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 frontend application for a service management system with a user-facing interface. It's built with Vite, Vue 3, Element Plus UI library, and Vue Router. The application provides a mobile-friendly user interface for browsing services, managing orders, and user profiles.

## Development Commands

- `yarn dev` - Start development server with hot reload
- `yarn build` - Build for production
- `yarn preview` - Preview production build locally

## Architecture

### Tech Stack
- **Vue 3** with Composition API (`<script setup>` syntax)
- **Vite** as build tool and dev server
- **Element Plus** UI component library with icons
- **Vue Router 4** for routing with hash-based history
- **Axios** for HTTP requests with interceptors
- **LocalStorage** for token management

### Project Structure
```
src/
├── api/           # API service modules (login.js, user.js, order.js, etc.)
├── assets/        # Static assets (CSS, images)
├── components/    # Reusable Vue components
├── router/        # Vue Router configuration
├── utils/         # Utilities (request.js, auth.js)
├── views/         # Page components
│   └── user/      # User-facing pages
│       ├── layout.vue    # Main layout with bottom tab bar
│       ├── login.vue     # Login page
│       ├── register.vue  # Registration page
│       ├── services.vue  # Services listing and detail
│       ├── orders.vue    # User orders
│       └── profile.vue   # User profile
├── App.vue        # Root component
└── main.js        # Application entry point
```

### Key Architectural Patterns

1. **Dual Token System**: The application manages two types of tokens:
   - `admin_token` for admin/management interfaces
   - `user_token` for user-facing interfaces
   - Tokens are stored in localStorage and automatically attached to requests based on route path

2. **API Layer**: All API calls are centralized in the `src/api/` directory with dedicated modules for each resource (user, order, item, etc.). The `request.js` utility handles:
   - Base URL configuration (dev: `/api`, prod: `https://admint.pamrock.top/api`)
   - Request/response interceptors
   - Automatic token injection
   - Error handling and token expiration redirects

3. **Routing**: Uses Vue Router with a hash-based history. Routes are defined in `src/router/index.js`:
   - `/user/login` - User login
   - `/user/register` - User registration
   - `/user/services` - Services listing (default user route)
   - `/user/orders` - User orders
   - `/user/profile` - User profile
   - All user routes are nested under `/user` with a layout containing a bottom tab bar

4. **Mobile-First Design**: The user interface is optimized for mobile with:
   - Bottom tab navigation
   - Responsive layouts using flexbox
   - Touch-friendly components
   - Full viewport height containers

### Development Configuration

- **Vite Proxy**: Development server proxies `/api` requests to `https://admint.pamrock.top` with `secure: false`
- **Path Aliases**: `@` maps to `./src` directory
- **CSS**: Uses Element Plus CSS and custom styles in `src/assets/`
- **Environment**: Development vs production API base URLs are configured in `src/utils/request.js`

### Authentication Flow

1. **Login/Register**: Users authenticate via `/user/login` or `/user/register`
2. **Token Storage**: Successful authentication stores `user_token` in localStorage
3. **Request Interception**: `request.js` automatically adds `Authorization: Bearer <token>` header
4. **Token Validation**: `auth.js` provides `isTokenExpired()` function that calls backend validation
5. **Expiration Handling**: 401/403 responses trigger token removal and redirect to login

### Component Patterns

- **Layout Components**: `src/views/user/layout.vue` provides the main user interface with bottom tab bar
- **Page Components**: Each route has a corresponding Vue component in `src/views/user/`
- **Reusable Components**: Shared components in `src/components/` (e.g., `AddressDialog.vue`)
- **API Integration**: Pages import and use API functions from `src/api/` modules

### Styling Approach

- **Element Plus**: Primary UI component library with built-in styles
- **Custom CSS**: Scoped styles in Vue components using `<style scoped>`
- **Global Styles**: `src/assets/main.css` for global styles
- **Mobile Optimization**: Uses `100dvh` for viewport height, hidden scrollbars, and touch-friendly sizing

## Important Notes

- The application uses **hash-based routing** (`createWebHashHistory`) which affects how URLs are structured
- **Dual token system** means authentication logic depends on whether the current route starts with `/user`
- **Production API** is at `https://admint.pamrock.top/api` while development uses proxy to same endpoint
- **Error code 1020** is treated specially as a server error that doesn't trigger token expiration
- **Form data uploads** are handled with `FormData` for file uploads (see `updateUserBySelf` in `user.js`)

## VS Code Configuration

- **Volar extension** is required for Vue 3 development
- **File nesting** is enabled for common configuration files (package.json, vite.config.*, etc.)