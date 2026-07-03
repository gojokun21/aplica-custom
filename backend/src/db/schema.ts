import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/* -------------------------------------------------------------------------- */
/*                                    Users                                    */
/* -------------------------------------------------------------------------- */

export const USER_ROLES = ['CLIENT', 'FREELANCER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const userRoleEnum = pgEnum('user_role', USER_ROLES);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull().default('CLIENT'),
  avatarUrl: varchar('avatar_url', { length: 300 }),
  blockedAt: timestamp('blocked_at', { withTimezone: true }),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*                               Refresh tokens                               */
/* -------------------------------------------------------------------------- */

/**
 * Sesiuni de refresh. Stocăm doar hash-ul token-ului (argon2), niciodată
 * token-ul brut. `id` este folosit ca `jti` în JWT-ul de refresh.
 */
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  userAgent: varchar('user_agent', { length: 400 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*                  Auth tokens (verificare email / reset parolă)             */
/* -------------------------------------------------------------------------- */

export const AUTH_TOKEN_TYPES = ['EMAIL_VERIFICATION', 'PASSWORD_RESET'] as const;
export type AuthTokenType = (typeof AUTH_TOKEN_TYPES)[number];

export const authTokenTypeEnum = pgEnum('auth_token_type', AUTH_TOKEN_TYPES);

/**
 * Token-uri de unică folosință. Token-ul emis are forma `id.secret`; în DB
 * păstrăm doar hash-ul secretului, deci un dump al bazei nu permite folosirea lor.
 */
export const authTokens = pgTable('auth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: authTokenTypeEnum('type').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*                             Freelancer profiles                            */
/* -------------------------------------------------------------------------- */

export const freelancerProfiles = pgTable('freelancer_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 150 }),
  overview: text('overview'),
  /** Tarif orar în cenți USD (evită erori de virgulă mobilă). */
  hourlyRateCents: integer('hourly_rate_cents'),
  countryCode: varchar('country_code', { length: 2 }),
  available: boolean('available').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*                               Client profiles                              */
/* -------------------------------------------------------------------------- */

export const clientProfiles = pgTable('client_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  companyName: varchar('company_name', { length: 150 }),
  description: text('description'),
  website: varchar('website', { length: 255 }),
  countryCode: varchar('country_code', { length: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*                            Skills (catalog + M2M)                          */
/* -------------------------------------------------------------------------- */

export const skills = pgTable('skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 80 }).notNull().unique(),
  slug: varchar('slug', { length: 80 }).notNull().unique(),
});

export const freelancerSkills = pgTable(
  'freelancer_skills',
  {
    freelancerProfileId: uuid('freelancer_profile_id')
      .notNull()
      .references(() => freelancerProfiles.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.freelancerProfileId, t.skillId] })],
);

/* -------------------------------------------------------------------------- */
/*                                    Jobs                                     */
/* -------------------------------------------------------------------------- */

export const JOB_STATUSES = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];
export const jobStatusEnum = pgEnum('job_status', JOB_STATUSES);

export const BUDGET_TYPES = ['FIXED', 'HOURLY'] as const;
export type BudgetType = (typeof BUDGET_TYPES)[number];
export const budgetTypeEnum = pgEnum('budget_type', BUDGET_TYPES);

export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 150 }).notNull(),
  description: text('description').notNull(),
  budgetType: budgetTypeEnum('budget_type').notNull(),
  /** Pentru FIXED: suma totală în cenți. */
  budgetCents: integer('budget_cents'),
  /** Pentru HOURLY: intervalul de tarif orar în cenți. */
  minRateCents: integer('min_rate_cents'),
  maxRateCents: integer('max_rate_cents'),
  status: jobStatusEnum('status').notNull().default('OPEN'),
  acceptedApplicationId: uuid('accepted_application_id'),
  /** Setat când freelancerul angajat marchează livrarea. */
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  /** Setat când clientul confirmă finalizarea. */
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const jobSkills = pgTable(
  'job_skills',
  {
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.jobId, t.skillId] })],
);

/* -------------------------------------------------------------------------- */
/*                                Applications                                 */
/* -------------------------------------------------------------------------- */

export const APPLICATION_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export const applicationStatusEnum = pgEnum('application_status', APPLICATION_STATUSES);

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    freelancerId: uuid('freelancer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    coverLetter: text('cover_letter'),
    proposedRateCents: integer('proposed_rate_cents'),
    status: applicationStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('applications_job_freelancer_unique').on(t.jobId, t.freelancerId)],
);

