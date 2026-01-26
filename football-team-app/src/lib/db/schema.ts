import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ============================================
// Authentication Tables (for NextAuth)
// ============================================

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: integer('email_verified', { mode: 'timestamp' }),
  image: text('image'),
  password: text('password'),
  role: text('role').default('user').notNull(), // 'admin' or 'user'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionToken: text('session_token').unique().notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});

export const verificationTokens = sqliteTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: integer('expires', { mode: 'timestamp' }).notNull(),
});

// ============================================
// Football Team App Tables
// ============================================

export const teams = sqliteTable('teams', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  ageGroup: text('age_group'),
  homeGround: text('home_ground'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const seasons = sqliteTable('seasons', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // e.g. 2025/26
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  isCurrent: integer('is_current', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const players = sqliteTable('players', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  shirtNumber: integer('shirt_number'),
  preferredPosition: text('preferred_position'),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const opponents = sqliteTable('opponents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  homeGroundName: text('home_ground_name'),
  postcode: text('postcode'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Fixture status enum values: 'Scheduled' | 'Played' | 'Postponed' | 'Cancelled'
export const fixtures = sqliteTable('fixtures', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  seasonId: text('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  opponentId: text('opponent_id').notNull().references(() => opponents.id, { onDelete: 'cascade' }),
  dateTime: integer('date_time', { mode: 'timestamp' }).notNull(),
  isHome: integer('is_home', { mode: 'boolean' }).default(true),
  venueName: text('venue_name'),
  venueAddress: text('venue_address'),
  status: text('status').default('Scheduled').notNull(), // Scheduled | Played | Postponed | Cancelled
  notes: text('notes'), // admin-only
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const matches = sqliteTable('matches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  fixtureId: text('fixture_id').notNull().unique().references(() => fixtures.id, { onDelete: 'cascade' }),
  ourScore: integer('our_score').notNull(),
  theirScore: integer('their_score').notNull(),
  captainPlayerId: text('captain_player_id').references(() => players.id, { onDelete: 'set null' }),
  referee: text('referee'),
  weather: text('weather'),
  summaryNotes: text('summary_notes'), // admin-only
  matchReport: text('match_report'), // generated report
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const appearances = sqliteTable('appearances', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  matchId: text('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  started: integer('started', { mode: 'boolean' }).default(true),
  minutes: integer('minutes'),
  position: text('position'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// MatchEvent type enum: 'Goal' | 'Assist' | 'CleanSheet' | 'Yellow' | 'Red' | 'Save' | 'Other'
export const matchEvents = sqliteTable('match_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  matchId: text('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // Goal | Assist | CleanSheet | Yellow | Red | Save | Other
  playerId: text('player_id').references(() => players.id, { onDelete: 'set null' }), // nullable for team events
  minute: integer('minute'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const trophies = sqliteTable('trophies', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  seasonId: text('season_id').references(() => seasons.id, { onDelete: 'set null' }),
  name: text('name').notNull(), // e.g. Player of the Match
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const trophyAwards = sqliteTable('trophy_awards', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  trophyId: text('trophy_id').notNull().references(() => trophies.id, { onDelete: 'cascade' }),
  matchId: text('match_id').references(() => matches.id, { onDelete: 'set null' }),
  date: integer('date', { mode: 'timestamp' }),
  playerId: text('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// ============================================
// Relations
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  seasons: many(seasons),
  players: many(players),
  fixtures: many(fixtures),
  trophies: many(trophies),
}));

export const seasonsRelations = relations(seasons, ({ one, many }) => ({
  team: one(teams, { fields: [seasons.teamId], references: [teams.id] }),
  fixtures: many(fixtures),
  trophies: many(trophies),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  team: one(teams, { fields: [players.teamId], references: [teams.id] }),
  appearances: many(appearances),
  matchEvents: many(matchEvents),
  captainedMatches: many(matches, { relationName: 'captain' }),
  trophyAwards: many(trophyAwards),
}));

export const opponentsRelations = relations(opponents, ({ many }) => ({
  fixtures: many(fixtures),
}));

export const fixturesRelations = relations(fixtures, ({ one }) => ({
  team: one(teams, { fields: [fixtures.teamId], references: [teams.id] }),
  season: one(seasons, { fields: [fixtures.seasonId], references: [seasons.id] }),
  opponent: one(opponents, { fields: [fixtures.opponentId], references: [opponents.id] }),
  match: one(matches),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  fixture: one(fixtures, { fields: [matches.fixtureId], references: [fixtures.id] }),
  captain: one(players, {
    fields: [matches.captainPlayerId],
    references: [players.id],
    relationName: 'captain'
  }),
  appearances: many(appearances),
  matchEvents: many(matchEvents),
  trophyAwards: many(trophyAwards),
}));

export const appearancesRelations = relations(appearances, ({ one }) => ({
  match: one(matches, { fields: [appearances.matchId], references: [matches.id] }),
  player: one(players, { fields: [appearances.playerId], references: [players.id] }),
}));

export const matchEventsRelations = relations(matchEvents, ({ one }) => ({
  match: one(matches, { fields: [matchEvents.matchId], references: [matches.id] }),
  player: one(players, { fields: [matchEvents.playerId], references: [players.id] }),
}));

export const trophiesRelations = relations(trophies, ({ one, many }) => ({
  team: one(teams, { fields: [trophies.teamId], references: [teams.id] }),
  season: one(seasons, { fields: [trophies.seasonId], references: [seasons.id] }),
  awards: many(trophyAwards),
}));

export const trophyAwardsRelations = relations(trophyAwards, ({ one }) => ({
  trophy: one(trophies, { fields: [trophyAwards.trophyId], references: [trophies.id] }),
  match: one(matches, { fields: [trophyAwards.matchId], references: [matches.id] }),
  player: one(players, { fields: [trophyAwards.playerId], references: [players.id] }),
}));

// ============================================
// Type Exports
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type Season = typeof seasons.$inferSelect;
export type NewSeason = typeof seasons.$inferInsert;

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

export type Opponent = typeof opponents.$inferSelect;
export type NewOpponent = typeof opponents.$inferInsert;

export type Fixture = typeof fixtures.$inferSelect;
export type NewFixture = typeof fixtures.$inferInsert;

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;

export type Appearance = typeof appearances.$inferSelect;
export type NewAppearance = typeof appearances.$inferInsert;

export type MatchEvent = typeof matchEvents.$inferSelect;
export type NewMatchEvent = typeof matchEvents.$inferInsert;

export type Trophy = typeof trophies.$inferSelect;
export type NewTrophy = typeof trophies.$inferInsert;

export type TrophyAward = typeof trophyAwards.$inferSelect;
export type NewTrophyAward = typeof trophyAwards.$inferInsert;

// Fixture status type
export type FixtureStatus = 'Scheduled' | 'Played' | 'Postponed' | 'Cancelled';

// Match event type
export type MatchEventType = 'Goal' | 'Assist' | 'CleanSheet' | 'Yellow' | 'Red' | 'Save' | 'Other';
