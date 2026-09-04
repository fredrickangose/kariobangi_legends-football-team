"use server";

import { db } from "@/db";
import {
  players,
  fixtures,
  news,
  merchandise,
  donations,
  fanMessages,
  gallery,
  management,
} from "@/db/schema";
import { seedDatabaseIfNeeded } from "@/db/seed";
import { desc, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import crypto from "crypto";

function verifyAdminToken(token: string | undefined) {
  if (!token) return false;

  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    console.error("ADMIN_SESSION_SECRET is not configured.");
    return false;
  }

  const separatorIndex = token.lastIndexOf(".");

  if (separatorIndex === -1) {
    return false;
  }

  const payload = token.slice(0, separatorIndex);
  const providedSignature = token.slice(separatorIndex + 1);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(providedSignature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
  } catch {
    return false;
  }
}

export async function getClubData() {
  // Ensure the database has seed data on first load
  await seedDatabaseIfNeeded();

  try {
    const allPlayers = await db.select().from(players).orderBy(asc(players.jerseyNumber));
    const allFixtures = await db.select().from(fixtures).orderBy(asc(fixtures.date));
    const allNews = await db.select().from(news).orderBy(desc(news.createdAt));
    const allMerchandise = await db.select().from(merchandise).orderBy(asc(merchandise.price));
    const allDonations = await db.select().from(donations).orderBy(desc(donations.createdAt));
    const allFanMessages = await db.select().from(fanMessages).orderBy(desc(fanMessages.createdAt));
    const allGallery = await db.select().from(gallery).orderBy(desc(gallery.createdAt));

    const allManagement = await db
  .select()
  .from(management)
  .orderBy(asc(management.displayOrder), asc(management.id));

    return {
      players: allPlayers,
      fixtures: allFixtures,
      news: allNews,
      merchandise: allMerchandise,
      donations: allDonations,
      fanMessages: allFanMessages,
      gallery: allGallery,
      management: allManagement,
      success: true,
    };
  } catch (error) {
    console.error("Failed to fetch club data:", error);
    return {
      players: [],
      fixtures: [],
      news: [],
      merchandise: [],
      donations: [],
      fanMessages: [],
      gallery: [],
      management: [],
      success: false,
      error: String(error),
    };
  }
}

// ========== DONATIONS & FAN MESSAGES ==========

export async function submitDonation(data: {
  donorName: string;
  amount: number;
  message: string;
  purpose: string;
}) {
  try {
    if (!data.donorName || !data.amount || !data.purpose) {
      throw new Error("Missing required fields for donation.");
    }

    await db.insert(donations).values({
      donorName: data.donorName,
      amount: Number(data.amount),
      message: data.message || "",
      purpose: data.purpose,
      createdAt: new Date(),
    });

    revalidatePath("/");
    return { success: true, message: "Thank you so much! Your donation has been recorded." };
  } catch (error) {
    console.error("Donation submit failed:", error);
    return { success: false, error: String(error) };
  }
}

export async function submitFanMessage(data: {
  name: string;
  message: string;
}) {
  try {
    if (!data.name || !data.message) {
      throw new Error("Name and message are required.");
    }

    await db.insert(fanMessages).values({
      name: data.name,
      message: data.message,
      createdAt: new Date(),
    });

    revalidatePath("/");
    return { success: true, message: "Your message was posted on the Fan Support Board!" };
  } catch (error) {
    console.error("Fan message submit failed:", error);
    return { success: false, error: String(error) };
  }
}

// ========== PLAYERS ==========

