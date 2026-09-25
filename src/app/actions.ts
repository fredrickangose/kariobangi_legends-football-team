"use server";

import { db, ensureDatabaseSchema } from "@/db";
import {
  players,
  fixtures,
  news,
  merchandise,
  donations,
  fanMessages,
  gallery,
  teamHighlights,
  management,
  orders,
  orderItems,
  customers,
  memberships,
} from "@/db/schema";
import { seedDatabaseIfNeeded } from "@/db/seed";
import { desc, asc, eq, or, and, inArray, isNull, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import crypto from "crypto";
import { normalizeKenyaPhone, isValidKenyaPhone } from "@/lib/order-tracking";
import { notifyBuyerOrderUpdate } from "@/lib/notifications";
import { findActivePaidMembership } from "@/lib/membership-server";
import {
  getAdminMembershipStatus,
  getMembershipPlan,
} from "@/lib/membership";
import { getNotificationConfigSummary } from "@/lib/notifications/config";
import {
  hashPassword,
  normalizeCustomerPhone,
  verifyCustomerToken,
} from "@/lib/customer-auth";
import { getPhoneLookupVariants } from "@/lib/link-customer-orders";
import { deleteUploadedMedia, deleteUploadedMediaBatch } from "@/lib/storage";
import {
  ensurePressAccount,
  parseAdminSession,
  verifyFullAdminToken,
  verifyNewsEditorToken,
} from "@/lib/admin-auth";
import { normalizeMerchandiseCategory } from "@/lib/merchandise-categories";
import { normalizeMerchandiseStockStatus } from "@/lib/merchandise-stock";
import { merchandiseNeedsCopyUpgrade, getImprovedMerchandiseCopy } from "@/lib/merchandise-copy";

async function requireFullAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("kariobangi_admin")?.value;

  if (!verifyFullAdminToken(token)) {
    return {
      ok: false as const,
      error: "Unauthorized. Admin authentication required.",
    };
  }

  return { ok: true as const, role: parseAdminSession(token)! };
}

async function requireNewsEditor() {
  const cookieStore = await cookies();
  const token = cookieStore.get("kariobangi_admin")?.value;

  if (!verifyNewsEditorToken(token)) {
    return {
      ok: false as const,
      error: "Unauthorized. Press account required.",
    };
  }

  return { ok: true as const, role: parseAdminSession(token)! };
}

