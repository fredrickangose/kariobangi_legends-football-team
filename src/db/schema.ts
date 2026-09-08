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
  opponentLogoUrl: text("opponent_logo_url"),
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

export const management = pgTable("management", {
  id: serial("id").primaryKey(),

  name: text("name").notNull(),

  position: text("position").notNull(),

  category: text("category").notNull(),

  bio: text("bio").default(""),

  responsibilities: text("responsibilities").default(""),

  imageUrl: text("image_url").default("/images/management-placeholder.jpg"),

  displayOrder: integer("display_order").default(0).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  email: text("email"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const passwordResetCodes = pgTable("password_reset_codes", {
  id: serial("id").primaryKey(),
  accountType: text("account_type").notNull(),
  phoneNumber: text("phone_number").notNull(),
  customerId: integer("customer_id"),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"),
  customerName: text("customer_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  totalAmount: integer("total_amount").notNull(),

  paymentMethod: text("payment_method")
    .default("mpesa")
    .notNull(),

  paymentStatus: text("payment_status")
    .default("pending")
    .notNull(),

  orderStatus: text("order_status")
    .default("processing")
    .notNull(),

  merchantRequestId: text("merchant_request_id"),
  checkoutRequestId: text("checkout_request_id"),
  mpesaReceiptNumber: text("mpesa_receipt_number"),
  transactionDate: text("transaction_date"),

  deliveryAddress: text("delivery_address"),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),

  orderId: integer("order_id").notNull(),

  merchandiseId: integer("merchandise_id").notNull(),

  productName: text("product_name").notNull(),
  size: text("size").notNull(),

  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accountMessages = pgTable("account_messages", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  senderType: text("sender_type").notNull(), // customer | admin
  message: text("message").notNull(),
  isReadByCustomer: boolean("is_read_by_customer").default(false).notNull(),
  isReadByAdmin: boolean("is_read_by_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});