export async function addPlayer(data: {
  name: string;
  position: string;
  jerseyNumber: number;
  bio: string;
  appearances: number;
  goals: number;
  assists: number;
  imageUrl?: string;
}) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}
    await db.insert(players).values({
      name: data.name,
      position: data.position,
      jerseyNumber: Number(data.jerseyNumber),
      imageUrl: data.imageUrl || "/images/squad-training.jpg",
      bio: data.bio || "Kariobangi Legends player.",
      appearances: Number(data.appearances || 0),
      goals: Number(data.goals || 0),
      assists: Number(data.assists || 0),
    });

    revalidatePath("/");
    return {
      success: true,
      message: "Player added successfully!",
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

export async function updatePlayerImage(
  playerId: number,
  imageUrl: string
) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}

    await db
      .update(players)
      .set({ imageUrl })
      .where(eq(players.id, playerId));

    revalidatePath("/");

    return {
      success: true,
      message: "Player photo replaced successfully!",
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

export async function deletePlayer(playerId: number) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}

    await db
      .delete(players)
      .where(eq(players.id, playerId));

    revalidatePath("/");

    return {
      success: true,
      message: "Player removed from squad.",
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

// ========== FIXTURES ==========

export async function addFixture(data: {
  opponent: string;
  date: string;
  isHome: boolean;
  status: string;
  venue: string;
  homeScore?: number;
  awayScore?: number;
}) {
  try {
    await db.insert(fixtures).values({
      opponent: data.opponent,
      date: data.date,
      isHome: data.isHome,
      status: data.status,
      venue: data.venue,
      homeScore: data.homeScore !== undefined ? Number(data.homeScore) : null,
      awayScore: data.awayScore !== undefined ? Number(data.awayScore) : null,
    });

    revalidatePath("/");
    return { success: true, message: "Fixture added successfully!" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteFixture(fixtureId: number) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}

    await db
      .delete(fixtures)
      .where(eq(fixtures.id, fixtureId));

    revalidatePath("/");

    return {
      success: true,
      message: "Fixture removed.",
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

// ========== NEWS ==========

export async function addNews(data: {
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
}) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}

    await db.insert(news).values({
      title: data.title,
      summary: data.summary,
      content: data.content,
      imageUrl: data.imageUrl || "/images/coaches-discussion.jpg",
      createdAt: new Date(),
    });

    revalidatePath("/");

    return {
      success: true,
      message: "News article published successfully!",
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

export async function updateNewsImage(
  newsId: number,
  imageUrl: string
) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}

    await db
      .update(news)
      .set({ imageUrl })
      .where(eq(news.id, newsId));

    revalidatePath("/");

    return {
      success: true,
      message: "News article photo replaced successfully!",
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

export async function deleteNews(newsId: number) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}

    await db
      .delete(news)
      .where(eq(news.id, newsId));

    revalidatePath("/");

    return {
      success: true,
      message: "News article removed.",
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

// ========== GALLERY ==========

export async function addGalleryImage(data: {
  imageUrl: string;
  caption: string;
  category: string;
}) {
  try {const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}

    if (!data.imageUrl || !data.caption) {
      throw new Error("Image URL and caption are required.");
    }

    await db.insert(gallery).values({
      imageUrl: data.imageUrl,
      caption: data.caption,
      category: data.category || "Training",
      createdAt: new Date(),
    });

    revalidatePath("/");

    return {
      success: true,
      message: "New photo published to the media gallery!",
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}
export async function updateGalleryImage(
  galleryId: number,
  imageUrl: string,
  caption: string
) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}

    await db
      .update(gallery)
      .set({
        imageUrl,
        caption,
      })
      .where(eq(gallery.id, galleryId));

    revalidatePath("/");

    return {
      success: true,
      message: "Gallery photo updated successfully!",
    };
  } catch (error) {
    console.error("Update gallery photo failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}

export async function deleteGalleryImage(galleryId: number) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}

    await db
      .delete(gallery)
      .where(eq(gallery.id, galleryId));

    revalidatePath("/");

    return {
      success: true,
      message: "Photo removed from gallery.",
    };
  } catch (error) {
    console.error("Delete gallery photo failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}

// ========== MERCHANDISE ==========

export async function addMerchandise(data: {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  sizes: string;
  kitType: string;
}) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}
    if (!data.name || !data.price) {
      throw new Error("Name and price are required.");
    }

    await db.insert(merchandise).values({
      name: data.name,
      description:
        data.description || "Official Kariobangi Legends merchandise.",
      price: Number(data.price),
      imageUrl: data.imageUrl || "/images/shop-home-jersey.jpg",
      sizes: data.sizes || "S, M, L, XL",
      kitType: data.kitType || "jersey",
    });

    revalidatePath("/");

    return {
      success: true,
      message: "Merchandise item added to shop!",
    };
  } catch (error) {
    console.error("Add merchandise failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}
export async function updateMerchandiseImage(
  merchId: number,
  imageUrl: string
) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}

    await db
      .update(merchandise)
      .set({ imageUrl })
      .where(eq(merchandise.id, merchId));

    revalidatePath("/");

    return {
      success: true,
      message: "Product photo replaced successfully!",
    };
  } catch (error) {
    console.error("Update merchandise photo failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}

export async function deleteMerchandise(merchId: number) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}

    await db
      .delete(merchandise)
      .where(eq(merchandise.id, merchId));

    revalidatePath("/");

    return {
      success: true,
      message: "Merchandise item removed from shop.",
    };
  } catch (error) {
    console.error("Delete merchandise failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}

export async function addManagement(data: {
  name: string;
  position: string;
  category: string;
  bio?: string;
  responsibilities?: string;
  imageUrl?: string;
  displayOrder?: number;
}) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}

    await db.insert(management).values({
      name: data.name,
      position: data.position,
      category: data.category,
      bio: data.bio || "",
      responsibilities: data.responsibilities || "",
      imageUrl: data.imageUrl || "/images/management-placeholder.jpg",
      displayOrder: Number(data.displayOrder || 0),
    });

    revalidatePath("/");

    return {
      success: true,
      message: "Management official added successfully!",
    };
  } catch (error) {
    console.error("Add management official failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}
export async function updateManagement(
  managementId: number,
  data: {
    name: string;
    position: string;
    category: string;
    bio?: string;
    responsibilities?: string;
    imageUrl?: string;
    displayOrder?: number;
  }
) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}

    await db
      .update(management)
      .set({
        name: data.name,
        position: data.position,
        category: data.category,
        bio: data.bio || "",
        responsibilities: data.responsibilities || "",
        imageUrl: data.imageUrl || "/images/management-placeholder.jpg",
        displayOrder: Number(data.displayOrder || 0),
      })
      .where(eq(management.id, managementId));

    revalidatePath("/");

    return {
      success: true,
      message: "Management official updated successfully!",
    };
  } catch (error) {
    console.error("Update management official failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}
export async function deleteManagement(managementId: number) {
  try {
    const cookieStore = await cookies();
const adminCookie = cookieStore.get("kariobangi_admin");

if (!verifyAdminToken(adminCookie?.value)) {
  return {
    success: false,
    error: "Unauthorized. Admin authentication required.",
  };
}

    await db
      .delete(management)
      .where(eq(management.id, managementId));

    revalidatePath("/");

    return {
      success: true,
      message: "Management official deleted successfully!",
    };
  } catch (error) {
    console.error("Delete management official failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}