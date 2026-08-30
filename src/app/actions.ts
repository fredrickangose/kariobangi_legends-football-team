"use server";

import { db } from "@/db";
import { players, fixtures, news, merchandise, donations, fanMessages, gallery } from "@/db/schema";
import { seedDatabaseIfNeeded } from "@/db/seed";
import { desc, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

    return {
      players: allPlayers,
      fixtures: allFixtures,
      news: allNews,
      merchandise: allMerchandise,
      donations: allDonations,
      fanMessages: allFanMessages,
      gallery: allGallery,
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
    return { success: true, message: "Player added successfully!" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updatePlayerImage(playerId: number, imageUrl: string) {
  try {
    await db.update(players).set({ imageUrl }).where(eq(players.id, playerId));
    revalidatePath("/");
    return { success: true, message: "Player photo replaced successfully!" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deletePlayer(playerId: number) {
  try {
    await db.delete(players).where(eq(players.id, playerId));
    revalidatePath("/");
    return { success: true, message: "Player removed from squad." };
  } catch (error) {
    return { success: false, error: String(error) };
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
    await db.delete(fixtures).where(eq(fixtures.id, fixtureId));
    revalidatePath("/");
    return { success: true, message: "Fixture removed." };
  } catch (error) {
    return { success: false, error: String(error) };
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
    await db.insert(news).values({
      title: data.title,
      summary: data.summary,
      content: data.content,
      imageUrl: data.imageUrl || "/images/coaches-discussion.jpg",
      createdAt: new Date(),
    });

    revalidatePath("/");
    return { success: true, message: "News article published successfully!" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateNewsImage(newsId: number, imageUrl: string) {
  try {
    await db.update(news).set({ imageUrl }).where(eq(news.id, newsId));
    revalidatePath("/");
    return { success: true, message: "News article photo replaced successfully!" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteNews(newsId: number) {
  try {
    await db.delete(news).where(eq(news.id, newsId));
    revalidatePath("/");
    return { success: true, message: "News article removed." };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ========== GALLERY ==========

export async function addGalleryImage(data: {
  imageUrl: string;
  caption: string;
  category: string;
}) {
  try {
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
    return { success: true, message: "New photo published to the media gallery!" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateGalleryImage(galleryId: number, imageUrl: string, caption: string) {
  try {
    await db.update(gallery).set({ imageUrl, caption }).where(eq(gallery.id, galleryId));
    revalidatePath("/");
    return { success: true, message: "Gallery photo updated successfully!" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteGalleryImage(galleryId: number) {
  try {
    await db.delete(gallery).where(eq(gallery.id, galleryId));
    revalidatePath("/");
    return { success: true, message: "Photo removed from gallery." };
  } catch (error) {
    return { success: false, error: String(error) };
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
    if (!data.name || !data.price) {
      throw new Error("Name and price are required.");
    }
    await db.insert(merchandise).values({
      name: data.name,
      description: data.description || "Official Kariobangi Legends merchandise.",
      price: Number(data.price),
      imageUrl: data.imageUrl || "/images/shop-home-jersey.jpg",
      sizes: data.sizes || "S, M, L, XL",
      kitType: data.kitType || "jersey",
    });

    revalidatePath("/");
    return { success: true, message: "Merchandise item added to shop!" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateMerchandiseImage(merchId: number, imageUrl: string) {
  try {
    await db.update(merchandise).set({ imageUrl }).where(eq(merchandise.id, merchId));
    revalidatePath("/");
    return { success: true, message: "Product photo replaced successfully!" };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deleteMerchandise(merchId: number) {
  try {
    await db.delete(merchandise).where(eq(merchandise.id, merchId));
    revalidatePath("/");
    return { success: true, message: "Merchandise item removed from shop." };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
