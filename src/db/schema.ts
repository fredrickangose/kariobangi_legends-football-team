import { pgTable, serial, text, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position").notNull(), // 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'
  jerseyNumber: integer("jersey_number").notNull(),
  imageUrl: text("image_url").notNull(),
  bio: text("bio").notNull(),
  appearances: integer("appearances").default(0).notNull(),
  goals: integer("goals").default(0).notNull(),
  assists: integer("assists").default(0).notNull(),
});

export const fixtures = pgTable("fixtures", {
  id: serial("id").primaryKey(),
  opponent: text("opponent").notNull(),
  date: text("date").notNull(), // ISO Date string or human-readable format
  isHome: boolean("is_home").default(true).notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: text("status").default("upcoming").notNull(), // 'upcoming', 'completed', 'live'
  venue: text("venue").notNull(),
});

export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const merchandise = pgTable("merchandise", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // price in Kenya Shillings (Ksh)
  imageUrl: text("image_url").notNull(),
  sizes: text("sizes").notNull(), // e.g., 'S, M, L, XL'
  kitType: text("kit_type").notNull(), // 'home' (black), 'away-green', 'away-white', 'accessory'
});

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  donorName: text("donor_name").notNull(),
  amount: integer("amount").notNull(), // amount in Ksh
  message: text("message"),
  purpose: text("purpose").notNull(), // 'Boots & Equipment', 'Academy Support', 'Transport & Meals', 'General Club Fund'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fanMessages = pgTable("fan_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption").notNull(),
  category: text("category").default("Training").notNull(), // 'Match', 'Training', 'Community', 'Academy'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
