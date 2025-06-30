# Voluntr

A React Native app for discovering, sharing, and tracking volunteer opportunities.
Built with Expo, Supabase, and a modern mobile UI.

## Features

### Authentication & User Management
- **Authentication:** Complete auth flow with sign up, login, password reset, and email verification via Supabase Auth
- **Profile Management:** 
  - Create and edit detailed user profiles
  - Track volunteering stats and achievements
  - Earn badges for contributions
  - Follow other volunteers
  - View followers and following lists

### Event Management
- **Event Discovery:** 
  - Browse and search volunteer events
  - Filter events by location, category, and date
  - View event details and requirements
  - Save favorite events
- **My Events:** 
  - Track upcoming and past events
  - Manage event registrations
  - View event history

### Social Features
- **Posts:** 
  - Create and share volunteering experiences
  - Add photos and descriptions
  - View posts from followed users
  - Like and comment on posts
- **Discovery Feed:** 
  - Browse posts from the community
  - Filter by categories
  - Search for specific content

### Additional Features
- **Notifications:** Real-time updates for events, follows, and interactions
- **Intro Video:** Engaging intro video plays on first app launch
- **Location Services:** Integrated Google Maps for event locations and discovery
- **Modern UI:** Clean, intuitive mobile-first design with smooth animations

## Technical Stack

### Frontend
- React Native with Expo
- TypeScript for type safety
- React Navigation for routing
- Context API for state management
- Custom hooks for reusable logic
- Modern UI components and animations

### Backend
- Supabase for:
  - Authentication
  - Real-time database
  - Storage for images and media
  - Edge functions for serverless operations
- PostgreSQL database with:
  - User profiles
  - Events
  - Posts
  - Social connections
  - Notifications

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)
- A Supabase project (for backend)

### Installation

1. Clone the repo:
   ```sh
   git clone https://github.com/bigmoud/voluntr.git
   cd voluntr
   ```

2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```

3. Set up your `.env` file with your Supabase credentials:
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the app:
   ```sh
   npx expo start
   ```

### Google Maps API Setup

To enable location search and mapping features, you'll need to set up a Google Maps API key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Places API
   - Geocoding API
   - Maps SDK for iOS
   - Maps SDK for Android
4. Create credentials (API key)
5. Update `app.json` with your API key:
   ```json
   "ios": {
     "config": {
       "googleMapsApiKey": "your-actual-api-key-here"
     }
   },
   "android": {
     "config": {
       "googleMaps": {
         "apiKey": "your-actual-api-key-here"
       }
     }
   }
   ```

## Project Structure

- `src/screens/` — App screens (Home, Profile, Events, etc.)
- `src/components/` — Reusable UI components
- `src/navigation/` — Navigation configuration
- `src/context/` — React Contexts for state management
- `src/hooks/` — Custom React hooks
- `src/lib/` — Utility functions and services
- `src/services/` — API and external service integrations
- `src/types/` — TypeScript type definitions
- `src/constants/` — App constants and configuration
- `src/providers/` — Context providers
- `assets/` — Images, icons, and intro video
- `supabase/` — Database migrations and backend configuration

## App Flow

1. **Onboarding**
   - Intro video on first launch
   - Authentication (Sign up/Login)
   - Profile creation

2. **Main Experience**
   - Home feed with posts and events
   - Event discovery and registration
   - Profile management and social features
   - Notifications for updates

3. **Social Features**
   - Follow other volunteers
   - Create and share posts
   - Interact with community content

## License

MIT

---

Made with ❤️ by Mahmoud Salem (bigmoud) & Michael Zhan (mikezhan88)