/* -------------------------------------------------------------------------- */
/*                             Conversations & chat                           */
/* -------------------------------------------------------------------------- */

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    freelancerId: uuid('freelancer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('conversations_job_unique').on(t.jobId)],
);

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*                                  Reviews                                    */
/* -------------------------------------------------------------------------- */

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    reviewerId: uuid('reviewer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    revieweeId: uuid('reviewee_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('reviews_job_reviewer_unique').on(t.jobId, t.reviewerId)],
);

/* -------------------------------------------------------------------------- */
/*                               Notifications                                 */
/* -------------------------------------------------------------------------- */

export const NOTIFICATION_TYPES = [
  'MESSAGE',
  'HIRED',
  'REVIEW',
  'APPLICATION',
  'DELIVERED',
  'COMPLETED',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export const notificationTypeEnum = pgEnum('notification_type', NOTIFICATION_TYPES);

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body'),
  /** Path în frontend (ex. /jobs/:id, /messages/:id). */
  link: varchar('link', { length: 300 }),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*                                    SEO                                      */
/* -------------------------------------------------------------------------- */

/**
 * Meta SEO per rută de frontend. Rândul cu `path = '*'` ține valorile implicite
 * globale (titlu template, descriere default, imagine OG default).
 */
export const seoPages = pgTable('seo_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  path: varchar('path', { length: 200 }).notNull().unique(),
  title: varchar('title', { length: 200 }),
  description: varchar('description', { length: 500 }),
  keywords: varchar('keywords', { length: 500 }),
  ogImageUrl: varchar('og_image_url', { length: 500 }),
  /** Doar pe rândul '*': șablon titlu, ex. "%s · aplica". */
  titleTemplate: varchar('title_template', { length: 120 }),
  noindex: boolean('noindex').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*                          Pagini legale (editabile)                         */
/* -------------------------------------------------------------------------- */

export const legalPages = pgTable('legal_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 60 }).notNull().unique(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*                                 Relations                                   */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ one, many }) => ({
  freelancerProfile: one(freelancerProfiles, {
    fields: [users.id],
    references: [freelancerProfiles.userId],
  }),
  clientProfile: one(clientProfiles, {
    fields: [users.id],
    references: [clientProfiles.userId],
  }),
  jobs: many(jobs),
  applications: many(applications),
  reviewsGiven: many(reviews, { relationName: 'reviewer' }),
  reviewsReceived: many(reviews, { relationName: 'reviewee' }),
}));

export const freelancerProfilesRelations = relations(freelancerProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [freelancerProfiles.userId],
    references: [users.id],
  }),
  skills: many(freelancerSkills),
}));

export const clientProfilesRelations = relations(clientProfiles, ({ one }) => ({
  user: one(users, {
    fields: [clientProfiles.userId],
    references: [users.id],
  }),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  freelancers: many(freelancerSkills),
  jobs: many(jobSkills),
}));

export const freelancerSkillsRelations = relations(freelancerSkills, ({ one }) => ({
  freelancerProfile: one(freelancerProfiles, {
    fields: [freelancerSkills.freelancerProfileId],
    references: [freelancerProfiles.id],
  }),
  skill: one(skills, {
    fields: [freelancerSkills.skillId],
    references: [skills.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  client: one(users, {
    fields: [jobs.clientId],
    references: [users.id],
  }),
  skills: many(jobSkills),
  applications: many(applications),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  job: one(jobs, {
    fields: [reviews.jobId],
    references: [jobs.id],
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: 'reviewer',
  }),
  reviewee: one(users, {
    fields: [reviews.revieweeId],
    references: [users.id],
    relationName: 'reviewee',
  }),
}));

export const jobSkillsRelations = relations(jobSkills, ({ one }) => ({
  job: one(jobs, {
    fields: [jobSkills.jobId],
    references: [jobs.id],
  }),
  skill: one(skills, {
    fields: [jobSkills.skillId],
    references: [skills.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  freelancer: one(users, {
    fields: [applications.freelancerId],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  job: one(jobs, {
    fields: [conversations.jobId],
    references: [jobs.id],
  }),
  client: one(users, {
    fields: [conversations.clientId],
    references: [users.id],
  }),
  freelancer: one(users, {
    fields: [conversations.freelancerId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

/* -------------------------------------------------------------------------- */
/*                                   Types                                     */
/* -------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type FreelancerProfile = typeof freelancerProfiles.$inferSelect;
export type ClientProfile = typeof clientProfiles.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type SeoPage = typeof seoPages.$inferSelect;
export type LegalPage = typeof legalPages.$inferSelect;
