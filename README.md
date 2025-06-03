# Voluntr

A React Native app for discovering, sharing, and tracking volunteer opportunities.
Built with Expo, Supabase, and a modern mobile UI.

## Features

- **Authentication:** Sign up, log in, password reset, and email change via Supabase Auth.
- **Profile Management:** Edit your profile, track stats, and earn badges.
- **Event Discovery:** Browse, search, and filter volunteer events.
- **Posts:** Create and share your volunteering experiences.
- **Intro Video:** Engaging intro video plays on every app launch.
- **Modern UI:** Clean, mobile-first design.

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

## Project Structure

- `src/screens/` — App screens (Home, Profile, Events, etc.)
- `src/context/` — React Contexts for state management
- `src/lib/` — Supabase and auth utilities
- `assets/` — Images, icons, and intro video

## Customization

- Replace `assets/intro.mp4` with your own intro video if desired.
- Edit Supabase settings in `src/lib/supabase.ts`.

## License

MIT

---

Made with ❤️ by Mahmoud Salem (bigmoud) 