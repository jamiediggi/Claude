import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || path.join(process.cwd(), 'data', 'football.db');

// Ensure data directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

const db = drizzle(sqlite, { schema });

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const [adminUser] = db.insert(schema.users).values({
    name: 'Admin User',
    email: 'admin@footballteam.local',
    password: hashedPassword,
    role: 'admin',
  }).returning().all();
  console.log('Created admin user:', adminUser.email);

  // Create a team
  const [team] = db.insert(schema.teams).values({
    name: 'Riverside FC',
    ageGroup: 'U9',
    homeGround: 'Riverside Park',
    notes: 'Founded 2020',
  }).returning().all();
  console.log('Created team:', team.name);

  // Create seasons
  const [currentSeason] = db.insert(schema.seasons).values({
    teamId: team.id,
    name: '2025/26',
    startDate: new Date('2025-09-01'),
    endDate: new Date('2026-06-30'),
    isCurrent: true,
  }).returning().all();

  const [previousSeason] = db.insert(schema.seasons).values({
    teamId: team.id,
    name: '2024/25',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-06-30'),
    isCurrent: false,
  }).returning().all();
  console.log('Created seasons');

  // Create players
  const playerData = [
    { firstName: 'James', lastName: 'Wilson', shirtNumber: 1, preferredPosition: 'Goalkeeper' },
    { firstName: 'Oliver', lastName: 'Smith', shirtNumber: 2, preferredPosition: 'Defender' },
    { firstName: 'Harry', lastName: 'Brown', shirtNumber: 3, preferredPosition: 'Defender' },
    { firstName: 'Charlie', lastName: 'Davies', shirtNumber: 4, preferredPosition: 'Defender' },
    { firstName: 'Thomas', lastName: 'Evans', shirtNumber: 5, preferredPosition: 'Midfielder' },
    { firstName: 'George', lastName: 'Taylor', shirtNumber: 6, preferredPosition: 'Midfielder' },
    { firstName: 'Oscar', lastName: 'Johnson', shirtNumber: 7, preferredPosition: 'Midfielder' },
    { firstName: 'Noah', lastName: 'Williams', shirtNumber: 8, preferredPosition: 'Midfielder' },
    { firstName: 'Leo', lastName: 'Jones', shirtNumber: 9, preferredPosition: 'Forward' },
    { firstName: 'Alfie', lastName: 'Roberts', shirtNumber: 10, preferredPosition: 'Forward' },
    { firstName: 'Jacob', lastName: 'Martin', shirtNumber: 11, preferredPosition: 'Forward' },
    { firstName: 'Ethan', lastName: 'Thompson', shirtNumber: 12, preferredPosition: 'Substitute' },
    { firstName: 'Freddie', lastName: 'White', shirtNumber: 13, preferredPosition: 'Substitute' },
    { firstName: 'Archie', lastName: 'Harris', shirtNumber: 14, preferredPosition: 'Substitute' },
  ];

  const players = db.insert(schema.players).values(
    playerData.map(p => ({
      ...p,
      teamId: team.id,
      active: true,
    }))
  ).returning().all();
  console.log('Created', players.length, 'players');

  // Create opponents
  const opponentData = [
    { name: 'Oakwood United', homeGroundName: 'Oakwood Stadium', postcode: 'OW1 2AB' },
    { name: 'Valley Rangers', homeGroundName: 'Valley Park', postcode: 'VR3 4CD' },
    { name: 'Hilltop FC', homeGroundName: 'Hilltop Arena', postcode: 'HT5 6EF' },
    { name: 'Lakeside Town', homeGroundName: 'Lake View', postcode: 'LT7 8GH' },
    { name: 'Greenfield Athletic', homeGroundName: 'Green Park', postcode: 'GA9 0IJ' },
  ];

  const opponents = db.insert(schema.opponents).values(opponentData).returning().all();
  console.log('Created', opponents.length, 'opponents');

  // Create trophies
  const [motmTrophy] = db.insert(schema.trophies).values({
    teamId: team.id,
    seasonId: currentSeason.id,
    name: 'Player of the Match',
    description: 'Awarded to the best performer in each match',
  }).returning().all();

  const [topScorerTrophy] = db.insert(schema.trophies).values({
    teamId: team.id,
    seasonId: currentSeason.id,
    name: 'Golden Boot',
    description: 'Top scorer of the season',
  }).returning().all();
  console.log('Created trophies');

  // Create fixtures (some played, some upcoming)
  const now = new Date();
  const fixtures = [];

  // Past fixtures (played)
  for (let i = 0; i < 3; i++) {
    const fixtureDate = new Date(now);
    fixtureDate.setDate(fixtureDate.getDate() - (21 - i * 7)); // 3, 2, 1 weeks ago

    const [fixture] = db.insert(schema.fixtures).values({
      teamId: team.id,
      seasonId: currentSeason.id,
      opponentId: opponents[i].id,
      dateTime: fixtureDate,
      isHome: i % 2 === 0,
      venueName: i % 2 === 0 ? team.homeGround : opponents[i].homeGroundName,
      venueAddress: i % 2 === 0 ? 'Riverside Park, RS1 1AA' : opponents[i].postcode,
      status: 'Played',
    }).returning().all();
    fixtures.push(fixture);
  }

  // Future fixtures (scheduled)
  for (let i = 0; i < 3; i++) {
    const fixtureDate = new Date(now);
    fixtureDate.setDate(fixtureDate.getDate() + (7 + i * 7)); // 1, 2, 3 weeks from now

    const [fixture] = db.insert(schema.fixtures).values({
      teamId: team.id,
      seasonId: currentSeason.id,
      opponentId: opponents[i + 2].id,
      dateTime: fixtureDate,
      isHome: i % 2 === 1,
      venueName: i % 2 === 1 ? team.homeGround : opponents[i + 2].homeGroundName,
      venueAddress: i % 2 === 1 ? 'Riverside Park, RS1 1AA' : opponents[i + 2].postcode,
      status: 'Scheduled',
    }).returning().all();
    fixtures.push(fixture);
  }
  console.log('Created', fixtures.length, 'fixtures');

  // Create matches for played fixtures
  const matchResults = [
    { ourScore: 3, theirScore: 1, captainIndex: 4 }, // vs Oakwood
    { ourScore: 2, theirScore: 2, captainIndex: 8 }, // vs Valley
    { ourScore: 4, theirScore: 0, captainIndex: 9 }, // vs Hilltop
  ];

  for (let i = 0; i < 3; i++) {
    const fixture = fixtures[i];
    const result = matchResults[i];

    const [match] = db.insert(schema.matches).values({
      fixtureId: fixture.id,
      ourScore: result.ourScore,
      theirScore: result.theirScore,
      captainPlayerId: players[result.captainIndex].id,
      weather: ['Sunny', 'Cloudy', 'Light Rain'][i],
    }).returning().all();

    // Add appearances (all players played)
    const playingPlayers = players.slice(0, 11);
    for (const player of playingPlayers) {
      db.insert(schema.appearances).values({
        matchId: match.id,
        playerId: player.id,
        started: true,
        minutes: 60,
      }).run();
    }

    // Add goals as match events
    const scorers = [
      [players[8], players[8], players[9]], // Match 1: Leo (2), Alfie (1)
      [players[9], players[10]], // Match 2: Alfie, Jacob
      [players[8], players[8], players[9], players[10]], // Match 3: Leo (2), Alfie, Jacob
    ];

    for (const scorer of scorers[i]) {
      db.insert(schema.matchEvents).values({
        matchId: match.id,
        type: 'Goal',
        playerId: scorer.id,
      }).run();
    }

    // Add MOTM trophy awards
    const motmWinners = [players[8], players[4], players[8]]; // Leo, Thomas, Leo
    db.insert(schema.trophyAwards).values({
      trophyId: motmTrophy.id,
      matchId: match.id,
      playerId: motmWinners[i].id,
      date: fixture.dateTime,
    }).run();
  }
  console.log('Created matches with appearances, goals, and trophy awards');

  console.log('\n✅ Database seeded successfully!');
  console.log('\nLogin credentials:');
  console.log('  Email: admin@footballteam.local');
  console.log('  Password: admin123');
}

seed().catch(console.error).finally(() => {
  sqlite.close();
});