export async function getClubData() {
  await ensureDatabaseSchema();
  await ensurePressAccount();
  // Ensure the database has seed data on first load
  await seedDatabaseIfNeeded();

  try {
    const allPlayers = await db.select().from(players).orderBy(asc(players.jerseyNumber));
    const allFixtures = await db.select().from(fixtures).orderBy(asc(fixtures.date));
    const allNews = await db.select().from(news).orderBy(desc(news.createdAt));
    let allMerchandise = await db.select().from(merchandise).orderBy(asc(merchandise.price));
    const merchNeedingCopy = allMerchandise.filter((item) => merchandiseNeedsCopyUpgrade(item));
    if (merchNeedingCopy.length > 0) {
      await Promise.all(
        merchNeedingCopy.map((item) => {
          const copy = getImprovedMerchandiseCopy(item);
          return db
            .update(merchandise)
            .set({ name: copy.name, description: copy.description })
            .where(eq(merchandise.id, item.id));
        })
      );
      allMerchandise = await db.select().from(merchandise).orderBy(asc(merchandise.price));
    }
    const allDonations = await db.select().from(donations).orderBy(desc(donations.createdAt));
    const allFanMessages = await db.select().from(fanMessages).orderBy(desc(fanMessages.createdAt));
    const allGallery = await db.select().from(gallery).orderBy(desc(gallery.createdAt));
    const allHighlights = await db
      .select()
      .from(teamHighlights)
      .orderBy(desc(teamHighlights.createdAt));

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
      highlights: allHighlights,
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
      highlights: [],
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
  currency?: string;
  message: string;
  purpose: string;
}) {
  try {
    if (!data.donorName || !data.amount || !data.purpose) {
      throw new Error("Missing required fields for donation.");
    }

    const currency = data.currency?.trim().toUpperCase() || "KES";
    const allowedCurrencies = new Set(["KES", "USD", "GBP", "EUR"]);
    if (!allowedCurrencies.has(currency)) {
      throw new Error("Unsupported donation currency.");
    }

    await db.insert(donations).values({
      donorName: data.donorName,
      amount: Math.round(Number(data.amount)),
      currency,
      message: data.message || "",
      purpose: data.purpose,
      paymentStatus: currency === "KES" ? "pledge" : "pledge",
      paymentMethod: currency === "KES" ? "mpesa" : "international",
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
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }
    const [player] = await db.insert(players).values({
      name: data.name,
      position: data.position,
      jerseyNumber: Number(data.jerseyNumber),
      imageUrl: data.imageUrl || "",
      bio: data.bio || "Kariobangi Legends player.",
      appearances: Number(data.appearances || 0),
      goals: Number(data.goals || 0),
      assists: Number(data.assists || 0),
    }).returning();

    return {
      success: true,
      message: "Player added successfully!",
      player,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

export async function updatePlayerJerseyNumber(
  playerId: number,
  jerseyNumber: number
) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const parsed = Number(jerseyNumber);
    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 99) {
      return {
        success: false,
        error: "Jersey number must be between 1 and 99.",
      };
    }

    const [player] = await db
      .update(players)
      .set({ jerseyNumber: parsed })
      .where(eq(players.id, playerId))
      .returning();

    if (!player) {
      return { success: false, error: "Player not found." };
    }

    return {
      success: true,
      message: "Player jersey number updated.",
      player,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

export async function updatePlayer(
  playerId: number,
  data: {
    name: string;
    position: string;
    jerseyNumber: number;
    bio?: string;
    appearances?: number;
    goals?: number;
    assists?: number;
    imageUrl?: string;
  }
) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const name = data.name.trim();
    if (!name) {
      return { success: false, error: "Player name is required." };
    }

    const position = data.position.trim();
    if (!position) {
      return { success: false, error: "Position is required." };
    }

    const parsedJersey = Number(data.jerseyNumber);
    if (!Number.isInteger(parsedJersey) || parsedJersey <= 0 || parsedJersey > 99) {
      return {
        success: false,
        error: "Jersey number must be between 1 and 99.",
      };
    }

    let previousImageUrl: string | null = null;
    if (data.imageUrl !== undefined) {
      const [existing] = await db
        .select({ imageUrl: players.imageUrl })
        .from(players)
        .where(eq(players.id, playerId))
        .limit(1);
      previousImageUrl = existing?.imageUrl ?? null;
    }

    const [player] = await db
      .update(players)
      .set({
        name,
        position,
        jerseyNumber: parsedJersey,
        bio: data.bio || "",
        appearances: Number(data.appearances || 0),
        goals: Number(data.goals || 0),
        assists: Number(data.assists || 0),
        ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      })
      .where(eq(players.id, playerId))
      .returning();

    if (!player) {
      return { success: false, error: "Player not found." };
    }

    if (previousImageUrl && previousImageUrl !== data.imageUrl) {
      await deleteUploadedMedia(previousImageUrl);
    }

    return {
      success: true,
      message: "Player updated successfully.",
      player,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

export async function updatePlayerName(playerId: number, name: string) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: "Player name is required." };
    }

    const [player] = await db
      .update(players)
      .set({ name: trimmed })
      .where(eq(players.id, playerId))
      .returning();

    if (!player) {
      return { success: false, error: "Player not found." };
    }

    return {
      success: true,
      message: "Player name updated.",
      player,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

export async function updateManagementName(managementId: number, name: string) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: "Official name is required." };
    }

    const [member] = await db
      .update(management)
      .set({ name: trimmed })
      .where(eq(management.id, managementId))
      .returning();

    if (!member) {
      return { success: false, error: "Management official not found." };
    }

    return {
      success: true,
      message: "Management name updated.",
      member,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

export async function updatePlayerPosition(
  playerId: number,
  position: string
) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const trimmed = position.trim();
    if (!trimmed) {
      return { success: false, error: "Position is required." };
    }

    const [player] = await db
      .update(players)
      .set({ position: trimmed })
      .where(eq(players.id, playerId))
      .returning();

    if (!player) {
      return { success: false, error: "Player not found." };
    }

    return {
      success: true,
      message: "Player position updated.",
      player,
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
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [existing] = await db
      .select({ imageUrl: players.imageUrl })
      .from(players)
      .where(eq(players.id, playerId))
      .limit(1);

    const [player] = await db
      .update(players)
      .set({ imageUrl })
      .where(eq(players.id, playerId))
      .returning();

    if (!player) {
      return { success: false, error: "Player not found." };
    }

    if (existing?.imageUrl && existing.imageUrl !== imageUrl) {
      await deleteUploadedMedia(existing.imageUrl);
    }

    return {
      success: true,
      message: "Player photo replaced successfully!",
      player,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

export async function updateManagementImage(
  managementId: number,
  imageUrl: string
) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [existing] = await db
      .select({ imageUrl: management.imageUrl })
      .from(management)
      .where(eq(management.id, managementId))
      .limit(1);

    const [member] = await db
      .update(management)
      .set({ imageUrl })
      .where(eq(management.id, managementId))
      .returning();

    if (!member) {
      return { success: false, error: "Management official not found." };
    }

    if (existing?.imageUrl && existing.imageUrl !== imageUrl) {
      await deleteUploadedMedia(existing.imageUrl);
    }

    return {
      success: true,
      message: "Management photo replaced successfully!",
      member,
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
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [deleted] = await db
      .delete(players)
      .where(eq(players.id, playerId))
      .returning({ imageUrl: players.imageUrl });

    if (deleted?.imageUrl) {
      await deleteUploadedMedia(deleted.imageUrl);
    }

    return {
      success: true,
      message: "Player removed from squad.",
      playerId,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}

export async function addFixture(data: {
  opponent: string;
  opponentLogoUrl?: string;
  date: string;
  isHome: boolean;
  status: string;
  venue: string;
  matchType?: string;
  squadTeam?: string;
  homeScore?: number;
  awayScore?: number;
}) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [fixture] = await db.insert(fixtures).values({
      opponent: data.opponent,
      opponentLogoUrl: data.opponentLogoUrl || null,
      date: data.date,
      isHome: data.isHome,
      status: data.status,
      venue: data.venue,
      matchType: data.matchType || "league",
      squadTeam: data.squadTeam || "main",
      homeScore:
        data.homeScore !== undefined ? Number(data.homeScore) : null,
      awayScore:
        data.awayScore !== undefined ? Number(data.awayScore) : null,
    }).returning();

    return {
      success: true,
      message: "Fixture added successfully!",
      fixture,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}
export async function updateFixture(
  fixtureId: number,
  data: {
    opponent: string;
    opponentLogoUrl?: string | null;
    date: string;
    isHome: boolean;
    status: string;
    venue: string;
    matchType?: string;
    squadTeam?: string;
    homeScore?: number;
    awayScore?: number;
  }
) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [existing] = await db
      .select({ opponentLogoUrl: fixtures.opponentLogoUrl })
      .from(fixtures)
      .where(eq(fixtures.id, fixtureId))
      .limit(1);

    const nextLogoUrl =
      data.opponentLogoUrl !== undefined ? data.opponentLogoUrl : null;

    const [fixture] = await db
      .update(fixtures)
      .set({
        opponent: data.opponent,
        opponentLogoUrl: nextLogoUrl,
        date: data.date,
        isHome: data.isHome,
        status: data.status,
        venue: data.venue,
        matchType: data.matchType || "league",
        squadTeam: data.squadTeam || "main",
        homeScore:
          data.homeScore !== undefined ? Number(data.homeScore) : null,
        awayScore:
          data.awayScore !== undefined ? Number(data.awayScore) : null,
      })
      .where(eq(fixtures.id, fixtureId))
      .returning();

    if (!fixture) {
      return { success: false, error: "Fixture not found." };
    }

    if (existing?.opponentLogoUrl && existing.opponentLogoUrl !== nextLogoUrl) {
      await deleteUploadedMedia(existing.opponentLogoUrl);
    }

    return {
      success: true,
      message: "Fixture updated successfully!",
      fixture,
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
    };
  }
}
// ========== DELETE FIXTURE ==========

export async function deleteFixture(fixtureId: number) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [deleted] = await db
      .delete(fixtures)
      .where(eq(fixtures.id, fixtureId))
      .returning({ opponentLogoUrl: fixtures.opponentLogoUrl });

    if (deleted?.opponentLogoUrl) {
      await deleteUploadedMedia(deleted.opponentLogoUrl);
    }

    return {
      success: true,
      message: "Fixture deleted successfully!",
      fixtureId,
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
    const auth = await requireNewsEditor();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [article] = await db.insert(news).values({
      title: data.title,
      summary: data.summary,
      content: data.content,
      imageUrl: data.imageUrl || "/images/coaches-discussion.jpg",
      createdAt: new Date(),
    }).returning();

    return {
      success: true,
      message: "News article published successfully!",
      article,
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
    const auth = await requireNewsEditor();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [existing] = await db
      .select({ imageUrl: news.imageUrl })
      .from(news)
      .where(eq(news.id, newsId))
      .limit(1);

    const [article] = await db
      .update(news)
      .set({ imageUrl })
      .where(eq(news.id, newsId))
      .returning();

    if (!article) {
      return { success: false, error: "News article not found." };
    }

    if (existing?.imageUrl && existing.imageUrl !== imageUrl) {
      await deleteUploadedMedia(existing.imageUrl);
    }

    return {
      success: true,
      message: "News article photo replaced successfully!",
      article,
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
    const auth = await requireNewsEditor();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [deleted] = await db
      .delete(news)
      .where(eq(news.id, newsId))
      .returning({ imageUrl: news.imageUrl });

    if (deleted?.imageUrl) {
      await deleteUploadedMedia(deleted.imageUrl);
    }

    return {
      success: true,
      message: "News article removed.",
      newsId,
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
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    if (!data.imageUrl || !data.caption) {
      throw new Error("Image URL and caption are required.");
    }

    const [item] = await db.insert(gallery).values({
      imageUrl: data.imageUrl,
      caption: data.caption,
      category: data.category || "Training",
      createdAt: new Date(),
    }).returning();

    return {
      success: true,
      message: "New photo published to the media gallery!",
      item,
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
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [existing] = await db
      .select({ imageUrl: gallery.imageUrl })
      .from(gallery)
      .where(eq(gallery.id, galleryId))
      .limit(1);

    const [item] = await db
      .update(gallery)
      .set({
        imageUrl,
        caption,
      })
      .where(eq(gallery.id, galleryId))
      .returning();

    if (!item) {
      return { success: false, error: "Gallery photo not found." };
    }

    if (existing?.imageUrl && existing.imageUrl !== imageUrl) {
      await deleteUploadedMedia(existing.imageUrl);
    }

    return {
      success: true,
      message: "Gallery photo updated successfully!",
      item,
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
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [deleted] = await db
      .delete(gallery)
      .where(eq(gallery.id, galleryId))
      .returning({ imageUrl: gallery.imageUrl });

    if (deleted?.imageUrl) {
      await deleteUploadedMedia(deleted.imageUrl);
    }

    return {
      success: true,
      message: "Photo removed from gallery.",
      galleryId,
    };
  } catch (error) {
    console.error("Delete gallery photo failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}

// ========== TEAM HIGHLIGHTS ==========

export async function addTeamHighlight(data: {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  category?: string;
}) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    if (!data.title?.trim() || !data.videoUrl?.trim()) {
      throw new Error("Title and video are required.");
    }

    const [item] = await db
      .insert(teamHighlights)
      .values({
        title: data.title.trim(),
        description: data.description?.trim() || "",
        videoUrl: data.videoUrl.trim(),
        thumbnailUrl: data.thumbnailUrl?.trim() || null,
        category: data.category?.trim() || "Match Highlights",
        createdAt: new Date(),
      })
      .returning();

    return {
      success: true,
      message: "Team highlight video published successfully!",
      item,
    };
  } catch (error) {
    console.error("Add team highlight failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}

export async function deleteTeamHighlight(highlightId: number) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [deleted] = await db
      .delete(teamHighlights)
      .where(eq(teamHighlights.id, highlightId))
      .returning({
        videoUrl: teamHighlights.videoUrl,
        thumbnailUrl: teamHighlights.thumbnailUrl,
      });

    if (deleted) {
      await deleteUploadedMediaBatch([deleted.videoUrl, deleted.thumbnailUrl]);
    }

    return {
      success: true,
      message: "Highlight video removed.",
      highlightId,
    };
  } catch (error) {
    console.error("Delete team highlight failed:", error);

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
  stockStatus?: string;
}) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }
    if (!data.name || !data.price) {
      throw new Error("Name and price are required.");
    }

    const [item] = await db.insert(merchandise).values({
      name: data.name,
      description:
        data.description || "Official Kariobangi Legends merchandise.",
      price: Number(data.price),
      imageUrl: data.imageUrl || "/images/shop-home-jersey.jpg",
      sizes: data.sizes || "S, M, L, XL",
      kitType: normalizeMerchandiseCategory(data.kitType || "jersey"),
      stockStatus: normalizeMerchandiseStockStatus(data.stockStatus),
    }).returning();

    return {
      success: true,
      message: "Merchandise item added to shop!",
      item,
    };
  } catch (error) {
    console.error("Add merchandise failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}
export async function updateMerchandisePrice(merchId: number, price: number) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const normalizedPrice = Number(price);
    if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      return { success: false, error: "Enter a valid price greater than zero." };
    }

    const [item] = await db
      .update(merchandise)
      .set({ price: Math.round(normalizedPrice) })
      .where(eq(merchandise.id, merchId))
      .returning();

    if (!item) {
      return { success: false, error: "Merchandise item not found." };
    }

    return {
      success: true,
      message: "Product price updated successfully!",
      item,
    };
  } catch (error) {
    console.error("Update merchandise price failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}

export async function updateMerchandiseCategory(merchId: number, kitType: string) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [item] = await db
      .update(merchandise)
      .set({ kitType: normalizeMerchandiseCategory(kitType) })
      .where(eq(merchandise.id, merchId))
      .returning();

    if (!item) {
      return { success: false, error: "Merchandise item not found." };
    }

    return {
      success: true,
      message: "Product moved to the new category successfully!",
      item,
    };
  } catch (error) {
    console.error("Update merchandise category failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}

export async function updateMerchandiseStockStatus(
  merchId: number,
  stockStatus: string
) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [item] = await db
      .update(merchandise)
      .set({ stockStatus: normalizeMerchandiseStockStatus(stockStatus) })
      .where(eq(merchandise.id, merchId))
      .returning();

    if (!item) {
      return { success: false, error: "Merchandise item not found." };
    }

    return {
      success: true,
      message: "Product stock status updated successfully!",
      item,
    };
  } catch (error) {
    console.error("Update merchandise stock status failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}

export async function updateMerchandiseDetails(
  merchId: number,
  data: {
    name: string;
    description: string;
  }
) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const name = data.name.trim();
    const description = data.description.trim();
    if (!name) {
      return { success: false, error: "Product name is required." };
    }

    const [item] = await db
      .update(merchandise)
      .set({
        name,
        description: description || "Official Kariobangi Legends replica. 100% of profit supports the squad.",
      })
      .where(eq(merchandise.id, merchId))
      .returning();

    if (!item) {
      return { success: false, error: "Merchandise item not found." };
    }

    return {
      success: true,
      message: "Product details updated.",
      item,
    };
  } catch (error) {
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
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [existing] = await db
      .select({ imageUrl: merchandise.imageUrl })
      .from(merchandise)
      .where(eq(merchandise.id, merchId))
      .limit(1);

    const [item] = await db
      .update(merchandise)
      .set({ imageUrl })
      .where(eq(merchandise.id, merchId))
      .returning();

    if (!item) {
      return { success: false, error: "Merchandise item not found." };
    }

    if (existing?.imageUrl && existing.imageUrl !== imageUrl) {
      await deleteUploadedMedia(existing.imageUrl);
    }

    return {
      success: true,
      message: "Product photo replaced successfully!",
      item,
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
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [deleted] = await db
      .delete(merchandise)
      .where(eq(merchandise.id, merchId))
      .returning({ imageUrl: merchandise.imageUrl });

    if (deleted?.imageUrl) {
      await deleteUploadedMedia(deleted.imageUrl);
    }

    return {
      success: true,
      message: "Merchandise item removed from shop.",
      merchId,
    };
  } catch (error) {
    console.error("Delete merchandise failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}

export async function clearAllMerchandise() {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const existing = await db
      .select({ id: merchandise.id, imageUrl: merchandise.imageUrl })
      .from(merchandise);
    await db.delete(merchandise);

    await deleteUploadedMediaBatch(existing.map((item) => item.imageUrl));

    return {
      success: true,
      message: `Cleared ${existing.length} item(s) from the fan shop. You can now upload fresh merchandise.`,
      removedCount: existing.length,
    };
  } catch (error) {
    console.error("Clear all merchandise failed:", error);

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
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [member] = await db.insert(management).values({
      name: data.name,
      position: data.position,
      category: data.category,
      bio: data.bio || "",
      responsibilities: data.responsibilities || "",
      imageUrl: data.imageUrl || "",
      displayOrder: Number(data.displayOrder || 0),
    }).returning();

    return {
      success: true,
      message: "Management official added successfully!",
      member,
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
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [existing] = await db
      .select({ imageUrl: management.imageUrl })
      .from(management)
      .where(eq(management.id, managementId))
      .limit(1);

    const [member] = await db
      .update(management)
      .set({
        name: data.name,
        position: data.position,
        category: data.category,
        bio: data.bio || "",
        responsibilities: data.responsibilities || "",
        imageUrl: data.imageUrl || "",
        displayOrder: Number(data.displayOrder || 0),
      })
      .where(eq(management.id, managementId))
      .returning();

    if (!member) {
      return { success: false, error: "Management official not found." };
    }

    if (existing?.imageUrl && existing.imageUrl !== (data.imageUrl || "")) {
      await deleteUploadedMedia(existing.imageUrl);
    }

    return {
      success: true,
      message: "Management official updated successfully!",
      member,
    };
  } catch (error) {
    console.error("Update management official failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}

export async function updateManagementRole(
  managementId: number,
  data: {
    category: string;
    position: string;
  }
) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const category = data.category.trim();
    const position = data.position.trim();

    if (!category || !position) {
      return { success: false, error: "Category and position are required." };
    }

    const [member] = await db
      .update(management)
      .set({ category, position })
      .where(eq(management.id, managementId))
      .returning();

    if (!member) {
      return { success: false, error: "Management official not found." };
    }

    return {
      success: true,
      message: "Management role updated.",
      member,
    };
  } catch (error) {
    console.error("Update management role failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}

export async function deleteManagement(managementId: number) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const [deleted] = await db
      .delete(management)
      .where(eq(management.id, managementId))
      .returning({ imageUrl: management.imageUrl });

    if (deleted?.imageUrl) {
      await deleteUploadedMedia(deleted.imageUrl);
    }

    return {
      success: true,
      message: "Management official deleted successfully!",
      managementId,
    };
  } catch (error) {
    console.error("Delete management official failed:", error);

    return {
      success: false,
      error: String(error),
    };
  }
}

// ========== ORDERS ==========

async function attachOrderItems<T extends { id: number }>(orderList: T[]) {
  return Promise.all(
    orderList.map(async (order) => {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));

      return {
        ...order,
        items,
      };
    })
  );
}

export async function getOrders() {
  try {
    await ensureDatabaseSchema();

    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return {
        success: false,
        error: auth.error,
        orders: [],
        archivedOrders: [],
        unseenCount: 0,
      };
    }

    const [activeOrderList, archivedOrderList, unseenRows] = await Promise.all([
      db
        .select()
        .from(orders)
        .where(isNull(orders.archivedAt))
        .orderBy(desc(orders.createdAt)),
      db
        .select()
        .from(orders)
        .where(isNotNull(orders.archivedAt))
        .orderBy(desc(orders.createdAt)),
      db
        .select({ id: orders.id })
        .from(orders)
        .where(and(isNull(orders.archivedAt), isNull(orders.adminSeenAt))),
    ]);

    const [ordersWithItems, archivedOrdersWithItems] = await Promise.all([
      attachOrderItems(activeOrderList),
      attachOrderItems(archivedOrderList),
    ]);

    return {
      success: true,
      orders: ordersWithItems,
      archivedOrders: archivedOrdersWithItems,
      unseenCount: unseenRows.length,
    };
  } catch (error) {
    console.error("Get orders failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to retrieve orders.",
      orders: [],
      archivedOrders: [],
      unseenCount: 0,
    };
  }
}

export async function markAdminOrdersSeen() {
  try {
    await ensureDatabaseSchema();

    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    await db
      .update(orders)
      .set({ adminSeenAt: new Date() })
      .where(and(isNull(orders.archivedAt), isNull(orders.adminSeenAt)));

    return { success: true };
  } catch (error) {
    console.error("Mark admin orders seen failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to mark orders as read.",
    };
  }
}

export async function archiveOrder(orderId: number) {
  try {
    await ensureDatabaseSchema();

    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return {
        success: false,
        error: "Invalid order ID.",
      };
    }

    const archivedOrder = await db
      .update(orders)
      .set({
        archivedAt: new Date(),
        adminSeenAt: new Date(),
      })
      .where(and(eq(orders.id, orderId), isNull(orders.archivedAt)))
      .returning();

    if (archivedOrder.length === 0) {
      return {
        success: false,
        error: "Order not found or already archived.",
      };
    }

    revalidatePath("/");

    return {
      success: true,
      order: archivedOrder[0],
    };
  } catch (error) {
    console.error("Archive order failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unable to archive order.",
    };
  }
}

export async function restoreOrder(orderId: number) {
  try {
    await ensureDatabaseSchema();

    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return {
        success: false,
        error: "Invalid order ID.",
      };
    }

    const restoredOrder = await db
      .update(orders)
      .set({
        archivedAt: null,
      })
      .where(and(eq(orders.id, orderId), isNotNull(orders.archivedAt)))
      .returning();

    if (restoredOrder.length === 0) {
      return {
        success: false,
        error: "Order not found or not in history.",
      };
    }

    revalidatePath("/");

    return {
      success: true,
      order: restoredOrder[0],
    };
  } catch (error) {
    console.error("Restore order failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unable to restore order.",
    };
  }
}

export async function trackOrder(data: { orderId: number; phone: string }) {
  try {
    const orderId = Number(data.orderId);
    const normalizedInputPhone = normalizeKenyaPhone(String(data.phone || ""));

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return {
        success: false,
        error: "Please enter a valid order number.",
      };
    }

    if (!normalizedInputPhone) {
      return {
        success: false,
        error: "Please enter the M-PESA phone number used during checkout.",
      };
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return {
        success: false,
        error: "Order not found. Check your order number and try again.",
      };
    }

    const normalizedOrderPhone = normalizeKenyaPhone(order.phoneNumber);

    if (normalizedInputPhone !== normalizedOrderPhone) {
      return {
        success: false,
        error: "Order details do not match the phone number provided.",
      };
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    return {
      success: true,
      order: {
        ...order,
        items,
      },
    };
  } catch (error) {
    console.error("Track order failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to track order right now.",
    };
  }
}

export async function updateOrderStatus(
  orderId: number,
  orderStatus: "processing" | "shipped" | "delivered" | "cancelled"
) {
  try {
    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return {
        success: false,
        error: "Invalid order ID.",
      };
    }

    const allowedStatuses = [
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ] as const;

    if (!allowedStatuses.includes(orderStatus)) {
      return {
        success: false,
        error: "Invalid order status.",
      };
    }

    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existingOrder) {
      return {
        success: false,
        error: "Order not found.",
      };
    }

    if (
      orderStatus !== "cancelled" &&
      String(existingOrder.paymentStatus || "").toLowerCase() !== "paid"
    ) {
      return {
        success: false,
        error:
          "Delivery progress can only be updated after payment is confirmed.",
      };
    }

    const updatedOrder = await db
      .update(orders)
      .set({
        orderStatus,
        adminSeenAt: existingOrder.adminSeenAt ?? new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (updatedOrder.length === 0) {
      return {
        success: false,
        error: "Order not found.",
      };
    }

    const order = updatedOrder[0];

    const notification = await notifyBuyerOrderUpdate(
      order.phoneNumber,
      order.id,
      order.orderStatus as "processing" | "shipped" | "delivered" | "cancelled"
    );

    revalidatePath("/");

    return {
      success: true,
      order,
      notification: {
        sent: notification.sent,
        reason: notification.reason,
      },
    };
  } catch (error) {
    console.error("Update order status failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to update order status.",
    };
  }
}

export async function markOrderCashPaid(orderId: number) {
  try {
    await ensureDatabaseSchema();

    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return { success: false, error: "Invalid order ID." };
    }

    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existingOrder) {
      return { success: false, error: "Order not found." };
    }

    if (String(existingOrder.paymentMethod || "").toLowerCase() !== "cash") {
      return {
        success: false,
        error: "Only cash orders can be marked as cash received.",
      };
    }

    if (String(existingOrder.paymentStatus || "").toLowerCase() === "paid") {
      return { success: true, order: existingOrder, message: "Order is already paid." };
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({
        paymentStatus: "paid",
        adminSeenAt: existingOrder.adminSeenAt ?? new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (!updatedOrder) {
      return { success: false, error: "Unable to update order payment status." };
    }

    const notification = await notifyBuyerOrderUpdate(
      updatedOrder.phoneNumber,
      updatedOrder.id,
      "payment_confirmed"
    );

    revalidatePath("/");

    return {
      success: true,
      order: updatedOrder,
      message: "Cash payment recorded.",
      notification: {
        sent: notification.sent,
        reason: notification.reason,
      },
    };
  } catch (error) {
    console.error("Mark order cash paid failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to mark cash payment as received.",
    };
  }
}

export async function getNotificationSetup() {
  return {
    success: true,
    config: getNotificationConfigSummary(),
  };
}

export async function getCustomerOrders() {
  try {
    const cookieStore = await cookies();
    const customerId = verifyCustomerToken(
      cookieStore.get("kariobangi_customer")?.value
    );

    if (!customerId) {
      return {
        success: false,
        error: "Please sign in to view your orders.",
        orders: [],
      };
    }

    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!customer) {
      return {
        success: false,
        error: "Account not found.",
        orders: [],
      };
    }

    const phoneVariants = getPhoneLookupVariants(customer.phoneNumber);

    const orderList = await db
      .select()
      .from(orders)
      .where(
        or(
          eq(orders.customerId, customer.id),
          ...phoneVariants.map((phone) => eq(orders.phoneNumber, phone))
        )
      )
      .orderBy(desc(orders.createdAt));

    const ordersWithItems = await Promise.all(
      orderList.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          items,
        };
      })
    );

    return {
      success: true,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        phoneNumber: customer.phoneNumber,
        email: customer.email,
      },
      orders: ordersWithItems,
    };
  } catch (error) {
    console.error("Get customer orders failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to load your orders.",
      orders: [],
    };
  }
}

function serializeAdminMembership(row: typeof memberships.$inferSelect) {
  const plan = getMembershipPlan(row.planId);
  const status = getAdminMembershipStatus(row.paymentStatus, row.expiresAt);

  return {
    id: row.id,
    customerId: row.customerId,
    fullName: row.fullName,
    phoneNumber: row.phoneNumber,
    planId: row.planId,
    planName: plan?.name ?? "Official Fan",
    amount: row.amount,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    status,
    mpesaReceiptNumber: row.mpesaReceiptNumber,
    expiresAt: row.expiresAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getMemberships() {
  try {
    await ensureDatabaseSchema();

    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error, memberships: [] };
    }

    const rows = await db
      .select()
      .from(memberships)
      .orderBy(desc(memberships.createdAt), desc(memberships.id));

    return {
      success: true,
      memberships: rows.map(serializeAdminMembership),
    };
  } catch (error) {
    console.error("Get memberships failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unable to load memberships.",
      memberships: [],
    };
  }
}

export async function addAdminMembership(input: {
  fullName: string;
  phone: string;
  planId: string;
}) {
  try {
    await ensureDatabaseSchema();

    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const fullName = String(input.fullName || "").trim();
    const phone = String(input.phone || "").trim();
    const plan = getMembershipPlan(String(input.planId || ""));

    if (!fullName) {
      return { success: false, error: "Member name is required." };
    }

    if (!isValidKenyaPhone(phone)) {
      return {
        success: false,
        error: "Enter a valid Kenyan phone number, e.g. 0712345678.",
      };
    }

    if (!plan) {
      return { success: false, error: "Choose a membership plan." };
    }

    const phoneNumber = normalizeCustomerPhone(phone);
    if (!phoneNumber) {
      return { success: false, error: "Enter a valid Kenyan phone number." };
    }

    const variants = getPhoneLookupVariants(phoneNumber);
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(inArray(customers.phoneNumber, variants))
      .limit(1);

    let customer = existingCustomer;
    let createdAccount = false;

    if (!customer) {
      const temporaryPassword = crypto.randomBytes(9).toString("base64url");
      const [created] = await db
        .insert(customers)
        .values({
          fullName,
          phoneNumber,
          email: null,
          passwordHash: await hashPassword(temporaryPassword),
          createdAt: new Date(),
        })
        .returning();

      if (!created) {
        return { success: false, error: "Unable to create a fan account for this member." };
      }

      customer = created;
      createdAccount = true;
    }

    const active = await findActivePaidMembership(customer.id);
    if (active) {
      return {
        success: false,
        error: `${customer.fullName} already has an active ${active.planName} membership.`,
      };
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const [membership] = await db
      .insert(memberships)
      .values({
        customerId: customer.id,
        fullName: customer.fullName || fullName,
        phoneNumber: customer.phoneNumber,
        planId: plan.id,
        amount: plan.price,
        paymentMethod: "admin",
        paymentStatus: "paid",
        mpesaReceiptNumber: "ADMIN",
        expiresAt,
        createdAt: new Date(),
      })
      .returning();

    if (!membership) {
      return { success: false, error: "Unable to add this membership." };
    }

    revalidatePath("/");

    return {
      success: true,
      createdAccount,
      membership: serializeAdminMembership(membership),
    };
  } catch (error) {
    console.error("Add admin membership failed:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unable to add this member.",
    };
  }
}

export async function revokeMembership(membershipId: number) {
  try {
    await ensureDatabaseSchema();

    const auth = await requireFullAdmin();
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const id = Number(membershipId);
    if (!Number.isInteger(id) || id <= 0) {
      return { success: false, error: "A valid membership is required." };
    }

    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.id, id))
      .limit(1);

    if (!membership) {
      return { success: false, error: "Membership not found." };
    }

    if (membership.paymentStatus === "revoked") {
      return { success: false, error: "This membership is already revoked." };
    }

    if (membership.paymentStatus !== "paid") {
      return {
        success: false,
        error: "Only a paid membership can be revoked.",
      };
    }

    await db
      .update(memberships)
      .set({
        paymentStatus: "revoked",
        expiresAt: new Date(),
      })
      .where(eq(memberships.id, id));

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Revoke membership failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to revoke this membership.",
    };
  }
}