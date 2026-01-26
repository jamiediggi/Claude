# Football Team App

A web application for managing a youth football team. Features an admin area for team management and a public frontend for parents/fans to view fixtures, results, and stats.

## Features

### Admin Area (Private)
- **Players Management**: Add, edit, and deactivate players
- **Opponents Management**: Manage opponent teams and their venues
- **Fixtures Management**: Create and manage fixtures
- **Results Entry**: Enter match results including scores, captain, players who played, goals, and trophy awards
- **Match Report Generator**: Generate formatted match reports with one click
- **Trophies**: View and manage trophy awards

### Public Frontend (Read-only)
- **Home Page**: Next fixture, recent results, top scorers
- **Fixtures Page**: View upcoming fixtures with dates, times, and venues
- **Results Page**: View all results with season summary stats
- **Match Details**: View individual match details including scorers and awards
- **Stats Page**: Top scorers and appearances leaderboards
- **Trophies Page**: Trophy winners and recent awards

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: SQLite with Drizzle ORM
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository and navigate to the project folder:
   ```bash
   cd football-team-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database and seed sample data:
   ```bash
   npm run db:setup
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Admin Login

After running `npm run db:setup`, use these credentials to access the admin area:

- **URL**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Email**: `admin@footballteam.local`
- **Password**: `admin123`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with sample data
- `npm run db:setup` - Push schema and seed data (first-time setup)
- `npm run db:studio` - Open Drizzle Studio to browse database

## Project Structure

```
src/
├── app/
│   ├── admin/           # Admin pages (protected)
│   │   ├── fixtures/    # Fixtures CRUD
│   │   ├── opponents/   # Opponents CRUD
│   │   ├── players/     # Players CRUD
│   │   ├── trophies/    # Trophies management
│   │   └── login/       # Admin login
│   ├── api/             # API routes
│   │   ├── fixtures/    # Fixtures API
│   │   ├── matches/     # Matches API
│   │   ├── opponents/   # Opponents API
│   │   └── players/     # Players API
│   ├── fixtures/        # Public fixtures page
│   ├── matches/         # Public match details
│   ├── results/         # Public results page
│   ├── stats/           # Public stats page
│   ├── trophies/        # Public trophies page
│   └── page.tsx         # Public home page
├── components/
│   ├── admin/           # Admin components
│   └── public/          # Public components
└── lib/
    ├── auth.ts          # NextAuth configuration
    └── db/              # Database schema and connection
```

## Database Schema

- **Team**: Team information (name, age group, home ground)
- **Season**: Season periods with current flag
- **Player**: Player details with shirt number and position
- **Opponent**: Opponent teams with venue information
- **Fixture**: Scheduled matches
- **Match**: Match results (1:1 with fixture when played)
- **Appearance**: Players who played in each match
- **MatchEvent**: Goals, assists, cards, etc.
- **Trophy**: Trophy types (e.g., Player of the Match)
- **TrophyAward**: Trophy awards to players

## Workflows

### Adding a Result

1. Navigate to Admin > Fixtures
2. Click "Enter Result" on a scheduled fixture
3. Enter the score
4. Select players who played (checkbox list)
5. Select the captain
6. Add goals (select scorer, optionally add minute)
7. Add trophy awards (optional)
8. Click "Save Result"

### Generating a Match Report

1. Navigate to Admin > Fixtures
2. Click on a played fixture
3. Click "Generate Report" button
4. Copy the generated report text

## Future Enhancements

- Multiple teams support
- Image uploads for matches
- Email/WhatsApp sharing
- More detailed match events (assists, saves, cards)
- Automated report publishing
