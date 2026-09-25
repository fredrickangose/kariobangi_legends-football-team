"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Settings,
  Pencil,
  Home,
  BookOpen,
  Users,
  Shield,
  CalendarDays,
  Newspaper,
  Images,
  ShoppingBag,
  HeartHandshake,
  MessageCircle,
  Maximize2,
  Menu,
  Search,
    Trophy,
  ImageIcon,
    Award,
  Sparkles,
  Activity,
  Calendar,
  ArrowRight,
  Camera,
  MessageSquare,
    ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  MapPin,
  Heart,
  Phone,
  Mail,
  Clock,
  Check,
  X,
  ChevronDown,
  Package,
  User,
  LogOut,
  Navigation,
  Play,
  Pause,
  Film,
  Banknote,
} from "lucide-react";
import {
  OrderProgressTimeline,
  OrderStatusBadge,
} from "@/components/OrderProgressTimeline";
import { PasswordInput } from "@/components/PasswordInput";
import {
  SESSION_IDLE_TIMEOUT_MS,
  useIdleSessionLock,
} from "@/hooks/useIdleSessionLock";
import {
  ADMIN_SESSION_IDLE_TIMEOUT_MS,
} from "@/lib/session-config";
import {
  isUploadedMediaUrl,
  isVideoMediaUrl,
  MEDIA_UPLOAD_RULES,
  VIDEO_UPLOAD_RULES,
} from "@/lib/uploaded-media";
import {
  groupPlayersBySquadPosition,
  getSquadPositionBadge,
  SQUAD_POSITION_GROUPS,
  SQUAD_POSITION_OPTIONS,
} from "@/lib/squad-positions";
import {
  getDefaultManagementPosition,
  getManagementPositionOptions,
  getManagementRoleBadge,
  groupManagementByCategoryAndRole,
  isFeaturedManagementRole,
  MANAGEMENT_CATEGORIES,
  sortManagementMembers,
} from "@/lib/management-roles";
import {
  COMPETITION_NAME,
  buildFixtureIcs,
  combineFixtureDateTime,
  formatKickoff,
  getMatchCountdown,
  hasKickoffTime,
  getEffectiveMatchStatus,
  getHomeAwayTeams,
  getMatchResult,
  getMatchStatusMeta,
  getMatchTypeMeta,
  getRecentForm,
  getResultLabel,
  getResultTone,
  getSeasonStats,
  isFixtureFinished,
  isLeagueMatch,
  MATCH_TYPES,
  normalizeMatchType,
  partitionFixtures,
  normalizeSquadTeam,
  getSquadTeamMeta,
  toFixtureDateInputValue,
  toFixtureTimeInputValue,
  type FixtureLike,
  type MatchTypeValue,
  type TeamDisplay,
} from "@/lib/match-fixtures";
import {
  getGoogleDirectionsUrl,
  getGoogleMapsViewUrl,
  HOME_GROUND,
  isClubHomeVenue,
} from "@/lib/venue-directions";
import {
  getMerchandiseCategoriesWithItems,
  getMerchandiseCategoryLabel,
  getMerchandiseCategoryMeta,
  groupMerchandiseByCategory,
  MERCHANDISE_CATEGORIES,
  normalizeMerchandiseCategory,
} from "@/lib/merchandise-categories";
import {
  getMerchandiseStockStatusMeta,
  isMerchandiseAvailable,
} from "@/lib/merchandise-stock";
import {
  submitDonation,
  submitFanMessage,
  addPlayer,
  addNews,
  addGalleryImage,
  addTeamHighlight,
  deletePlayer,
  deleteNews,
  deleteGalleryImage,
  deleteTeamHighlight,
  updatePlayer,
  updatePlayerName,
  updatePlayerPosition,
  updatePlayerJerseyNumber,
  updatePlayerImage,
  updateManagementName,
  updateManagementImage,
  updateNewsImage,
  updateGalleryImage,
  addMerchandise,
  updateMerchandiseImage,
  updateMerchandiseDetails,
  updateMerchandisePrice,
  updateMerchandiseStockStatus,
  updateMerchandiseCategory,
  deleteMerchandise,
  clearAllMerchandise,
  addManagement,
  updateManagement,
  updateManagementRole,
  deleteManagement,
  addFixture,
  updateFixture,
  deleteFixture,
  getMatchUpdates,
  addMatchUpdate,
  deleteMatchUpdate,
  getOrders,
  updateOrderStatus,
  markAdminOrdersSeen,
  archiveOrder,
  restoreOrder,
  trackOrder,
  getNotificationSetup,
  getClubData,
  markOrderCashPaid,
  getMemberships,
  addAdminMembership,
  revokeMembership,
} from "./actions";
import {
  getOrderStatusLabel,
} from "@/lib/order-tracking";
import {
  DONATION_CURRENCIES,
  DONATION_CURRENCY_CODES,
  type DonationCurrencyCode,
  formatDonationAmount,
  getDefaultDonationAmount,
  getDonationCurrency,
  isDonationCurrencyCode,
} from "@/lib/donation-currencies";
import { buildFixtureWhatsAppShare } from "@/lib/share-links";
import {
  formatJerseyCustomization,
  isJerseyMerchandise,
} from "@/lib/order-customization";
import {
  getImprovedMerchandiseCopy,
  SHOP_DELIVERY_NOTE,
  SHOP_SIZE_CHART,
} from "@/lib/merchandise-copy";
import {
  MEMBER_SHOP_DISCOUNT_PERCENT,
  MEMBERSHIP_PLANS,
  applyMemberUnitPrice,
  formatMembershipExpiry,
  type AdminMembershipStatus,
  type FanMembership,
  type MembershipPlanId,
} from "@/lib/membership";

const AdminPanel = dynamic(() => import("./AdminPanel"), { ssr: false });
export interface Player {
  id: number;
  name: string;
  position: string;
  jerseyNumber: number;
  imageUrl: string;
  bio: string;
  appearances: number;
  goals: number;
  assists: number;
}

export interface Fixture {
  id: number;
  opponent: string;
  opponentLogoUrl: string | null;
  date: string;
  isHome: boolean;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  venue: string;
  matchType?: string | null;
  squadTeam?: string | null;
}

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  createdAt: Date;
}

export interface MerchandiseItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  sizes: string;
  kitType: string;
  stockStatus?: string | null;
}

export interface Donation {
  id: number;
  donorName: string;
  amount: number;
  currency?: string | null;
  message: string | null;
  purpose: string;
  paymentStatus?: string | null;
  createdAt: Date;
}

export interface FanMessage {
  id: number;
  name: string;
  message: string;
  createdAt: Date;
}

export interface GalleryItem {
  id: number;
  imageUrl: string;
  caption: string;
  category: string;
  createdAt: Date;
}

export interface TeamHighlight {
  id: number;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  category: string;
  createdAt: Date;
}

export interface ManagementMember {
  id: number;
  name: string;
  position: string;
  category: string;
  bio: string | null;
  responsibilities: string | null;
  imageUrl: string | null;
  displayOrder: number;
  createdAt: Date;
}

interface ClubWebsiteProps {
  initialData: {
    players: Player[];
    fixtures: Fixture[];
    news: NewsItem[];
    merchandise: MerchandiseItem[];
    donations: Donation[];
    fanMessages: FanMessage[];
    gallery: GalleryItem[];
    highlights: TeamHighlight[];
    management: ManagementMember[];
  };
  initialTab?: string;
  initialNewsId?: number | null;
  initialFixtureId?: number | null;
  shareBaseUrl?: string;
  initialTrackOrderId?: string;
}

export const HIGHLIGHT_CATEGORIES = [
  "Match Highlights",
  "Goals & Skills",
  "Training",
  "Community",
  "Academy",
] as const;

function HighlightVideoCard({
  highlight,
  onPlay,
  showAdminControls,
  onDelete,
}: {
  highlight: TeamHighlight;
  onPlay: (highlight: TeamHighlight) => void;
  showAdminControls: boolean;
  onDelete: (id: number, title: string) => void;
}) {
  const hasThumbnail = isUploadedMediaUrl(highlight.thumbnailUrl);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
      <button
        type="button"
        onClick={() => onPlay(highlight)}
        className="relative aspect-video w-full overflow-hidden bg-slate-950 cursor-pointer"
      >
        {hasThumbnail ? (
          <Image
            src={highlight.thumbnailUrl as string}
            alt={highlight.title}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : isVideoMediaUrl(highlight.videoUrl) ? (
          <video
            src={highlight.videoUrl}
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-14 h-14 rounded-full bg-yellow-400 text-slate-950 flex items-center justify-center shadow-lg shadow-yellow-400/30 group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 ml-0.5 fill-current" />
          </span>
        </div>

        <span className="absolute top-3 left-3 inline-flex items-center px-2 py-1 rounded-md bg-slate-950/85 text-yellow-400 text-[9px] font-black uppercase tracking-wider border border-yellow-400/20">
          {highlight.category}
        </span>
      </button>

      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <h3 className="font-black text-sm text-slate-950 leading-snug line-clamp-2">
          {highlight.title}
        </h3>
        {highlight.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {highlight.description}
          </p>
        )}
        <p className="text-[10px] text-slate-400 font-semibold mt-auto">
          {new Date(highlight.createdAt).toLocaleDateString("en-KE", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        {showAdminControls && (
          <button
            type="button"
            onClick={() => onDelete(highlight.id, highlight.title)}
            className="mt-2 w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Video
          </button>
        )}
      </div>
    </div>
  );
}

type NavDropdownItemConfig = {
  tabId: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

function NavDropdownItem({
  label,
  description,
  icon: Icon,
  isActive,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group/item w-full text-left rounded-xl px-3 py-3 transition-all duration-200 flex items-center gap-3 ${
        isActive
          ? "bg-emerald-50 ring-1 ring-emerald-200/80 shadow-sm shadow-emerald-600/5"
          : "hover:bg-white hover:shadow-md hover:shadow-slate-950/5 ring-1 ring-transparent hover:ring-slate-200/80"
      }`}
    >
      <span
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
          isActive
            ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-600/30"
            : "bg-slate-100 text-slate-600 group-hover/item:bg-slate-950 group-hover/item:text-yellow-400"
        }`}
      >
        <Icon className="w-4 h-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span
          className={`block text-sm font-bold tracking-tight ${
            isActive ? "text-emerald-800" : "text-slate-900 group-hover/item:text-slate-950"
          }`}
        >
          {label}
        </span>
        <span className="block text-[11px] text-slate-500 mt-0.5 leading-snug">{description}</span>
      </span>
      <ArrowRight
        className={`w-4 h-4 shrink-0 transition-all duration-200 ${
          isActive
            ? "text-emerald-600 opacity-100 translate-x-0"
            : "text-slate-300 opacity-0 -translate-x-1 group-hover/item:opacity-100 group-hover/item:translate-x-0 group-hover/item:text-emerald-600"
        }`}
      />
    </button>
  );
}

function NavDropdownPanel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute left-0 top-full pt-3 opacity-0 invisible translate-y-2 scale-[0.97] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:scale-100 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-50 pointer-events-none group-hover:pointer-events-auto">
      <div className="relative w-[19rem] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_28px_70px_-24px_rgba(15,23,42,0.45)] ring-1 ring-slate-950/5">
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-yellow-400/25 via-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative px-4 py-3.5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/90 mb-1">Explore</p>
          <p className="text-sm font-black tracking-tight">{title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{subtitle}</p>
        </div>
        <div className="relative p-2 space-y-0.5 bg-gradient-to-b from-slate-50/90 to-white">{children}</div>
        <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 text-center">
            Kariobangi Legends FC
          </p>
        </div>
      </div>
    </div>
  );
}

function DesktopNavDropdown({
  label,
  isActive,
  triggerClassName,
  title,
  subtitle,
  items,
  activeTab,
  onNavigate,
}: {
  label: string;
  isActive: boolean;
  triggerClassName: (isActive: boolean) => string;
  title: string;
  subtitle: string;
  items: NavDropdownItemConfig[];
  activeTab: string;
  onNavigate: (tab: string) => void;
}) {
  return (
    <div className="relative group">
      <button type="button" className={triggerClassName(isActive)}>
        {label}
        <ChevronDown className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180 opacity-80" />
      </button>
      <NavDropdownPanel title={title} subtitle={subtitle}>
        {items.map((item) => (
          <NavDropdownItem
            key={item.tabId}
            label={item.label}
            description={item.description}
            icon={item.icon}
            isActive={activeTab === item.tabId}
            onClick={() => onNavigate(item.tabId)}
          />
        ))}
      </NavDropdownPanel>
    </div>
  );
}

function MobileNavSection({
  title,
  subtitle,
  items,
  activeTab,
  onNavigate,
  onAccount,
}: {
  title: string;
  subtitle?: string;
  items: Array<{
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    isAccount?: boolean;
  }>;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onAccount?: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="relative px-4 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">{title}</p>
        {subtitle ? <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p> : null}
      </div>
      <div className="p-2 space-y-1">
        {items.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => (tab.isAccount && onAccount ? onAccount() : onNavigate(tab.id))}
              className={`group/item w-full text-left rounded-xl px-3 py-3 transition-all flex items-center gap-3 ${
                isActive
                  ? "bg-emerald-50 ring-1 ring-emerald-200/80 shadow-sm"
                  : "hover:bg-slate-50 ring-1 ring-transparent hover:ring-slate-200/70"
              }`}
            >
              <span
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                    : "bg-slate-100 text-slate-600 group-hover/item:bg-slate-950 group-hover/item:text-yellow-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </span>
              <span className="flex-1 min-w-0">
                <span
                  className={`block text-xs font-bold uppercase tracking-wide ${
                    isActive ? "text-emerald-800" : "text-slate-800"
                  }`}
                >
                  {tab.label}
                </span>
                <span className="block text-[10px] text-slate-500 mt-0.5">{tab.description}</span>
              </span>
              <ArrowRight
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? "text-emerald-600" : "text-slate-300 group-hover/item:text-emerald-600"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MerchandiseAdminThumbnail({ item }: { item: MerchandiseItem }) {
  const hasImage = item.imageUrl.startsWith("/") || item.imageUrl.startsWith("http");
  const categoryMeta = getMerchandiseCategoryMeta(item.kitType);
  const stockMeta = getMerchandiseStockStatusMeta(item.stockStatus);

  return (
    <div className="relative w-full h-44 sm:h-48 bg-white border-b border-slate-100 overflow-hidden flex items-center justify-center p-2">
      {hasImage ? (
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(min-width: 640px) 25vw, 50vw"
          className="object-contain"
        />
      ) : (
        <div className="text-center space-y-2">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No photo uploaded</p>
        </div>
      )}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
        <span className="bg-slate-950/90 text-yellow-400 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
          {categoryMeta.label}
        </span>
        <span
          className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${stockMeta.badgeClass}`}
        >
          {stockMeta.label}
        </span>
      </div>
    </div>
  );
}

const HOME_CAROUSEL_PHOTO_LIMIT = 5;

interface CartItem {
  merchId: number;
  name: string;
  price: number;
  size: string;
  quantity: number;
  kitType: string;
}

type JerseyCustomizationState = {
  jerseyNameOption: "none" | "name";
  jerseyName: string;
};

function getCartItemKey(item: Pick<CartItem, "merchId" | "size">) {
  return `${item.merchId}-${item.size}`;
}

const CONTACT_CENTER = {
  email: "Kariobangilegendsyouth@gmail.com",
  location: {
    venue: HOME_GROUND.name,
    landmark: HOME_GROUND.landmark,
    region: `${HOME_GROUND.constituency}, ${HOME_GROUND.city}, ${HOME_GROUND.country}`,
    fullAddress: HOME_GROUND.fullAddress,
  },
  phones: [
    { label: "Club Line 1", number: "0723523254" },
    { label: "Club Line 2", number: "0721916526" },
    { label: "Club Line 3", number: "0748308682" },
    { label: "Club Line 4", number: "0711844805" },
  ],
  hours: "Mon – Sat, 8:00 AM – 6:00 PM EAT",
} as const;

const MPESA_PAYBILL = {
  paybill: "4004975",
  account: "KARIOBANGI LEGENDS",
} as const;

function MpesaDonationPrompt({
  amount,
  phone,
  onPhoneChange,
  showPhone = false,
}: {
  amount?: number | null;
  phone?: string;
  onPhoneChange?: (value: string) => void;
  showPhone?: boolean;
}) {
  const displayAmount =
    amount && amount > 0
      ? formatDonationAmount(amount, "KES")
      : "your chosen amount";

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-slate-950 text-white p-4 sm:p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
            M-Pesa STK Push
          </p>
          <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
            Secure
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Enter your M-Pesa number below and confirm the prompt on your phone — no manual PayBill
          steps required.
        </p>

        {amount && amount > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Donation amount
            </span>
            <span className="text-lg font-black text-emerald-400">{displayAmount}</span>
          </div>
        )}
      </div>

      {showPhone && onPhoneChange && (
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase block">
            M-Pesa mobile number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="tel"
              placeholder="0712345678"
              value={phone ?? ""}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="w-full text-sm pl-9 pr-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>
          <span className="text-[10px] text-slate-400 block">
            We will send an M-Pesa STK Push to this number when you submit.
          </span>
        </div>
      )}

      <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3 sm:p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-2">
          How M-Pesa donation works
        </p>
        <ol className="space-y-1 text-xs text-slate-600 leading-relaxed list-decimal list-inside">
          <li>Fill in your name, amount, and M-Pesa number below.</li>
          <li>Tap submit — an STK Push prompt is sent to your phone.</li>
          <li>Enter your M-Pesa PIN to confirm {displayAmount}.</li>
          <li>Your gift appears on the Donors Honor Board once payment is confirmed.</li>
        </ol>
      </div>
    </div>
  );
}

function InternationalDonationPrompt({
  currency,
  amount,
  email,
}: {
  currency: DonationCurrencyCode;
  amount?: number | null;
  email: string;
}) {
  const config = getDonationCurrency(currency);
  const displayAmount =
    amount && amount > 0
      ? formatDonationAmount(amount, currency)
      : `your chosen amount in ${config.code}`;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-slate-950 text-white p-4 sm:p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
            International Donation
          </p>
          <span className="text-[9px] font-bold bg-blue-500/20 text-blue-200 px-2 py-1 rounded-full">
            {config.code}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          We welcome support from donors outside Kenya in {config.label}. Our team
          will share secure international payment details after you submit your pledge.
        </p>

        {amount && amount > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Pledge amount
            </span>
            <span className="text-lg font-black text-emerald-400">{displayAmount}</span>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 sm:p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-2">
          How to give from abroad
        </p>
        <ol className="space-y-1 text-xs text-slate-600 leading-relaxed list-decimal list-inside">
          <li>Submit your donation details below with amount in {config.code}.</li>
          <li>
            Email{" "}
            <a
              href={`mailto:${email}?subject=International%20Donation%20(${config.code})`}
              className="font-bold text-emerald-700 underline underline-offset-2 break-all"
            >
              {email}
            </a>{" "}
            to receive bank transfer or international payment instructions.
          </li>
          <li>Complete your transfer and we will acknowledge your gift on the honor board.</li>
        </ol>
      </div>
    </div>
  );
}

function WhatsAppShareButton({
  href,
  label = "Share on WhatsApp",
  compact = false,
}: {
  href: string;
  label?: string;
  compact?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        compact
          ? "inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 hover:text-emerald-800"
          : "inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 transition"
      }
    >
      <MessageCircle className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
      {label}
    </a>
  );
}

function DonationPaymentPrompt({
  currency,
  amount,
  phone,
  onPhoneChange,
  showPhone = false,
  email,
}: {
  currency: DonationCurrencyCode;
  amount?: number | null;
  phone?: string;
  onPhoneChange?: (value: string) => void;
  showPhone?: boolean;
  email: string;
}) {
  if (currency === "KES") {
    return (
      <MpesaDonationPrompt
        amount={amount}
        phone={phone}
        onPhoneChange={onPhoneChange}
        showPhone={showPhone}
      />
    );
  }

  return (
    <InternationalDonationPrompt
      currency={currency}
      amount={amount}
      email={email}
    />
  );
}

function toTelHref(number: string): string {
  const digits = number.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
  return `tel:+${normalized}`;
}

export function formatPhoneDisplay(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return number;
}

export function formatStoredPhoneForInput(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) {
    return `0${digits.slice(3)}`;
  }
  return number;
}

function GetDirectionsLink({
  venue,
  label = "Get Directions",
  variant = "emerald",
  className = "",
}: {
  venue?: string | null;
  label?: string;
  variant?: "emerald" | "yellow" | "outline-dark" | "text";
  className?: string;
}) {
  const href = getGoogleDirectionsUrl(venue);

  const variantClass =
    variant === "yellow"
      ? "bg-yellow-400 hover:bg-yellow-300 text-slate-950"
      : variant === "outline-dark"
      ? "bg-white/5 hover:bg-white/10 text-white border border-white/15"
      : variant === "text"
      ? "text-emerald-600 hover:text-emerald-700 bg-transparent px-0 py-0"
      : "bg-emerald-600 hover:bg-emerald-700 text-white";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 font-black uppercase tracking-wider text-[10px] sm:text-xs rounded-xl transition cursor-pointer ${variantClass} ${
        variant === "text" ? "" : "px-4 py-3"
      } ${className}`}
    >
      <Navigation className="w-4 h-4 shrink-0" />
      {label}
    </a>
  );
}

function SocialIconLink({
  href,
  label,
  title,
  hoverClassName,
  children,
}: {
  href?: string;
  label: string;
  title: string;
  hoverClassName: string;
  children: React.ReactNode;
}) {
  const className = `group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 text-white shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${hoverClassName}`;
  const content = (
    <>
      <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-white/10 to-transparent" />
      <span className="relative z-10 transition-transform duration-300 group-hover:scale-110">
        {children}
      </span>
    </>
  );

  if (!href) {
    return (
      <button
        type="button"
        aria-label={label}
        title={title}
        className={`${className} cursor-default`}
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={title}
      className={className}
    >
      {content}
    </a>
  );
}

function SocialMediaLinks() {
  const tiktokUrl = "https://www.tiktok.com/@kariobangi_legends_fc";

  return (
    <div className="pt-2">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">
        Follow the Legends
      </p>

      <div className="flex items-center gap-3">
        <SocialIconLink
          href="https://x.com/Kariobangi40852"
          label="Kariobangi Legends on X"
          title="Follow Kariobangi Legends on X"
          hoverClassName="hover:border-white hover:bg-black hover:shadow-[0_12px_30px_rgba(255,255,255,0.12)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </SocialIconLink>

        <SocialIconLink
          href="https://www.facebook.com/profile.php?id=100092849342811"
          label="Kariobangi Legends on Facebook"
          title="Follow Kariobangi Legends on Facebook"
          hoverClassName="hover:border-[#1877F2] hover:bg-[#1877F2] hover:shadow-[0_12px_30px_rgba(24,119,242,0.35)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="M13.5 3.5H16.5V0H13.125C9.75 0 7.875 1.912 7.875 5.025V7.5H5.25V11.25H7.875V24H11.625V11.25H14.85L15.375 7.5H11.625V5.475C11.625 4.387 11.925 3.5 13.5 3.5Z" />
          </svg>
        </SocialIconLink>

        <SocialIconLink
          href="https://www.instagram.com/kariobangi_legends_fc"
          label="Kariobangi Legends on Instagram"
          title="Follow Kariobangi Legends on Instagram"
          hoverClassName="hover:border-transparent hover:shadow-[0_12px_30px_rgba(221,42,123,0.35)] hover:bg-gradient-to-br hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#8134af]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.75]" aria-hidden="true">
            <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
            <circle cx="12" cy="12" r="4.2" />
            <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
          </svg>
        </SocialIconLink>

        <SocialIconLink
          href={tiktokUrl || undefined}
          label="Kariobangi Legends on TikTok"
          title={tiktokUrl ? "Follow Kariobangi Legends on TikTok" : "TikTok coming soon"}
          hoverClassName="hover:border-[#25F4EE] hover:bg-black hover:shadow-[0_12px_30px_rgba(37,244,238,0.28)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.81-2.81 2.89 2.89 0 0 1 2.8-2.94c.26 0 .51.03.75.1v-3.5a6.37 6.37 0 0 0-.75-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.33 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.2 8.2 0 0 0 4.77 1.52V6.79a4.84 4.84 0 0 1-1-.1z" />
          </svg>
        </SocialIconLink>
      </div>
    </div>
  );
}

function PassportPhoto({
  imageUrl,
  alt,
  size = "md",
  priority = false,
}: {
  imageUrl: string | null | undefined;
  alt: string;
  size?: "sm" | "md";
  priority?: boolean;
}) {
  const trimmedUrl = imageUrl?.trim() ?? "";
  const hasRemoteImage = isUploadedMediaUrl(trimmedUrl);
  const hasLocalImage =
    Boolean(trimmedUrl) &&
    (trimmedUrl.startsWith("/") || trimmedUrl.startsWith("./"));
    

const frameClass =
  size === "sm"
    ? "aspect-[390/510] rounded-lg"
    : "aspect-[390/510] rounded-xl";

  if (hasRemoteImage || hasLocalImage) {
    return (
      <div
        className={`relative w-full overflow-hidden bg-slate-200 border border-slate-200/90 shadow-inner ${frameClass}`}
      >
        <Image
          src={trimmedUrl}
          alt={alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 20vw, 33vw"
          className="object-cover object-top"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 border border-dashed border-slate-200 text-slate-400 ${frameClass}`}
    >
      <User className={size === "sm" ? "w-5 h-5" : "w-6 h-6"} />
      <p className="text-[8px] font-bold uppercase tracking-wider mt-1.5 px-2 text-center leading-tight">
        Photo coming soon
      </p>
    </div>
  );
}

export function preventAdminListScrollChaining(
  event: React.KeyboardEvent<HTMLDivElement>
) {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
    return;
  }

  const target = event.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT")
  ) {
    return;
  }

  const container = event.currentTarget;
  const atTop = container.scrollTop <= 0;
  const atBottom =
    container.scrollTop + container.clientHeight >= container.scrollHeight - 1;

  if (
    (event.key === "ArrowUp" && atTop) ||
    (event.key === "ArrowDown" && atBottom)
  ) {
    event.preventDefault();
  }
}

export function AdminCollapsibleSection({
  title,
  description,
  closedDescription,
  isOpen,
  onToggle,
  badge,
  icon: Icon,
  variant = "nested",
  children,
}: {
  title: string;
  description?: string;
  closedDescription: string;
  isOpen: boolean;
  onToggle: () => void;
  badge?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "nested" | "panel";
  children: React.ReactNode;
}) {
  const hint = isOpen ? description : closedDescription;

  const toggleButton = (
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={onToggle}
      className={
        variant === "panel"
          ? "w-full p-6 flex items-start justify-between gap-4 text-left hover:bg-slate-50/80 transition cursor-pointer"
          : "w-full flex items-start justify-between gap-3 text-left group cursor-pointer py-1"
      }
    >
      <div className="space-y-1 min-w-0">
        <h4
          className={
            variant === "panel"
              ? "font-black text-lg text-slate-950 flex items-center gap-2 flex-wrap"
              : "font-bold text-sm text-slate-950 flex items-center gap-2 flex-wrap"
          }
        >
          {Icon && (
            <Icon
              className={
                variant === "panel"
                  ? "w-5 h-5 shrink-0"
                  : "w-4 h-4 shrink-0 text-emerald-600"
              }
            />
          )}
          {title}
          {badge}
        </h4>
        {hint && (
          <p
            className={
              variant === "panel"
                ? "text-sm text-slate-600"
                : "text-[11px] text-slate-500 leading-relaxed"
            }
          >
            {hint}
          </p>
        )}
      </div>
      <span
        className={
          variant === "panel"
            ? "shrink-0 w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600"
            : "shrink-0 w-8 h-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 group-hover:border-emerald-200"
        }
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </span>
    </button>
  );

  if (variant === "panel") {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-fit self-start w-full">
        {toggleButton}
        {isOpen && (
          <div className="px-6 pb-6 pt-0 space-y-5 border-t border-slate-100">
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-4 border-t border-slate-100">
      {toggleButton}
      {isOpen && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}

function SquadPlayerCard({
  player,
  showAdminControls,
  isUpdatingPosition,
  isUpdatingJersey,
  onReplaceImage,
  onDelete,
  onEdit,
  onPositionChange,
  onJerseyChange,
  onShopClick,
  onViewProfile,
}: {
  player: Player;
  showAdminControls: boolean;
  isUpdatingPosition: boolean;
  isUpdatingJersey: boolean;
  onReplaceImage: (id: number, imageUrl: string) => void;
  onDelete: (id: number, name: string) => void;
  onEdit: (player: Player) => void;
  onPositionChange: (id: number, position: string) => void;
  onJerseyChange: (id: number, jerseyNumber: number) => void;
  onShopClick: () => void;
  onViewProfile: (id: number) => void;
}) {
  const positionInOptions = SQUAD_POSITION_OPTIONS.some(
    (option) => option.value === player.position
  );

  return (
    <div
      onClick={() => onViewProfile(player.id)}
      className="group w-[130px] sm:w-[145px] md:w-[155px] lg:w-[160px] xl:w-[165px] 2xl:w-[170px] shrink-0 bg-white rounded-xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-lg hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer"
    >
      <div className="relative p-2 pb-0">
        <PassportPhoto
          imageUrl={player.imageUrl}
          alt={`${player.name} - Kariobangi Legends`}
          size="sm"
        />
        <span className="absolute top-3 left-3 inline-flex items-center justify-center min-w-[1.65rem] h-6 px-1.5 rounded-md bg-slate-950/90 text-yellow-400 text-[9px] font-black border border-slate-800">
          #{player.jerseyNumber}
        </span>
        <span className="absolute inset-x-0 bottom-0 h-0 group-hover:h-full transition-all duration-200 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none rounded-b-lg" />
        <span className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-white/95 text-slate-950 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center shadow-sm">
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>

      <div className="p-2.5 space-y-2 flex-1 flex flex-col">
        <div className="min-w-0">
          <h3 className="font-bold text-[11px] sm:text-xs text-slate-950 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
            {player.name}
          </h3>
          <p className="text-[8px] text-emerald-700 font-bold uppercase tracking-wider mt-0.5 line-clamp-1">
            {getSquadPositionBadge(player.position)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-50 border border-slate-100 py-1.5 text-center">
          <div>
            <p className="text-[7px] text-slate-400 font-bold uppercase">Apps</p>
            <p className="text-[11px] font-black text-slate-900">{player.appearances}</p>
          </div>
          <div>
            <p className="text-[7px] text-slate-400 font-bold uppercase">Gls</p>
            <p className="text-[11px] font-black text-slate-900">{player.goals}</p>
          </div>
          <div>
            <p className="text-[7px] text-slate-400 font-bold uppercase">Ast</p>
            <p className="text-[11px] font-black text-slate-900">{player.assists}</p>
          </div>
        </div>

        {player.bio && (
          <p className="text-[9px] text-slate-500 leading-relaxed line-clamp-2">
            {player.bio}
          </p>
        )}

        {showAdminControls && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="space-y-1.5 pt-1 border-t border-dashed border-slate-200"
          >
            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
              Admin · Jersey no.
            </label>
            <input
              type="number"
              min={1}
              max={99}
              defaultValue={player.jerseyNumber}
              key={`jersey-${player.id}-${player.jerseyNumber}`}
              disabled={isUpdatingJersey}
              onBlur={(e) => {
                const next = parseInt(e.target.value, 10);
                if (
                  Number.isInteger(next) &&
                  next > 0 &&
                  next !== player.jerseyNumber
                ) {
                  onJerseyChange(player.id, next);
                }
              }}
              className="w-full p-1.5 rounded-md border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 disabled:opacity-50"
            />
            <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
              Admin · Squad section
            </label>
            <select
              value={player.position}
              onChange={(e) => onPositionChange(player.id, e.target.value)}
              disabled={isUpdatingPosition}
              className="w-full p-1.5 rounded-md border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 disabled:opacity-50"
            >
              {!positionInOptions && (
                <option value={player.position}>
                  {player.position} (assign to a section)
                </option>
              )}
              {SQUAD_POSITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.groupHeading}
                </option>
              ))}
            </select>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onReplaceImage(player.id, player.imageUrl)}
                className="flex-1 bg-slate-950 text-yellow-400 font-bold py-1.5 rounded-md text-[8px] uppercase tracking-wider hover:bg-slate-900 cursor-pointer flex items-center justify-center gap-1"
              >
                <Camera className="w-3 h-3" /> Photo
              </button>
              <button
                type="button"
                onClick={() => onEdit(player)}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-1.5 rounded-md text-[8px] uppercase tracking-wider hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(player.id, player.name)}
                className="flex-1 bg-rose-600 text-white font-bold py-1.5 rounded-md text-[8px] uppercase tracking-wider hover:bg-rose-700 cursor-pointer flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {!showAdminControls && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onShopClick();
          }}
          className="mt-auto border-t border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[8px] py-2 flex items-center justify-center gap-1 cursor-pointer"
        >
          Official Jersey <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function ManagementMemberCard({
  member,
  featured = false,
  showAdminControls,
  isUpdatingRole,
  onEdit,
  onDelete,
  onReplaceImage,
  onRoleChange,
  onViewProfile,
}: {
  member: ManagementMember;
  featured?: boolean;
  showAdminControls: boolean;
  isUpdatingRole: boolean;
  onEdit: (member: ManagementMember) => void;
  onDelete: (id: number) => void;
  onReplaceImage: (id: number, imageUrl: string) => void;
  onRoleChange: (id: number, category: string, position: string) => void;
  onViewProfile: (id: number) => void;
}) {
  const positionOptions = getManagementPositionOptions(member.category);
  const positionInOptions = positionOptions.some(
    (option) => option.value === member.position
  );
  const roleBadge = getManagementRoleBadge(member.position, member.category);

  return (
    <div
      onClick={() => onViewProfile(member.id)}
      className={`group w-[130px] sm:w-[145px] md:w-[155px] lg:w-[160px] xl:w-[165px] 2xl:w-[170px] shrink-0 bg-white rounded-xl overflow-hidden border shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer ${
        featured
          ? "border-emerald-200 ring-1 ring-emerald-100 hover:border-emerald-300"
          : "border-slate-200/80 hover:border-emerald-300"
      }`}
    >
      <div className="relative p-2 pb-0">
        <PassportPhoto
          imageUrl={member.imageUrl}
          alt={`${member.name} - ${member.position}`}
          size="sm"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[calc(100%-1.5rem)]">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-950/90 text-yellow-400 text-[7px] font-black tracking-wider border border-slate-800">
            {roleBadge}
          </span>
          {featured && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-600/95 text-white text-[7px] font-black uppercase tracking-wider">
              Lead
            </span>
          )}
        </div>
        <span className="absolute inset-x-0 bottom-0 h-0 group-hover:h-full transition-all duration-200 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none rounded-b-lg" />
        <span className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-white/95 text-slate-950 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center shadow-sm">
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>

      <div className="p-2.5 space-y-1.5 flex-1 flex flex-col">
        <div className="min-w-0">
          <h4 className="font-bold text-[11px] sm:text-xs text-slate-950 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
            {member.name}
          </h4>
          <p className="text-[8px] font-bold text-emerald-700 uppercase tracking-wider mt-0.5 line-clamp-2">
            {member.position}
          </p>
        </div>

        {(member.responsibilities || member.bio) && (
          <p className="text-[9px] text-slate-500 leading-relaxed line-clamp-2">
            {member.responsibilities || member.bio}
          </p>
        )}

        {showAdminControls && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="space-y-1.5 pt-1.5 mt-auto border-t border-dashed border-amber-200 bg-amber-50/40 -mx-2.5 px-2.5 pb-0.5"
          >
            <p className="text-[7px] font-black uppercase tracking-wider text-amber-700">
              Admin only
            </p>
            <div className="grid grid-cols-1 gap-1">
              <select
                value={member.category}
                onChange={(e) =>
                  onRoleChange(
                    member.id,
                    e.target.value,
                    getDefaultManagementPosition(e.target.value)
                  )
                }
                disabled={isUpdatingRole}
                className="w-full p-1.5 rounded-md border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 disabled:opacity-50"
              >
                {MANAGEMENT_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.dbValue}>
                    {category.heading}
                  </option>
                ))}
              </select>
              <select
                value={member.position}
                onChange={(e) =>
                  onRoleChange(member.id, member.category, e.target.value)
                }
                disabled={isUpdatingRole}
                className="w-full p-1.5 rounded-md border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 disabled:opacity-50"
              >
                {!positionInOptions && (
                  <option value={member.position}>
                    {member.position} (assign role)
                  </option>
                )}
                {positionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.groupHeading} · {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onReplaceImage(member.id, member.imageUrl || "")}
                className="flex-1 bg-slate-950 text-yellow-400 font-bold py-1.5 rounded-md text-[8px] uppercase tracking-wider hover:bg-slate-900 cursor-pointer flex items-center justify-center gap-1"
              >
                <Camera className="w-3 h-3" />
                Photo
              </button>
              <button
                type="button"
                onClick={() => onEdit(member)}
                className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-1.5 rounded-md text-[8px] uppercase tracking-wider hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(member.id)}
                className="flex-1 bg-rose-600 text-white font-bold py-1.5 rounded-md text-[8px] uppercase tracking-wider hover:bg-rose-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamLogo({
  team,
  sizeClass = "w-9 h-9",
  textClass = "text-[10px]",
}: {
  team: TeamDisplay;
  sizeClass?: string;
  textClass?: string;
}) {
  if (team.logo && (team.isLegends || isUploadedMediaUrl(team.logo))) {
    return (
      <Image
        src={team.logo}
        alt={team.name}
        width={40}
        height={40}
        className={`${sizeClass} object-contain shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-600 shrink-0 ${textClass}`}
    >
      {team.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function MatchStatusPill({
  fixture,
  pulseLive = false,
}: {
  fixture: FixtureLike;
  pulseLive?: boolean;
}) {
  const meta = getMatchStatusMeta(fixture);
  const isLive = meta.value === "live";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
        isLive
          ? "bg-rose-600 text-white"
          : meta.value === "completed"
          ? "bg-slate-100 text-slate-700"
          : meta.value === "postponed"
          ? "bg-amber-50 text-amber-700"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {pulseLive && isLive && (
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      )}
      {meta.badge}
    </span>
  );
}

function padCountdown(value: number) {
  return String(value).padStart(2, "0");
}

function MatchCountdown({
  date,
  variant = "dark",
}: {
  date: string;
  variant?: "dark" | "light";
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = now ? getMatchCountdown(date, now) : null;
  const isDark = variant === "dark";
  const shellClass = isDark
    ? "border-white/10 bg-white/5 text-white"
    : "border-slate-200 bg-slate-50 text-slate-950";
  const labelClass = isDark ? "text-yellow-400" : "text-emerald-600";
  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";
  const unitClass = isDark ? "bg-black/30 text-white" : "bg-white text-slate-950 border border-slate-200";

  return (
    <div className={`rounded-2xl border px-4 py-4 sm:px-5 ${shellClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <Clock className={`w-4 h-4 ${labelClass}`} />
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${labelClass}`}>
          Kick-off countdown
        </p>
      </div>

      {!countdown ? (
        <p className={`text-sm font-bold ${mutedClass}`}>Loading kick-off...</p>
      ) : countdown.started ? (
        <p className="text-sm font-bold">Kick-off has passed. Check Live Now or Results.</p>
      ) : !countdown.hasTime && countdown.isMatchDay ? (
        <p className="text-sm font-bold">
          Match day. Kick-off time still to be confirmed.
        </p>
      ) : !countdown.hasTime ? (
        <p className="text-sm font-bold">
          {countdown.days} day{countdown.days === 1 ? "" : "s"} to go · kick-off time TBC
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Days", value: countdown.days },
            { label: "Hrs", value: countdown.hours },
            { label: "Min", value: countdown.minutes },
            { label: "Sec", value: countdown.seconds },
          ].map((unit) => (
            <div key={unit.label} className={`rounded-xl px-2 py-2 text-center ${unitClass}`}>
              <p className="text-lg sm:text-xl font-black tabular-nums">
                {padCountdown(unit.value)}
              </p>
              <p className={`text-[8px] font-black uppercase tracking-wider ${mutedClass}`}>
                {unit.label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchScoreboard({
  fixture,
  variant = "default",
}: {
  fixture: Fixture;
  variant?: "default" | "hero" | "compact";
}) {
  const { home, away } = getHomeAwayTeams(fixture);
  const finished = isFixtureFinished(fixture);
  const isHero = variant === "hero";
  const isCompact = variant === "compact";
  const logoSize = isHero
    ? "w-20 h-20 sm:w-24 sm:h-24"
    : isCompact
    ? "w-8 h-8"
    : "w-10 h-10 sm:w-12 sm:h-12";
  const nameClass = isHero
    ? "text-lg sm:text-xl font-black text-white"
    : isCompact
    ? "text-xs font-extrabold text-slate-900 truncate"
    : "text-sm font-extrabold text-slate-900 truncate";

  return (
    <div
      className={`grid items-center gap-3 ${
        isHero
          ? "grid-cols-1 md:grid-cols-[1fr_auto_1fr]"
          : "grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"
      }`}
    >
      <div
        className={`flex items-center gap-2 min-w-0 ${
          isHero ? "flex-col text-center" : ""
        }`}
      >
        <TeamLogo
          team={home}
          sizeClass={logoSize}
          textClass={isCompact ? "text-[8px]" : "text-[10px]"}
        />
        <div className={isHero ? "space-y-1" : "min-w-0"}>
          {isHero && (
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400">
              Home
            </p>
          )}
          <p className={`${nameClass} ${home.isLegends && isHero ? "text-yellow-400" : ""}`}>
            {home.name}
          </p>
        </div>
      </div>

      <div className={`flex flex-col items-center justify-center ${isHero ? "py-2" : ""}`}>
        {finished && fixture.homeScore !== null && fixture.awayScore !== null ? (
          <div className="flex items-center gap-2">
            <span
              className={`font-black ${
                isHero ? "text-3xl sm:text-4xl text-white" : "text-lg text-slate-950"
              }`}
            >
              {fixture.homeScore}
            </span>
            <span className={`font-bold ${isHero ? "text-white/40" : "text-slate-300"}`}>
              -
            </span>
            <span
              className={`font-black ${
                isHero ? "text-3xl sm:text-4xl text-white" : "text-lg text-slate-950"
              }`}
            >
              {fixture.awayScore}
            </span>
          </div>
        ) : (
          <div
            className={`rounded-full flex items-center justify-center font-black uppercase ${
              isHero
                ? "w-16 h-16 sm:w-20 sm:h-20 bg-white/5 border border-white/10 text-white text-xl"
                : "px-3 py-1.5 bg-slate-100 text-slate-500 text-[10px] tracking-wider"
            }`}
          >
            {getEffectiveMatchStatus(fixture) === "live" ? "LIVE" : "VS"}
          </div>
        )}
        {!isCompact && (
          <p
            className={`mt-1 text-[9px] font-bold uppercase tracking-wider ${
              isHero ? "text-slate-400" : "text-slate-400"
            }`}
          >
            {formatKickoff(fixture.date)}
          </p>
        )}
      </div>

      <div
        className={`flex items-center gap-2 min-w-0 ${
          isHero ? "flex-col text-center" : "justify-end text-right flex-row-reverse"
        }`}
      >
        <TeamLogo
          team={away}
          sizeClass={logoSize}
          textClass={isCompact ? "text-[8px]" : "text-[10px]"}
        />
        <div className={isHero ? "space-y-1" : "min-w-0"}>
          {isHero && (
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">
              Away
            </p>
          )}
          <p className={`${nameClass} ${away.isLegends && isHero ? "text-yellow-400" : ""}`}>
            {away.name}
          </p>
        </div>
      </div>
    </div>
  );
}

function MatchFixtureCard({
  fixture,
  mode,
  isAdminAuthenticated,
  onEdit,
  onDelete,
  highlighted = false,
  shareBaseUrl,
}: {
  fixture: Fixture;
  mode: "upcoming" | "result" | "live";
  isAdminAuthenticated: boolean;
  onEdit: (fixture: Fixture) => void;
  onDelete: (id: number, opponent: string) => void;
  highlighted?: boolean;
  shareBaseUrl?: string;
}) {
  const result = getMatchResult(fixture);
  const tone = getResultTone(result);
  const statusMeta = getMatchStatusMeta(fixture);

  return (
    <div
      id={`fixture-${fixture.id}`}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden scroll-mt-24 ${
        mode === "live"
          ? "border-rose-200 ring-1 ring-rose-100"
          : highlighted
            ? "border-emerald-300 ring-2 ring-emerald-200"
            : "border-slate-100"
      }`}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
            {getMatchTypeMeta(fixture.matchType).heading}
          </span>
          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 shrink-0">
            {getMatchTypeMeta(fixture.matchType).badge}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MatchStatusPill fixture={fixture} pulseLive={mode === "live"} />
          {mode === "result" && result && (
            <span
              className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${tone.badge}`}
            >
              {getResultLabel(result)}
            </span>
          )}
          {mode === "upcoming" && (
            <span
              className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                fixture.isHome
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {fixture.isHome ? "Home" : "Away"}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <MatchScoreboard fixture={fixture} variant="compact" />
      </div>

      <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1 min-w-0">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{fixture.venue}</span>
        </span>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {(mode === "upcoming" || mode === "live") && (
            <GetDirectionsLink
              venue={fixture.venue}
              variant="text"
              label="Directions"
              className="text-[10px]"
            />
          )}
          <WhatsAppShareButton
            href={buildFixtureWhatsAppShare(fixture, shareBaseUrl)}
            label="Share"
            compact
          />
          <span className="font-bold text-slate-700">{formatKickoff(fixture.date)}</span>
          {isAdminAuthenticated && (
            <>
              <button
                type="button"
                onClick={() => onEdit(fixture)}
                className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded cursor-pointer"
                title="Edit match"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(fixture.id, fixture.opponent)}
                className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                title="Remove match"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {mode === "live" && (
        <>
          <div className="px-4 py-2 bg-rose-50 border-t border-rose-100 text-[10px] font-bold uppercase tracking-wider text-rose-700">
            Match in progress · {statusMeta.label}
          </div>
          <LiveMatchFeed
            fixtureId={fixture.id}
            canManage={isAdminAuthenticated}
          />
        </>
      )}
    </div>
  );
}

const MATCH_EVENT_ICONS: Record<string, string> = {
  goal: "⚽",
  card: "🟨",
  sub: "🔁",
  kickoff: "🏁",
  fulltime: "🔚",
  note: "📝",
};

function LiveMatchFeed({
  fixtureId,
  canManage,
}: {
  fixtureId: number;
  canManage: boolean;
}) {
  const [updates, setUpdates] = useState<
    { id: number; minute: string; eventType: string; message: string }[]
  >([]);
  const [loaded, setLoaded] = useState(false);
  const [minuteInput, setMinuteInput] = useState("");
  const [eventTypeInput, setEventTypeInput] = useState("note");
  const [messageInput, setMessageInput] = useState("");
  const [posting, setPosting] = useState(false);

  const loadUpdates = useCallback(async () => {
    const res = await getMatchUpdates(fixtureId);
    if (res.success) {
      setUpdates(res.updates as typeof updates);
    }
    setLoaded(true);
  }, [fixtureId]);

  useEffect(() => {
    loadUpdates();
    const interval = setInterval(loadUpdates, 20000);
    return () => clearInterval(interval);
  }, [loadUpdates]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minuteInput.trim() || !messageInput.trim()) return;

    setPosting(true);
    try {
      const res = await addMatchUpdate({
        fixtureId,
        minute: minuteInput.trim(),
        eventType: eventTypeInput,
        message: messageInput.trim(),
      });
      if (res.success) {
        setMinuteInput("");
        setMessageInput("");
        await loadUpdates();
      }
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setUpdates((prev) => prev.filter((u) => u.id !== id));
    await deleteMatchUpdate(id);
  };

  return (
    <div className="border-t border-rose-100 bg-white">
      {loaded && updates.length === 0 && !canManage ? null : (
        <div className="px-4 py-3 space-y-2 max-h-56 overflow-y-auto">
          {updates.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">
              No updates posted yet.
            </p>
          ) : (
            updates.map((u) => (
              <div key={u.id} className="flex items-start gap-2 text-xs group/update">
                <span className="shrink-0 font-black text-rose-600 tabular-nums w-10">
                  {u.minute}
                </span>
                <span className="shrink-0">{MATCH_EVENT_ICONS[u.eventType] || "📝"}</span>
                <span className="text-slate-700 flex-1">{u.message}</span>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleDelete(u.id)}
                    className="opacity-0 group-hover/update:opacity-100 text-slate-300 hover:text-rose-600 transition"
                    aria-label="Delete update"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {canManage && (
        <form
          onSubmit={handlePost}
          className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2 items-center"
        >
          <input
            type="text"
            placeholder="Min"
            value={minuteInput}
            onChange={(e) => setMinuteInput(e.target.value)}
            className="w-14 text-xs p-2 rounded-lg border border-slate-200 bg-white"
          />
          <select
            value={eventTypeInput}
            onChange={(e) => setEventTypeInput(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white"
          >
            <option value="note">Note</option>
            <option value="goal">Goal</option>
            <option value="card">Card</option>
            <option value="sub">Substitution</option>
            <option value="kickoff">Kick-off</option>
            <option value="fulltime">Full-time</option>
          </select>
          <input
            type="text"
            placeholder="What happened?"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            className="flex-1 min-w-[140px] text-xs p-2 rounded-lg border border-slate-200 bg-white"
          />
          <button
            type="submit"
            disabled={posting || !minuteInput.trim() || !messageInput.trim()}
            className="text-[10px] font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg disabled:opacity-50 cursor-pointer"
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </form>
      )}
    </div>
  );
}

type AdminBusyAction =
  | "player"
  | "management"
  | "fixture"
  | "news"
  | "gallery"
  | "highlights"
  | "merch"
  | "merch-clear"
  | "merch-price"
  | "merch-stock"
  | "merch-category"
  | "merch-details"
  | "replace-image"
  | "remove-image"
  | "bulk-photos"
  | null;

export default function ClubWebsite({
  initialData,
  initialTab = "home",
  initialNewsId = null,
  initialFixtureId = null,
  shareBaseUrl = "",
  initialTrackOrderId = "",
}: ClubWebsiteProps) {
  const [clubData, setClubData] = useState(initialData);
  const [adminBusy, setAdminBusy] = useState<AdminBusyAction>(null);
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>({});
  const [selectedShopItemId, setSelectedShopItemId] = useState<number | null>(null);
  const [viewingPlayerId, setViewingPlayerId] = useState<number | null>(null);
  const [viewingManagementId, setViewingManagementId] = useState<number | null>(null);
  const [explicitShopSizes, setExplicitShopSizes] = useState<Record<number, boolean>>({});
  const [newsPreviewOpen, setNewsPreviewOpen] = useState(false);
  const [bulkPhotoFiles, setBulkPhotoFiles] = useState<Record<string, File>>({});
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [highlightNewsId, setHighlightNewsId] = useState<number | null>(initialNewsId);
  const [highlightFixtureId, setHighlightFixtureId] = useState<number | null>(
    initialFixtureId
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isHeaderElevated, setIsHeaderElevated] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [galleryCarouselIndex, setGalleryCarouselIndex] = useState(0);
  const [galleryCarouselPaused, setGalleryCarouselPaused] = useState(false);
  const carouselDragStartRef = useRef<{ x: number; y: number } | null>(null);
  const carouselDidSwipeRef = useRef(false);

  useEffect(() => {
    setClubData(initialData);
  }, [initialData]);

  const carouselGallery = useMemo(
    () =>
      clubData.gallery
        .filter((item) => isUploadedMediaUrl(item.imageUrl))
        .slice(0, HOME_CAROUSEL_PHOTO_LIMIT),
    [clubData.gallery]
  );

  const safeGalleryCarouselIndex =
    carouselGallery.length === 0
      ? 0
      : Math.min(galleryCarouselIndex, carouselGallery.length - 1);

  const homeHighlights = useMemo(
    () =>
      (clubData.highlights ?? [])
        .filter((item) => isVideoMediaUrl(item.videoUrl))
        .slice(0, 3),
    [clubData.highlights]
  );

  const squadByPosition = useMemo(
    () => groupPlayersBySquadPosition(clubData.players),
    [clubData.players]
  );

  const squadPlayersSorted = useMemo(
    () =>
      [...clubData.players].sort((a, b) => a.jerseyNumber - b.jerseyNumber),
    [clubData.players]
  );

  const managementGrouped = useMemo(
    () => groupManagementByCategoryAndRole(clubData.management),
    [clubData.management]
  );

  const managementMembersSorted = useMemo(
    () => sortManagementMembers(clubData.management),
    [clubData.management]
  );

  const [matchTypeFilter, setMatchTypeFilter] = useState<"all" | MatchTypeValue>("all");
  const [squadSearchQuery, setSquadSearchQuery] = useState("");
  const [managementSearchQuery, setManagementSearchQuery] = useState("");

  const matchesSquadSearch = useCallback(
    (player: { name: string }) => {
      const q = squadSearchQuery.trim().toLowerCase();
      return !q || player.name.toLowerCase().includes(q);
    },
    [squadSearchQuery]
  );

  const squadJumpLinks = useMemo(() => {
    const links: { id: string; label: string; badge: string; isWazee?: boolean }[] = [];
    SQUAD_POSITION_GROUPS.forEach((group) => {
      if (group.id === "wazee") return;
      if ((squadByPosition.get(group.id) ?? []).length > 0) {
        links.push({ id: `squad-${group.id}`, label: group.heading, badge: group.badge });
      }
    });
    if ((squadByPosition.get("other") ?? []).length > 0) {
      links.push({ id: "squad-other", label: "Other Roles", badge: "?" });
    }
    const wazeeGroup = SQUAD_POSITION_GROUPS.find((group) => group.id === "wazee");
    if (wazeeGroup && (squadByPosition.get("wazee") ?? []).length > 0) {
      links.push({ id: "squad-wazee", label: wazeeGroup.heading, badge: wazeeGroup.badge, isWazee: true });
    }
    return links;
  }, [squadByPosition]);

  const matchesManagementSearch = useCallback(
    (member: { name: string; position: string }) => {
      const q = managementSearchQuery.trim().toLowerCase();
      return !q || member.name.toLowerCase().includes(q) || member.position.toLowerCase().includes(q);
    },
    [managementSearchQuery]
  );

  const filteredManagementGrouped = useMemo(
    () => groupManagementByCategoryAndRole(clubData.management.filter(matchesManagementSearch)),
    [clubData.management, matchesManagementSearch]
  );

  const managementJumpLinks = useMemo(() => {
    const links: { id: string; label: string; badge: string }[] = [];
    managementGrouped.forEach((section) => {
      section.roleGroups.forEach((roleGroup) => {
        if (roleGroup.members.length > 0) {
          links.push({ id: `mgmt-${roleGroup.id}`, label: roleGroup.heading, badge: roleGroup.badge });
        }
      });
      if (section.otherMembers.length > 0) {
        links.push({ id: `mgmt-${section.id}-other`, label: "Other Roles", badge: "?" });
      }
    });
    return links;
  }, [managementGrouped]);

  const todayString = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

  const mainSquadFixtures = useMemo(
    () => clubData.fixtures.filter((fixture) => normalizeSquadTeam(fixture.squadTeam) === "main"),
    [clubData.fixtures]
  );

  const wazeeFixtures = useMemo(
    () => clubData.fixtures.filter((fixture) => normalizeSquadTeam(fixture.squadTeam) === "wazee"),
    [clubData.fixtures]
  );

  const fixtureGroups = useMemo(
    () => partitionFixtures(mainSquadFixtures, todayString),
    [mainSquadFixtures, todayString]
  );

  const wazeeFixtureGroups = useMemo(
    () => partitionFixtures(wazeeFixtures, todayString),
    [wazeeFixtures, todayString]
  );

  const seasonStats = useMemo(
    () => getSeasonStats(mainSquadFixtures),
    [mainSquadFixtures]
  );

  const recentForm = useMemo(
    () =>
      getRecentForm(
        fixtureGroups.recent.filter((fixture) => isLeagueMatch(fixture)),
        5
      ),
    [fixtureGroups.recent]
  );

  const upcomingFixtures = fixtureGroups.upcoming;
  const recentFixtures = fixtureGroups.recent;

  const filterByMatchType = useCallback(
    <T extends { matchType?: string | null }>(fixtures: T[]) =>
      matchTypeFilter === "all"
        ? fixtures
        : fixtures.filter((fixture) => normalizeMatchType(fixture.matchType) === matchTypeFilter),
    [matchTypeFilter]
  );

  const filteredUpcomingRest = useMemo(
    () => filterByMatchType(fixtureGroups.upcomingRest),
    [filterByMatchType, fixtureGroups.upcomingRest]
  );

  const filteredRecentFixtures = useMemo(
    () => filterByMatchType(recentFixtures),
    [filterByMatchType, recentFixtures]
  );

  useEffect(() => {
    const closeMenuOnDesktop = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", closeMenuOnDesktop);
    return () => window.removeEventListener("resize", closeMenuOnDesktop);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderElevated(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Automatically rotate homepage gallery every 4 seconds
useEffect(() => {
  if (carouselGallery.length <= 1 || galleryCarouselPaused) return;

  const interval = setInterval(() => {
    setGalleryCarouselIndex((current) =>
      current === carouselGallery.length - 1
        ? 0
        : current + 1
    );
  }, 4000);

  return () => clearInterval(interval);
}, [carouselGallery.length, galleryCarouselPaused]);

  const goToPrevCarouselSlide = useCallback(() => {
    setGalleryCarouselIndex((current) =>
      current === 0 ? carouselGallery.length - 1 : current - 1
    );
  }, [carouselGallery.length]);

  const goToNextCarouselSlide = useCallback(() => {
    setGalleryCarouselIndex((current) =>
      current === carouselGallery.length - 1 ? 0 : current + 1
    );
  }, [carouselGallery.length]);

  const handleCarouselDragStart = useCallback((x: number, y: number) => {
    carouselDragStartRef.current = { x, y };
  }, []);

  const handleCarouselDragEnd = useCallback(
    (x: number, y: number) => {
      const start = carouselDragStartRef.current;
      carouselDragStartRef.current = null;
      if (!start) return;

      const deltaX = x - start.x;
      const deltaY = y - start.y;

      // Ignore mostly-vertical gestures (scrolling) and tiny/accidental drags.
      if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;

      carouselDidSwipeRef.current = true;
      if (deltaX > 0) {
        goToPrevCarouselSlide();
      } else {
        goToNextCarouselSlide();
      }
    },
    [goToPrevCarouselSlide, goToNextCarouselSlide]
  );

  // Gallery filter state
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>("All");
  const [selectedGalleryImage, setSelectedGalleryImage] =
  useState<GalleryItem | null>(null);
 

  // Form states
  const [donationAmount, setDonationAmount] = useState<number>(1500);
  const [customDonation, setCustomDonation] = useState<string>("");
  const [donationCurrency, setDonationCurrency] = useState<DonationCurrencyCode>("KES");
  const [donorName, setDonorName] = useState<string>("");
  const [donationMessage, setDonationMessage] = useState<string>("");
  const [donationPurpose, setDonationPurpose] = useState<string>("Boots & Equipment");
  const [donationPhone, setDonationPhone] = useState<string>("");
  const [donationPaymentMessage, setDonationPaymentMessage] = useState<string>("");
  const [donationPaymentPending, setDonationPaymentPending] = useState<boolean>(false);

  const selectedDonationAmount = useMemo(() => {
    const custom = customDonation ? parseFloat(customDonation) : NaN;
    if (Number.isFinite(custom) && custom > 0) return custom;
    return donationAmount > 0 ? donationAmount : null;
  }, [customDonation, donationAmount]);

  const [fanName, setFanName] = useState<string>("");
  const [fanText, setFanText] = useState<string>("");

  // Checkout states
  const [checkoutName, setCheckoutName] = useState<string>("");
  const [checkoutDeliveryAddress, setCheckoutDeliveryAddress] = useState<string>("");
  const [checkoutNote, setCheckoutNote] = useState<string>("");
  const [checkoutPhone, setCheckoutPhone] = useState<string>("");
  const [checkoutMethod, setCheckoutMethod] = useState<"mpesa" | "cash">("mpesa");
  const [cartCustomizations, setCartCustomizations] = useState<
    Record<string, JerseyCustomizationState>
  >({});
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string>("");
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);

  const [trackOrderId, setTrackOrderId] = useState<string>(initialTrackOrderId);
  const [trackPhone, setTrackPhone] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("order") || params.get("news") || params.get("fixture")) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeTab !== "news" && activeTab !== "fixtures") return;

    const targetId = highlightNewsId
      ? `news-${highlightNewsId}`
      : highlightFixtureId
        ? `fixture-${highlightFixtureId}`
        : null;

    if (!targetId) return;

    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [activeTab, highlightNewsId, highlightFixtureId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get("order");

    params.delete("tab");
    params.delete("news");
    params.delete("fixture");

    if (activeTab === "account" && orderParam) {
      params.set("order", orderParam);
    } else if (activeTab !== "home") {
      params.set("tab", activeTab);
    }

    if (highlightNewsId && activeTab === "news") {
      params.set("news", String(highlightNewsId));
    }

    if (highlightFixtureId && activeTab === "fixtures") {
      params.set("fixture", String(highlightFixtureId));
    }

    const qs = params.toString();
    const nextUrl = qs
      ? `${window.location.pathname}?${qs}`
      : window.location.pathname;

    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [activeTab, highlightNewsId, highlightFixtureId]);
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null);
  const [trackError, setTrackError] = useState<string>("");

  const [customerProfile, setCustomerProfile] = useState<{
    id: number;
    fullName: string;
    phoneNumber: string;
    email: string | null;
  } | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [isLoadingCustomerOrders, setIsLoadingCustomerOrders] = useState(false);
  const [accountView, setAccountView] = useState<"login" | "register">("login");
  const [pendingCheckoutAfterAuth, setPendingCheckoutAfterAuth] = useState(false);
  const [pendingMembershipAfterAuth, setPendingMembershipAfterAuth] = useState(false);
  const [fanMembership, setFanMembership] = useState<FanMembership | null>(null);
  const [selectedMembershipPlanId, setSelectedMembershipPlanId] =
    useState<MembershipPlanId>("official");
  const [membershipPhone, setMembershipPhone] = useState("");
  const [membershipPaymentMessage, setMembershipPaymentMessage] = useState("");
  const [membershipPaymentPending, setMembershipPaymentPending] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "confirm">("request");
  const [showFanPasswordReset, setShowFanPasswordReset] = useState(false);
  const [isFanResetPending, setIsFanResetPending] = useState(false);
  const [resetPhone, setResetPhone] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [expandedAccountOrderId, setExpandedAccountOrderId] = useState<number | null>(null);
  const customerOrdersLoadRef = useRef(false);
  const skipInitialTabScrollRef = useRef(true);
  const [customerMessages, setCustomerMessages] = useState<
    Array<{
      id: number;
      senderType: string;
      message: string;
      createdAt: string;
    }>
  >([]);
  const [customerMessageDraft, setCustomerMessageDraft] = useState("");
  const [isLoadingCustomerMessages, setIsLoadingCustomerMessages] = useState(false);
  const [isSendingCustomerMessage, setIsSendingCustomerMessage] = useState(false);

  // Admin states
  const [staffLoginMode, setStaffLoginMode] = useState<"admin" | "press">("admin");
  const [newspaperLoginPassword, setNewspaperLoginPassword] = useState<string>("");
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [adminResetStep, setAdminResetStep] = useState<"request" | "confirm">("request");
  const [showAdminPasswordReset, setShowAdminPasswordReset] = useState(false);
  const [isAdminResetPending, setIsAdminResetPending] = useState(false);
  const [adminResetPhone, setAdminResetPhone] = useState("");
  const [adminResetCode, setAdminResetCode] = useState("");
  const [adminResetNewPassword, setAdminResetNewPassword] = useState("");
  const [adminResetConfirmPassword, setAdminResetConfirmPassword] = useState("");
  const [showNewspaperPasswordReset, setShowNewspaperPasswordReset] = useState(false);
  const [listedShopItemsOpen, setListedShopItemsOpen] = useState(false);
  const [playerPanelOpen, setPlayerPanelOpen] = useState(false);
  const [managementPanelOpen, setManagementPanelOpen] = useState(false);
  const [squadUpdatesOpen, setSquadUpdatesOpen] = useState(false);
  const [managementUpdatesOpen, setManagementUpdatesOpen] = useState(false);
  const [bulkPhotosOpen, setBulkPhotosOpen] = useState(false);
  const [adminPanelsHydrated, setAdminPanelsHydrated] = useState(false);
  const [publishedHighlightsOpen, setPublishedHighlightsOpen] = useState(false);
  const [newspaperResetAdminPassword, setNewspaperResetAdminPassword] = useState("");
  const [newspaperResetNewPassword, setNewspaperResetNewPassword] = useState("");
  const [newspaperResetConfirmPassword, setNewspaperResetConfirmPassword] = useState("");
  const [isNewspaperResetPending, setIsNewspaperResetPending] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const adminSessionRequestIdRef = useRef(0);
  const [adminRole, setAdminRole] = useState<"admin" | "news_editor" | null>(null);
  const canManageClubContent = adminRole === "admin";
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [adminMemberships, setAdminMemberships] = useState<
    {
      id: number;
      customerId: number;
      fullName: string;
      phoneNumber: string;
      planId: string;
      planName: string;
      amount: number;
      paymentMethod: string;
      paymentStatus: string;
      status: AdminMembershipStatus;
      mpesaReceiptNumber: string | null;
      expiresAt: string;
      createdAt: string;
    }[]
  >([]);
  const [isLoadingMemberships, setIsLoadingMemberships] = useState(false);
  const [membershipSearch, setMembershipSearch] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<
    "all" | AdminMembershipStatus
  >("all");
  const [adminMemberName, setAdminMemberName] = useState("");
  const [adminMemberPhone, setAdminMemberPhone] = useState("");
  const [adminMemberPlanId, setAdminMemberPlanId] =
    useState<MembershipPlanId>("official");
  const [revokingMembershipId, setRevokingMembershipId] = useState<number | null>(
    null
  );
  const [adminArchivedOrders, setAdminArchivedOrders] = useState<any[]>([]);
  const [adminUnseenOrderCount, setAdminUnseenOrderCount] = useState(0);
  const [showArchivedOrders, setShowArchivedOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
const [adminInboxThreads, setAdminInboxThreads] = useState<
  Array<{
    customerId: number;
    fullName: string;
    phoneNumber: string;
    email: string | null;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
  }>
>([]);
const [selectedInboxCustomerId, setSelectedInboxCustomerId] = useState<number | null>(null);
const [selectedInboxCustomer, setSelectedInboxCustomer] = useState<{
  id: number;
  fullName: string;
  phoneNumber: string;
  email: string | null;
} | null>(null);
const [adminInboxMessages, setAdminInboxMessages] = useState<
  Array<{
    id: number;
    senderType: string;
    message: string;
    createdAt: string;
  }>
>([]);
const [adminReplyDraft, setAdminReplyDraft] = useState("");
const [isLoadingAdminInbox, setIsLoadingAdminInbox] = useState(false);
const [isSendingAdminReply, setIsSendingAdminReply] = useState(false);
const [orderFilter, setOrderFilter] = useState<
  "all" | "paid" | "pending" | "failed"
>("all");

const [orderSearch, setOrderSearch] = useState<string>("");
const [adminPanelView, setAdminPanelView] = useState<"content" | "inbox" | "orders" | "members">("content");
const [notificationConfig, setNotificationConfig] = useState<{
  channels: string[];
  sms: boolean;
  smsLive: boolean;
  whatsapp: boolean;
  whatsappLive: boolean;
  whatsappPhone?: string;
  whatsappProvider?: "meta" | "africas_talking" | "log" | null;
  whatsappProviderPreference?: "meta" | "africas_talking" | "auto";
  metaTemplateConfigured?: boolean;
  whatsappLogMode?: boolean;
  trackingUrlConfigured: boolean;
  buyerNotificationsLive: boolean;
  adminAlertPhones: number;
  adminAlertsLive: boolean;
} | null>(null);

  const adminOrderStats = useMemo(() => {
    const paidOrders = adminOrders.filter(
      (order) => String(order.paymentStatus || "").toLowerCase() === "paid"
    );
    const pendingOrders = adminOrders.filter(
      (order) => String(order.paymentStatus || "").toLowerCase() === "pending"
    );
    const failedOrders = adminOrders.filter(
      (order) => String(order.paymentStatus || "").toLowerCase() === "failed"
    );
    const totalSales = paidOrders.reduce(
      (total, order) => total + Number(order.totalAmount || 0),
      0
    );

    return {
      totalOrders: adminOrders.length,
      paidCount: paidOrders.length,
      pendingCount: pendingOrders.length,
      failedCount: failedOrders.length,
      totalSales,
    };
  }, [adminOrders]);

  const adminMembershipStats = useMemo(() => {
    const active = adminMemberships.filter((row) => row.status === "active");
    return {
      total: adminMemberships.length,
      activeCount: active.length,
      expiredCount: adminMemberships.filter((row) => row.status === "expired").length,
      pendingCount: adminMemberships.filter((row) => row.status === "pending").length,
      revokedCount: adminMemberships.filter((row) => row.status === "revoked").length,
      activeRevenue: active.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    };
  }, [adminMemberships]);

  const visibleAdminMemberships = useMemo(() => {
    const query = membershipSearch.trim().toLowerCase();
    return adminMemberships.filter((row) => {
      if (membershipFilter !== "all" && row.status !== membershipFilter) {
        return false;
      }
      if (!query) return true;
      return (
        row.fullName.toLowerCase().includes(query) ||
        row.phoneNumber.toLowerCase().includes(query) ||
        row.planName.toLowerCase().includes(query) ||
        String(row.id).includes(query)
      );
    });
  }, [adminMemberships, membershipFilter, membershipSearch]);
  
  const [adminPlayerName, setAdminPlayerName] = useState<string>("");
  const [adminPlayerPos, setAdminPlayerPos] = useState<string>("Centre Back");
  const [adminPlayerJersey, setAdminPlayerJersey] = useState<string>("");
  const [adminPlayerBio, setAdminPlayerBio] = useState<string>("");
  const [adminPlayerApps, setAdminPlayerApps] = useState<string>("0");
  const [adminPlayerGoals, setAdminPlayerGoals] = useState<string>("0");
  const [adminPlayerAssists, setAdminPlayerAssists] = useState<string>("0");
  const [adminPlayerFile, setAdminPlayerFile] = useState<File | null>(null);
  const [updatingPlayerPositionId, setUpdatingPlayerPositionId] = useState<number | null>(null);
  const [updatingPlayerJerseyId, setUpdatingPlayerJerseyId] = useState<number | null>(null);

  const [adminOpponent, setAdminOpponent] = useState<string>("");
  const [adminOpponentLogoFile, setAdminOpponentLogoFile] = useState<File | null>(null);
  const [adminOpponentLogoUrl, setAdminOpponentLogoUrl] = useState<string>("");
  const [adminMatchDate, setAdminMatchDate] = useState<string>("");
  const [adminMatchTime, setAdminMatchTime] = useState<string>("");
  const [adminIsHome, setAdminIsHome] = useState<boolean>(true);
  const [adminVenue, setAdminVenue] = useState<string>(HOME_GROUND.fullAddress);
  const [adminHomeScore, setAdminHomeScore] = useState<string>("");
  const [adminAwayScore, setAdminAwayScore] = useState<string>("");
  const [adminStatus, setAdminStatus] = useState<string>("upcoming");
  const [adminMatchType, setAdminMatchType] = useState<string>("league");
  const [adminSquadTeam, setAdminSquadTeam] = useState<string>("main");
  const [editingFixtureId, setEditingFixtureId] = useState<number | null>(null);

  const [adminNewsTitle, setAdminNewsTitle] = useState<string>("");
  const [adminNewsSummary, setAdminNewsSummary] = useState<string>("");
  const [adminNewsContent, setAdminNewsContent] = useState<string>("");
  const [adminNewsFile, setAdminNewsFile] = useState<File | null>(null);

  const [adminGalleryFile, setAdminGalleryFile] = useState<File | null>(null);
  const [adminGalleryPreview, setAdminGalleryPreview] = useState<string | null>(null);
  const [adminGalleryCaption, setAdminGalleryCaption] = useState<string>("");
  const [adminGalleryCategory, setAdminGalleryCategory] =
    useState<string>("Training");
  const [adminHighlightVideoFile, setAdminHighlightVideoFile] = useState<File | null>(null);
  const [adminHighlightVideoPreview, setAdminHighlightVideoPreview] = useState<string | null>(null);
  const [adminHighlightThumbFile, setAdminHighlightThumbFile] = useState<File | null>(null);
  const [adminHighlightThumbPreview, setAdminHighlightThumbPreview] = useState<string | null>(null);
  const [adminHighlightTitle, setAdminHighlightTitle] = useState("");
  const [adminHighlightDescription, setAdminHighlightDescription] = useState("");
  const [adminHighlightCategory, setAdminHighlightCategory] =
    useState<string>("Match Highlights");
  const [selectedHighlightCategory, setSelectedHighlightCategory] = useState("All");
  const [activeHighlight, setActiveHighlight] = useState<TeamHighlight | null>(null);

useEffect(() => {
  return () => {
    if (adminGalleryPreview) {
      URL.revokeObjectURL(adminGalleryPreview);
    }
  };
}, [adminGalleryPreview]);

useEffect(() => {
  return () => {
    if (adminHighlightVideoPreview) {
      URL.revokeObjectURL(adminHighlightVideoPreview);
    }
    if (adminHighlightThumbPreview) {
      URL.revokeObjectURL(adminHighlightThumbPreview);
    }
  };
}, [adminHighlightVideoPreview, adminHighlightThumbPreview]);

    // Management admin states
const [adminManagementName, setAdminManagementName] = useState<string>("");
const [adminManagementPosition, setAdminManagementPosition] = useState<string>("Chairman");
const [adminManagementCategory, setAdminManagementCategory] = useState<string>("Club Leadership");
const [adminManagementBio, setAdminManagementBio] = useState<string>("");
const [adminManagementResponsibilities, setAdminManagementResponsibilities] = useState<string>("");
const [adminManagementOrder, setAdminManagementOrder] = useState<string>("0");
const [adminManagementFile, setAdminManagementFile] = useState<File | null>(null);
const [editingManagementId, setEditingManagementId] = useState<number | null>(null);
const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
const [updatingPlayerNameId, setUpdatingPlayerNameId] = useState<number | null>(null);
const [updatingManagementNameId, setUpdatingManagementNameId] = useState<number | null>(null);
const [updatingManagementRoleId, setUpdatingManagementRoleId] = useState<number | null>(null);
  // Merchandise admin state
  const [adminMerchName, setAdminMerchName] = useState<string>("");
  const [adminMerchDesc, setAdminMerchDesc] = useState<string>("");
  const [adminMerchPrice, setAdminMerchPrice] = useState<string>("");
  const [adminMerchFile, setAdminMerchFile] = useState<File | null>(null);
  const [adminMerchSizes, setAdminMerchSizes] = useState<string>("S, M, L, XL");
  const [adminMerchType, setAdminMerchType] = useState<string>("jersey");
  const [adminMerchStockStatus, setAdminMerchStockStatus] = useState<string>("available");
  const [selectedShopCategory, setSelectedShopCategory] = useState<string>("All");
  const [editingMerchPriceId, setEditingMerchPriceId] = useState<number | null>(null);
  const [merchPriceDraft, setMerchPriceDraft] = useState<string>("");
  const [merchAdminPriceDrafts, setMerchAdminPriceDrafts] = useState<Record<number, string>>({});

  // Image replace modal state
  const [replaceImageId, setReplaceImageId] = useState<number | null>(null);
  const [replaceImageType, setReplaceImageType] = useState<
    "player" | "management" | "gallery" | "news" | "merch"
  >("gallery");
  const [replaceImageFile, setReplaceImageFile] = useState<File | null>(null);
  const [replaceImageNewCaption, setReplaceImageNewCaption] = useState<string>("");
  const [replaceImageCurrentUrl, setReplaceImageCurrentUrl] = useState<string>("");

  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 6000);
    
  };

  // Upload an image selected from the computer to Supabase Storage.
  const uploadSelectedImage = async (file: File, folder: "gallery" | "news" | "merch" | "players" | "management" | "fixtures") => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Please select an image file.");
    }
    if (file.size > MEDIA_UPLOAD_RULES.maxFileSizeBytes) {
      throw new Error(`Image is too large. Please choose an image under ${MEDIA_UPLOAD_RULES.maxFileSizeLabel}.`);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || "Image upload failed.");
    }

    return result.url as string;
  };

  const uploadSelectedVideo = async (file: File) => {
    if (!file.type.startsWith("video/")) {
      throw new Error("Please select a video file (MP4, MOV, or WEBM).");
    }
    if (file.size > VIDEO_UPLOAD_RULES.maxFileSizeBytes) {
      throw new Error(`Video is too large. Maximum size is ${VIDEO_UPLOAD_RULES.maxFileSizeLabel}.`);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "highlights");
    formData.append("mediaType", "video");

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.error || "Video upload failed.");
    }

    return result.url as string;
  };

  // Add item to cart
  const addToCart = (item: MerchandiseItem, size: string) => {
    if (!isMerchandiseAvailable(item.stockStatus)) {
      showToast(
        getMerchandiseStockStatusMeta(item.stockStatus).label === "Out of Stock"
          ? "This item is currently out of stock."
          : "This item will be updated soon and is not available to order yet.",
        "error"
      );
      return;
    }

    const displayName = getImprovedMerchandiseCopy(item).name;
    const existingIndex = cart.findIndex((i) => i.merchId === item.id && i.size === size);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          merchId: item.id,
          name: displayName,
          price: item.price,
          size: size,
          quantity: 1,
          kitType: item.kitType,
        },
      ]);
    }
    showToast(`Added ${displayName} (${size}) to shopping cart!`);
  };

  const hasRealPassportPhoto = (imageUrl?: string | null) => {
    const trimmed = imageUrl?.trim() ?? "";
    if (!trimmed || /placeholder/i.test(trimmed)) return false;
    return isUploadedMediaUrl(trimmed) || trimmed.startsWith("/") || trimmed.startsWith("./");
  };

  const handleBulkPassportUploads = async (kind: "player" | "management") => {
    const prefix = `${kind}-`;
    const assignments = Object.entries(bulkPhotoFiles).filter(([key, file]) =>
      key.startsWith(prefix) && file
    );

    if (assignments.length === 0) {
      showToast("Choose at least one photo to upload.", "error");
      return;
    }

    setAdminBusy("bulk-photos");
    try {
      let uploaded = 0;
      for (const [key, file] of assignments) {
        const id = Number(key.slice(prefix.length));
        const imageUrl = await uploadSelectedImage(
          file,
          kind === "player" ? "players" : "management"
        );

        if (kind === "player") {
          const res = await updatePlayerImage(id, imageUrl);
          if (res.success && res.player) {
            setClubData((prev) => ({
              ...prev,
              players: prev.players.map((player) =>
                player.id === res.player.id ? res.player : player
              ),
            }));
            uploaded += 1;
          }
        } else {
          const res = await updateManagementImage(id, imageUrl);
          if (res.success && res.member) {
            setClubData((prev) => ({
              ...prev,
              management: prev.management.map((member) =>
                member.id === res.member.id ? res.member : member
              ),
            }));
            uploaded += 1;
          }
        }
      }

      setBulkPhotoFiles((prev) => {
        const next = { ...prev };
        for (const [key] of assignments) {
          delete next[key];
        }
        return next;
      });
      showToast(`Uploaded ${uploaded} passport photo${uploaded === 1 ? "" : "s"}.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Bulk photo upload failed.", "error");
    } finally {
      setAdminBusy(null);
    }
  };

  const removeFromCart = (merchId: number, size: string) => {
    setCart(cart.filter((i) => !(i.merchId === merchId && i.size === size)));
  };

  const cartTotal = cart.reduce((sum, item) => {
    const unitPrice = fanMembership ? applyMemberUnitPrice(item.price) : item.price;
    return sum + unitPrice * item.quantity;
  }, 0);
  const cartSavings = fanMembership
    ? cart.reduce((sum, item) => sum + item.price * item.quantity, 0) - cartTotal
    : 0;

  const formatShopPrice = (price: number, className = "") => {
    if (!fanMembership) {
      return <span className={className}>Ksh {price.toLocaleString()}</span>;
    }

    const memberPrice = applyMemberUnitPrice(price);
    return (
      <span className={className}>
        <span className="mr-1.5 line-through font-semibold text-slate-400">
          Ksh {price.toLocaleString()}
        </span>
        Ksh {memberPrice.toLocaleString()}
      </span>
    );
  };
  const cartJerseyItems = useMemo(
    () => cart.filter((item) => isJerseyMerchandise(item.kitType)),
    [cart]
  );

  const updateCartCustomization = (
    key: string,
    updates: Partial<JerseyCustomizationState>
  ) => {
    setCartCustomizations((prev) => ({
      ...prev,
      [key]: {
        jerseyNameOption: prev[key]?.jerseyNameOption ?? "none",
        jerseyName: prev[key]?.jerseyName ?? "",
        ...updates,
      },
    }));
  };

  const buildCheckoutCartPayload = () =>
    cart.map((item) => {
      const key = getCartItemKey(item);
      const customizationState = cartCustomizations[key];

      return {
        merchId: item.merchId,
        name: item.name,
        price: item.price,
        size: item.size,
        quantity: item.quantity,
        kitType: item.kitType,
        itemCustomization: isJerseyMerchandise(item.kitType)
          ? formatJerseyCustomization(
              customizationState?.jerseyNameOption || "none",
              customizationState?.jerseyName
            )
          : null,
      };
    });

  const validateJerseyCustomizations = () => {
    for (const item of cartJerseyItems) {
      const key = getCartItemKey(item);
      const state = cartCustomizations[key];

      if (state?.jerseyNameOption === "name" && !state.jerseyName.trim()) {
        showToast(`Enter the name to print on ${item.name} (${item.size}).`, "error");
        return false;
      }
    }

    return true;
  };

  const refreshDonations = async () => {
    const result = await getClubData();
    if (result.success && result.donations) {
      setClubData((prev) => ({ ...prev, donations: result.donations }));
    }
  };

  // Submit donation handler
  const handleDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCustom = customDonation ? parseFloat(customDonation) : NaN;
    const finalAmount = customDonation ? parsedCustom : donationAmount;
    if (!donorName) {
      showToast("Please enter your name", "error");
      return;
    }
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    if (donationCurrency === "KES") {
      if (!donationPhone.trim()) {
        showToast("Please enter your M-Pesa phone number.", "error");
        return;
      }

      startTransition(async () => {
        setDonationPaymentPending(true);
        setDonationPaymentMessage("");

        try {
          const response = await fetch("/api/mpesa/donation-stkpush", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: donationPhone,
              amount: finalAmount,
              donorName,
              message: donationMessage,
              purpose: donationPurpose,
              currency: "KES",
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            showToast(data.error || "Unable to initiate M-Pesa payment.", "error");
            setDonationPaymentPending(false);
            return;
          }

          const donationId = data.donationId;
          setDonationPaymentMessage(
            `M-Pesa payment request sent to ${donationPhone}. Enter your PIN on your phone to complete ${formatDonationAmount(finalAmount, "KES")}.`
          );

          let attempts = 0;
          const maxAttempts = 30;

          const checkDonationStatus = async () => {
            attempts++;

            try {
              const statusResponse = await fetch(
                `/api/mpesa/donation-status?donationId=${donationId}&phone=${encodeURIComponent(donationPhone)}`,
                { method: "GET", cache: "no-store", credentials: "include" }
              );
              const statusData = await statusResponse.json();

              if (statusResponse.ok && statusData.success) {
                if (statusData.paymentStatus === "paid") {
                  setDonationPaymentMessage(
                    `Thank you! Payment confirmed. M-Pesa receipt: ${statusData.mpesaReceiptNumber || "confirmed"}.`
                  );
                  showToast("Donation received — thank you for supporting Kariobangi Legends!");
                  setDonorName("");
                  setDonationMessage("");
                  setCustomDonation("");
                  setDonationPhone("");
                  setDonationAmount(getDefaultDonationAmount("KES"));
                  await refreshDonations();
                  setDonationPaymentPending(false);
                  return;
                }

                if (statusData.paymentStatus === "failed") {
                  setDonationPaymentMessage("");
                  showToast("M-Pesa payment was cancelled or failed. Please try again.", "error");
                  setDonationPaymentPending(false);
                  return;
                }
              }

              if (attempts < maxAttempts) {
                setTimeout(checkDonationStatus, 3000);
              } else {
                setDonationPaymentMessage(
                  "Your M-Pesa payment is still processing. We will add your gift to the honor board once confirmed."
                );
                setDonationPaymentPending(false);
              }
            } catch {
              if (attempts < maxAttempts) {
                setTimeout(checkDonationStatus, 3000);
              } else {
                setDonationPaymentPending(false);
              }
            }
          };

          setTimeout(checkDonationStatus, 3000);
        } catch {
          showToast("Unable to initiate M-Pesa payment.", "error");
          setDonationPaymentPending(false);
        }
      });

      return;
    }

    startTransition(async () => {
      const res = await submitDonation({
        donorName,
        amount: finalAmount,
        currency: donationCurrency,
        message: donationMessage,
        purpose: donationPurpose,
      });

      if (res.success) {
        const formattedAmount = formatDonationAmount(finalAmount, donationCurrency);
        showToast(
          res.message ||
            `Thank you! Your ${formattedAmount} pledge is recorded. Email ${CONTACT_CENTER.email} for international payment details.`
        );
        setDonorName("");
        setDonationMessage("");
        setCustomDonation("");
        setDonationAmount(getDefaultDonationAmount(donationCurrency));
        await refreshDonations();
      } else {
        showToast(res.error || "Something went wrong", "error");
      }
    });
  };

  // Submit fan message
  const handleFanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fanName || !fanText) {
      showToast("Please fill in both name and message", "error");
      return;
    }

    startTransition(async () => {
      const res = await submitFanMessage({
        name: fanName,
        message: fanText,
      });

      if (res.success) {
        showToast(res.message || "Message posted on the Fan Board!");
        setFanName("");
        setFanText("");
      } else {
        showToast(res.error || "Failed to submit message", "error");
      }
    });
  };

  const completeCheckoutOrder = (orderId: number, message: string) => {
    setCheckoutMessage(message);
    setCheckoutSuccess(true);
    setLastOrderId(orderId);
    setTrackOrderId(String(orderId));
    setTrackPhone(checkoutPhone);
    setCart([]);
    setCartCustomizations({});
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (!customerProfile) {
    setIsCartOpen(true);
    showToast("Sign in or register in your cart to checkout.", "error");
    return;
  }

  if (!checkoutName) {
    showToast("Please enter your name for delivery.", "error");
    return;
  }

  if (!checkoutDeliveryAddress.trim()) {
    showToast("Please enter your delivery address.", "error");
    return;
  }

  if (cart.length === 0) {
    showToast("Your cart is empty.", "error");
    return;
  }

  if (!validateJerseyCustomizations()) {
    return;
  }

  if (!checkoutPhone.trim()) {
    showToast(
      checkoutMethod === "mpesa"
        ? "Please enter your M-PESA phone number."
        : "Please enter your contact phone number.",
      "error"
    );
    return;
  }

  const checkoutCart = buildCheckoutCartPayload();

  if (checkoutMethod === "cash") {
    startTransition(async () => {
      try {
        const response = await fetch("/api/orders/cash-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: checkoutPhone,
            amount: cartTotal,
            name: checkoutName,
            deliveryAddress: checkoutDeliveryAddress.trim(),
            note: checkoutNote.trim(),
            cart: checkoutCart,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          if (response.status === 401) {
            showToast("Sign in again in your cart to complete checkout.", "error");
          }
          showToast(data.error || "Unable to place cash order.", "error");
          return;
        }

        if (!data.orderId) {
          showToast("Order placed, but the order ID was not returned.", "error");
          return;
        }

        completeCheckoutOrder(
          data.orderId,
          `Cash order #${data.orderId} placed successfully. Pay Ksh ${cartTotal.toLocaleString()} in cash when your order is delivered or collected.`
        );
      } catch (error) {
        console.error("Cash checkout error:", error);
        showToast("Unable to place cash order right now.", "error");
      }
    });

    return;
  }

  if (checkoutMethod === "mpesa") {
    startTransition(async () => {
      try {
        const response = await fetch("/api/mpesa/stkpush", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: checkoutPhone,
            amount: cartTotal,
            name: checkoutName,
            deliveryAddress: checkoutDeliveryAddress.trim(),
            note: checkoutNote.trim(),
            cart: checkoutCart,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          if (response.status === 401) {
            showToast("Sign in again in your cart to complete checkout.", "error");
          }
          showToast(
            data.error || "Unable to initiate M-PESA payment.",
            "error"
          );
          return;
        }

        const orderId = data.orderId;

        if (!orderId) {
          showToast(
            "Payment started, but the order ID was not returned.",
            "error"
          );
          return;
        }

        setCheckoutMessage(
          `M-PESA payment request sent to ${checkoutPhone}. Please check your phone and enter your M-PESA PIN to complete the payment of Ksh ${cartTotal.toLocaleString()}.`
        );

        setCheckoutSuccess(true);

        // --------------------------------------------------
        // CHECK PAYMENT STATUS
        // --------------------------------------------------

        let attempts = 0;
        const maxAttempts = 30;

        const checkPaymentStatus = async () => {
          attempts++;

          try {
            const statusResponse = await fetch(
              `/api/mpesa/status?orderId=${orderId}&phone=${encodeURIComponent(checkoutPhone)}`,
              {
                method: "GET",
                cache: "no-store",
                credentials: "include",
              }
            );

            const statusData =
              await statusResponse.json();

            if (
              statusResponse.ok &&
              statusData.success
            ) {
              if (
                statusData.paymentStatus === "paid"
              ) {
                completeCheckoutOrder(
                  orderId,
                  `Payment successful! Your M-PESA receipt number is ${statusData.mpesaReceiptNumber || "confirmed"}. Your Kariobangi Legends merchandise order #${orderId} has been received and will be processed shortly.`
                );

                return;
              }

              if (
                statusData.paymentStatus === "failed"
              ) {
                setCheckoutSuccess(false);

                showToast(
                  "M-PESA payment was cancelled or failed. Please try again.",
                  "error"
                );

                return;
              }
            }

            if (attempts < maxAttempts) {
              setTimeout(
                checkPaymentStatus,
                3000
              );
            } else {
              setCheckoutMessage(
                `Your M-PESA payment request is still being processed. Please check your M-PESA messages. Your order reference is #${orderId}.`
              );
              setLastOrderId(orderId);
              setTrackOrderId(String(orderId));
              setTrackPhone(checkoutPhone);
            }
          } catch (statusError) {
            console.error(
              "M-PESA status check failed:",
              statusError
            );

            if (attempts < maxAttempts) {
              setTimeout(
                checkPaymentStatus,
                3000
              );
            }
          }
        };

        setTimeout(
          checkPaymentStatus,
          3000
        );
      } catch (error) {
        console.error(
          "M-PESA checkout error:",
          error
        );

        showToast(
          error instanceof Error
            ? error.message
            : "Unable to connect to M-PESA.",
          "error"
        );
      }
    });

    return;
  }
};

const loadAdminOrders = async () => {
  setIsLoadingOrders(true);

  try {
    const [result, notificationSetup] = await Promise.all([
      getOrders(),
      getNotificationSetup(),
    ]);

    if (result.success) {
      setAdminOrders(result.orders || []);
      setAdminArchivedOrders(result.archivedOrders || []);
      setAdminUnseenOrderCount(result.unseenCount ?? 0);
    } else {
      console.error("Unable to load admin orders:", result.error);
      showToast(result.error || "Unable to load orders.", "error");
    }

    if (notificationSetup.success) {
      setNotificationConfig(notificationSetup.config);
    }
  } catch (error) {
    console.error("Load admin orders failed:", error);
    showToast("Unable to retrieve customer orders.", "error");
  } finally {
    setIsLoadingOrders(false);
  }
};

const loadAdminMemberships = async () => {
  setIsLoadingMemberships(true);

  try {
    const result = await getMemberships();
    if (result.success) {
      setAdminMemberships(result.memberships || []);
    } else {
      setAdminMemberships([]);
      showToast(result.error || "Unable to load memberships.", "error");
    }
  } catch (error) {
    console.error("Load admin memberships failed:", error);
    setAdminMemberships([]);
    showToast("Unable to load memberships.", "error");
  } finally {
    setIsLoadingMemberships(false);
  }
};

const handleAddAdminMembership = async (e: React.FormEvent) => {
  e.preventDefault();

  startTransition(async () => {
    const result = await addAdminMembership({
      fullName: adminMemberName,
      phone: adminMemberPhone,
      planId: adminMemberPlanId,
    });

    if (!result.success) {
      showToast(result.error || "Unable to add this member.", "error");
      return;
    }

    setAdminMemberName("");
    setAdminMemberPhone("");
    setAdminMemberPlanId("official");
    await loadAdminMemberships();
    showToast(
      result.createdAccount
        ? "Member added. They can set a password with Forgot password using this phone."
        : "Member added. Their digital card is now in My Account."
    );
  });
};

const handleRevokeMembership = async (membership: {
  id: number;
  fullName: string;
  planName: string;
}) => {
  if (
    !window.confirm(
      `Revoke ${membership.planName} for ${membership.fullName}? They will lose shop member prices immediately.`
    )
  ) {
    return;
  }

  setRevokingMembershipId(membership.id);

  try {
    const result = await revokeMembership(membership.id);
    if (!result.success) {
      showToast(result.error || "Unable to revoke this membership.", "error");
      return;
    }

    await loadAdminMemberships();
    if (customerProfile?.id) {
      await loadCustomerMembership();
    }
    showToast("Membership revoked.");
  } catch (error) {
    console.error("Revoke membership failed:", error);
    showToast("Unable to revoke this membership.", "error");
  } finally {
    setRevokingMembershipId(null);
  }
};

const clearCustomerState = () => {
  setCustomerProfile(null);
  setCustomerOrders([]);
  setExpandedAccountOrderId(null);
  setCustomerMessages([]);
  setCustomerMessageDraft("");
  setFanMembership(null);
  setMembershipPaymentMessage("");
  setMembershipPaymentPending(false);
};

const clearAdminState = () => {
  setIsAdminAuthenticated(false);
  setAdminRole(null);
  setAdminPassword("");
  setShowNewspaperPasswordReset(false);
  setNewspaperResetAdminPassword("");
  setNewspaperResetNewPassword("");
  setNewspaperResetConfirmPassword("");
  setAdminInboxThreads([]);
  setSelectedInboxCustomerId(null);
  setSelectedInboxCustomer(null);
  setAdminInboxMessages([]);
  setAdminReplyDraft("");
};

const returnToSignIn = () => {
  setAccountView("login");
  setActiveTab("account");
  setMobileMenuOpen(false);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const refreshAdminSession = async () => {
  const requestId = ++adminSessionRequestIdRef.current;
  try {
    const adminRes = await fetch("/api/admin/me", {
      credentials: "include",
      cache: "no-store",
    });
    const adminData = await adminRes.json();

    // A login/logout may have completed while this request was in flight —
    // don't let a stale response clobber the newer auth state.
    if (requestId !== adminSessionRequestIdRef.current) return null;

    if (
      adminData.success &&
      adminData.authenticated &&
      (adminData.role === "admin" || adminData.role === "news_editor")
    ) {
      setIsAdminAuthenticated(true);
      setAdminRole(adminData.role);
      return adminData.role as "admin" | "news_editor";
    }

    clearAdminState();
    return null;
  } catch (error) {
    if (requestId !== adminSessionRequestIdRef.current) return null;
    console.error("Refresh admin session failed:", error);
    clearAdminState();
    return null;
  }
};

const logoutAdminSession = async () => {
  adminSessionRequestIdRef.current += 1;
  clearAdminState();

  try {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Admin logout failed:", error);
  }
};

const loadAppSessions = async () => {
  try {
    const customerRes = await fetch("/api/customer/me", {
      credentials: "include",
      cache: "no-store",
    });
    const customerData = await customerRes.json();

    const customerAuth =
      customerData.success && customerData.authenticated && customerData.customer;

    clearCustomerState();
    clearAdminState();

    if (customerAuth) {
      setCustomerProfile(customerData.customer);
      setCheckoutName(customerData.customer.fullName);
      setCheckoutPhone(formatStoredPhoneForInput(customerData.customer.phoneNumber));
      setMembershipPhone(formatStoredPhoneForInput(customerData.customer.phoneNumber));
    }

    await refreshAdminSession();
  } catch (error) {
    console.error("Load app sessions failed:", error);
  }
};

const loadCustomerOrders = async () => {
  if (customerOrdersLoadRef.current) {
    return;
  }

  customerOrdersLoadRef.current = true;
  setIsLoadingCustomerOrders(true);

  try {
    const response = await fetch("/api/customer/orders", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setCustomerOrders(result.orders || []);
    } else {
      setCustomerOrders([]);
      if (result.error && response.status !== 401) {
        showToast(result.error, "error");
      }
    }
  } catch (error) {
    console.error("Load customer orders failed:", error);
    setCustomerOrders([]);
    showToast("Unable to load your orders.", "error");
  } finally {
    setIsLoadingCustomerOrders(false);
    customerOrdersLoadRef.current = false;
  }
};

const loadCustomerMembership = async () => {
  try {
    const response = await fetch("/api/customer/membership", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });
    const result = await response.json();
    if (response.ok && result.success) {
      setFanMembership(result.membership ?? null);
    }
  } catch (error) {
    console.error("Load membership failed:", error);
  }
};

const loadCustomerMessages = async () => {
  if (!customerProfile?.id) {
    return;
  }

  setIsLoadingCustomerMessages(true);

  try {
    const response = await fetch("/api/customer/messages", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setCustomerMessages(result.messages || []);
    } else if (result.error && response.status !== 401) {
      showToast(result.error, "error");
    }
  } catch (error) {
    console.error("Load customer messages failed:", error);
    showToast("Unable to load your messages.", "error");
  } finally {
    setIsLoadingCustomerMessages(false);
  }
};

const handleSendCustomerMessage = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!customerMessageDraft.trim()) {
    showToast("Write a message before sending.", "error");
    return;
  }

  setIsSendingCustomerMessage(true);

  try {
    const response = await fetch("/api/customer/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message: customerMessageDraft }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setCustomerMessageDraft("");
      showToast("Message sent to the club admin.");
      await loadCustomerMessages();
    } else {
      showToast(result.error || "Unable to send message.", "error");
    }
  } catch (error) {
    console.error("Send customer message failed:", error);
    showToast("Unable to send message right now.", "error");
  } finally {
    setIsSendingCustomerMessage(false);
  }
};

const loadAdminInboxThreads = async (silent = false) => {
  if (!silent) {
    setIsLoadingAdminInbox(true);
  }

  try {
    const response = await fetch("/api/admin/messages", {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setAdminInboxThreads(result.threads || []);
    } else if (result.error && !silent) {
      showToast(result.error, "error");
    }
  } catch (error) {
    console.error("Load admin inbox failed:", error);
    if (!silent) {
      showToast("Unable to load fan messages.", "error");
    }
  } finally {
    if (!silent) {
      setIsLoadingAdminInbox(false);
    }
  }
};

const loadAdminInboxThread = async (customerId: number) => {
  setSelectedInboxCustomerId(customerId);
  setIsLoadingAdminInbox(true);

  try {
    const response = await fetch(`/api/admin/messages?customerId=${customerId}`, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setSelectedInboxCustomer(result.customer);
      setAdminInboxMessages(result.messages || []);
      await loadAdminInboxThreads(true);
    } else {
      showToast(result.error || "Unable to load conversation.", "error");
    }
  } catch (error) {
    console.error("Load admin inbox thread failed:", error);
    showToast("Unable to load conversation.", "error");
  } finally {
    setIsLoadingAdminInbox(false);
  }
};

const handleAdminReply = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!selectedInboxCustomerId) {
    showToast("Select a fan conversation first.", "error");
    return;
  }

  if (!adminReplyDraft.trim()) {
    showToast("Write a reply before sending.", "error");
    return;
  }

  setIsSendingAdminReply(true);

  try {
    const response = await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        customerId: selectedInboxCustomerId,
        message: adminReplyDraft,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      setAdminReplyDraft("");
      showToast("Reply sent to fan account.");
      await loadAdminInboxThread(selectedInboxCustomerId);
    } else {
      showToast(result.error || "Unable to send reply.", "error");
    }
  } catch (error) {
    console.error("Send admin reply failed:", error);
    showToast("Unable to send reply right now.", "error");
  } finally {
    setIsSendingAdminReply(false);
  }
};

const handleCustomerRegister = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch("/api/customer/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: registerName,
        phone: registerPhone,
        email: registerEmail,
        password: registerPassword,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setCustomerProfile(data.customer);
      setCheckoutName(data.customer.fullName);
      setCheckoutPhone(formatStoredPhoneForInput(data.customer.phoneNumber));
      setMembershipPhone(formatStoredPhoneForInput(data.customer.phoneNumber));
      setRegisterPassword("");
      await refreshAdminSession();
      showToast("Account created successfully.");
      resumeAfterAuth();
    } else {
      showToast(data.error || "Unable to create account.", "error");
    }
  } catch (error) {
    console.error("Customer register failed:", error);
    showToast("Unable to create account right now.", "error");
  }
};

const handleCustomerLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  const identifierKeyword = loginIdentifier.trim().toUpperCase();

  if (identifierKeyword === "ADMIN") {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        adminSessionRequestIdRef.current += 1;
        setIsAdminAuthenticated(true);
        setAdminRole("admin");
        setLoginIdentifier("");
        setLoginPassword("");
        setActiveTab("admin");
        window.scrollTo({ top: 0, behavior: "smooth" });
        showToast("Signed in successfully.");
      } else {
        showToast(result.error || "Incorrect password.", "error");
      }
    } catch (error) {
      console.error("Admin login failed:", error);
      showToast("Unable to connect to the authentication server.", "error");
    }
    return;
  }

  if (identifierKeyword === "PRESS") {
    try {
      const response = await fetch("/api/newspaper/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "newspaper", password: loginPassword }),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        adminSessionRequestIdRef.current += 1;
        setIsAdminAuthenticated(true);
        setAdminRole("news_editor");
        setLoginIdentifier("");
        setLoginPassword("");
        setActiveTab("admin");
        window.scrollTo({ top: 0, behavior: "smooth" });
        showToast("Signed in successfully.");
      } else {
        showToast(result.error || "Incorrect password.", "error");
      }
    } catch (error) {
      console.error("Newspaper login failed:", error);
      showToast("Unable to connect to the authentication server.", "error");
    }
    return;
  }

  try {
    const response = await fetch("/api/customer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: loginIdentifier,
        password: loginPassword,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setCustomerProfile(data.customer);
      setCheckoutName(data.customer.fullName);
      setCheckoutPhone(formatStoredPhoneForInput(data.customer.phoneNumber));
      setMembershipPhone(formatStoredPhoneForInput(data.customer.phoneNumber));
      setLoginPassword("");
      await refreshAdminSession();
      showToast("Welcome back!");
      resumeAfterAuth();
    } else {
      showToast(data.error || "Unable to sign in.", "error");
    }
  } catch (error) {
    console.error("Customer login failed:", error);
    showToast("Unable to sign in right now.", "error");
  }
};

const handleCustomerLogout = async () => {
  try {
    await fetch("/api/customer/logout", { method: "POST", credentials: "include" });
  } finally {
    clearCustomerState();
    setPendingCheckoutAfterAuth(false);
    setPendingMembershipAfterAuth(false);
    setActiveTab("home");
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Signed out successfully.");
  }
};

const handleCustomerRequestReset = async (e?: React.FormEvent) => {
  e?.preventDefault();

  if (!resetPhone.trim()) {
    showToast("Enter your M-PESA phone number.", "error");
    return;
  }

  setIsFanResetPending(true);

  try {
    const response = await fetch("/api/customer/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: resetPhone }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setResetStep("confirm");
      showToast("Reset code sent to your phone.");
    } else {
      showToast(data.error || "Unable to send reset code.", "error");
    }
  } catch (error) {
    console.error("Customer reset request failed:", error);
    showToast("Unable to send reset code right now.", "error");
  } finally {
    setIsFanResetPending(false);
  }
};

const handleCustomerCompleteReset = async (e: React.FormEvent) => {
  e.preventDefault();

  setIsFanResetPending(true);

  try {
    const response = await fetch("/api/customer/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: resetPhone,
        code: resetCode,
        newPassword: resetNewPassword,
        confirmPassword: resetConfirmPassword,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      const wasSignedIn = Boolean(customerProfile);
      setAccountView("login");
      setResetStep("request");
      setResetCode("");
      setResetNewPassword("");
      setResetConfirmPassword("");
      setLoginIdentifier(resetPhone);
      setShowFanPasswordReset(false);

      if (wasSignedIn) {
        try {
          await fetch("/api/customer/logout", { method: "POST", credentials: "include" });
        } catch (error) {
          console.error("Customer logout after reset failed:", error);
        }
        clearCustomerState();
      }

      showToast("Password updated. Sign in with your new password.");
    } else {
      showToast(data.error || "Unable to reset password.", "error");
    }
  } catch (error) {
    console.error("Customer reset failed:", error);
    showToast("Unable to reset password right now.", "error");
  } finally {
    setIsFanResetPending(false);
  }
};

const handleAdminRequestReset = async (e?: React.FormEvent) => {
  e?.preventDefault();

  if (!adminResetPhone.trim()) {
    showToast("Enter your phone number.", "error");
    return;
  }

  setIsAdminResetPending(true);

  try {
    const response = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: adminResetPhone }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setAdminResetStep("confirm");
      showToast("Reset code sent to your phone.");
    } else {
      showToast(data.error || "Unable to send reset code.", "error");
    }
  } catch (error) {
    console.error("Admin reset request failed:", error);
    showToast("Unable to send reset code right now.", "error");
  } finally {
    setIsAdminResetPending(false);
  }
};

const handleAdminCompleteReset = async (e: React.FormEvent) => {
  e.preventDefault();

  setIsAdminResetPending(true);

  try {
    const response = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: adminResetPhone,
        code: adminResetCode,
        newPassword: adminResetNewPassword,
        confirmPassword: adminResetConfirmPassword,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setAdminResetStep("request");
      setAdminResetCode("");
      setAdminResetNewPassword("");
      setAdminResetConfirmPassword("");
      setShowAdminPasswordReset(false);
      showToast("Password updated. Sign in with your new password.");
    } else {
      showToast(data.error || "Unable to reset password.", "error");
    }
  } catch (error) {
    console.error("Admin reset failed:", error);
    showToast("Unable to reset password right now.", "error");
  } finally {
    setIsAdminResetPending(false);
  }
};

const handleNewspaperPasswordReset = async (e: React.FormEvent) => {
  e.preventDefault();

  if (adminRole !== "admin") {
    showToast("Only a club admin can reset the newspaper password.", "error");
    return;
  }

  setIsNewspaperResetPending(true);

  try {
    const response = await fetch("/api/admin/newspaper/reset-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        adminPassword: newspaperResetAdminPassword,
        newPassword: newspaperResetNewPassword,
        confirmPassword: newspaperResetConfirmPassword,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      setNewspaperResetAdminPassword("");
      setNewspaperResetNewPassword("");
      setNewspaperResetConfirmPassword("");
      setShowNewspaperPasswordReset(false);
      showToast("Newspaper / press password updated successfully.");
    } else {
      showToast(data.error || "Unable to reset newspaper password.", "error");
    }
  } catch (error) {
    console.error("Newspaper password reset failed:", error);
    showToast("Unable to reset newspaper password right now.", "error");
  } finally {
    setIsNewspaperResetPending(false);
  }
};

const handleTrackOrder = (e: React.FormEvent) => {
  e.preventDefault();
  setTrackError("");
  setTrackedOrder(null);

  startTransition(async () => {
    const result = await trackOrder({
      orderId: Number(trackOrderId),
      phone: trackPhone,
    });

    if (result.success && result.order) {
      setTrackedOrder(result.order);
    } else {
      setTrackError(result.error || "Unable to find that order.");
    }
  });
};

const handleUpdateOrderStatus = async (
  orderId: number,
  orderStatus: "processing" | "shipped" | "delivered" | "cancelled"
) => {
  setUpdatingOrderId(orderId);

  try {
    const result = await updateOrderStatus(orderId, orderStatus);

    if (result.success) {
      const baseMessage = `Order #${orderId} updated to ${getOrderStatusLabel(orderStatus)}.`;
      if (result.notification && !result.notification.sent) {
        showToast(
          `${baseMessage} Buyer was not notified on WhatsApp/SMS${result.notification.reason ? `: ${result.notification.reason}` : "."}`,
          "error"
        );
      } else {
        showToast(baseMessage);
      }
      await loadAdminOrders();
    } else {
      showToast(result.error || "Unable to update order status.", "error");
    }
  } finally {
    setUpdatingOrderId(null);
  }
};

const handleMarkOrderCashPaid = async (orderId: number) => {
  if (
    !window.confirm(
      `Mark order #${orderId} as cash received? This will confirm payment and allow delivery progress updates.`
    )
  ) {
    return;
  }

  setUpdatingOrderId(orderId);

  try {
    const result = await markOrderCashPaid(orderId);

    if (result.success) {
      const baseMessage = result.message || `Order #${orderId} marked as paid.`;
      if (result.notification && !result.notification.sent) {
        showToast(
          `${baseMessage} Buyer was not notified on WhatsApp/SMS${result.notification.reason ? `: ${result.notification.reason}` : "."}`,
          "error"
        );
      } else {
        showToast(baseMessage);
      }
      await loadAdminOrders();
    } else {
      showToast(result.error || "Unable to mark cash payment.", "error");
    }
  } finally {
    setUpdatingOrderId(null);
  }
};

const handleArchiveOrder = async (orderId: number) => {
  if (
    !window.confirm(
      `Remove order #${orderId} from the active list? It will stay in order history.`
    )
  ) {
    return;
  }

  setUpdatingOrderId(orderId);

  try {
    const result = await archiveOrder(orderId);

    if (result.success) {
      showToast(`Order #${orderId} moved to history.`);
      await loadAdminOrders();
    } else {
      showToast(result.error || "Unable to archive order.", "error");
    }
  } finally {
    setUpdatingOrderId(null);
  }
};

const handleRestoreOrder = async (orderId: number) => {
  setUpdatingOrderId(orderId);

  try {
    const result = await restoreOrder(orderId);

    if (result.success) {
      showToast(`Order #${orderId} restored to the active list.`);
      await loadAdminOrders();
    } else {
      showToast(result.error || "Unable to restore order.", "error");
    }
  } finally {
    setUpdatingOrderId(null);
  }
};

useEffect(() => {
  loadAppSessions();
}, []);

useEffect(() => {
  if (skipInitialTabScrollRef.current) {
    skipInitialTabScrollRef.current = false;
    return;
  }

  if (activeTab === "admin") {
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}, [activeTab]);

useEffect(() => {
  setIsCartOpen(false);
  setActiveHighlight(null);
  setSelectedShopItemId(null);
  setNewsPreviewOpen(false);
  setReplaceImageId(null);
  setViewingPlayerId(null);
  setViewingManagementId(null);
}, [activeTab]);

useEffect(() => {
  if (
    activeTab === "management" ||
    activeTab === "squad" ||
    activeTab === "account" ||
    activeTab === "gallery" ||
    activeTab === "news" ||
    activeTab === "admin"
  ) {
    refreshAdminSession();
  }
}, [activeTab]);

useEffect(() => {
  if (activeTab === "account" && customerProfile?.id) {
    loadCustomerOrders();
    loadCustomerMessages();
  }
}, [activeTab, customerProfile?.id]);

useEffect(() => {
  if (!customerProfile?.id) {
    setFanMembership(null);
    return;
  }
  void loadCustomerMembership();
}, [customerProfile?.id]);

useEffect(() => {
  if (activeTab === "admin" && isAdminAuthenticated && adminRole !== "news_editor") {
    loadAdminOrders();
    loadAdminInboxThreads();
    loadAdminMemberships();
  }
}, [activeTab, isAdminAuthenticated, adminRole]);

useEffect(() => {
  if (adminRole === "news_editor") {
    setAdminPanelView("content");
  }
}, [adminRole]);

useEffect(() => {
  if (
    adminPanelView === "orders" &&
    isAdminAuthenticated &&
    adminRole !== "news_editor"
  ) {
    void markAdminOrdersSeen().then((result) => {
      if (result.success) {
        setAdminUnseenOrderCount(0);
      }
    });
  }
}, [adminPanelView, isAdminAuthenticated, adminRole]);

const collapseAdminUpdatePanels = useCallback(() => {
  setPublishedHighlightsOpen(false);
  setListedShopItemsOpen(false);
  setShowArchivedOrders(false);
  setSelectedInboxCustomerId(null);
  setSelectedInboxCustomer(null);
  setAdminInboxMessages([]);
  setAdminReplyDraft("");
}, []);

useEffect(() => {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem("klfc-admin-open-panels");
    if (!raw) return;
    const stored = JSON.parse(raw) as {
      player?: boolean;
      management?: boolean;
      squadUpdates?: boolean;
      managementUpdates?: boolean;
      bulkPhotos?: boolean;
    };
    setPlayerPanelOpen(Boolean(stored.player));
    setManagementPanelOpen(Boolean(stored.management));
    setSquadUpdatesOpen(Boolean(stored.squadUpdates));
    setManagementUpdatesOpen(Boolean(stored.managementUpdates));
    setBulkPhotosOpen(Boolean(stored.bulkPhotos));
  } catch {
    // Ignore unreadable local storage.
  }
  setAdminPanelsHydrated(true);
}, []);

useEffect(() => {
  if (typeof window === "undefined" || !adminPanelsHydrated) return;
  window.localStorage.setItem(
    "klfc-admin-open-panels",
    JSON.stringify({
      player: playerPanelOpen,
      management: managementPanelOpen,
      squadUpdates: squadUpdatesOpen,
      managementUpdates: managementUpdatesOpen,
      bulkPhotos: bulkPhotosOpen,
    })
  );
}, [
  playerPanelOpen,
  managementPanelOpen,
  squadUpdatesOpen,
  managementUpdatesOpen,
  bulkPhotosOpen,
  adminPanelsHydrated,
]);

useEffect(() => {
  collapseAdminUpdatePanels();
}, [adminPanelView, collapseAdminUpdatePanels]);

useEffect(() => {
  if (activeTab !== "admin") {
    setAdminPanelView("content");
    collapseAdminUpdatePanels();
  }
}, [activeTab, collapseAdminUpdatePanels]);

const handleCustomerIdleLock = useCallback(async () => {
  if (!customerProfile) {
    return;
  }

  try {
    await fetch("/api/customer/logout", { method: "POST", credentials: "include" });
  } catch (error) {
    console.error("Customer idle lock logout failed:", error);
  }

  clearCustomerState();
  if (activeTab === "account") {
    setActiveTab("home");
  }
  showToast(
    "Your fan account signed out after inactivity. Sign in again from Shop or Join to continue.",
    "error"
  );
}, [customerProfile, activeTab]);

const handleAdminIdleLock = useCallback(async () => {
  if (!isAdminAuthenticated) {
    return;
  }

  const wasPressAccount = adminRole === "news_editor";
  await logoutAdminSession();
  if (activeTab === "admin") {
    returnToSignIn();
  }
  showToast(
    "Admin signed out automatically after 5 minutes with no activity.",
    "error"
  );
}, [isAdminAuthenticated, activeTab, adminRole]);

const pingSession = useCallback(async () => {
  try {
    await fetch("/api/session/heartbeat", {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Session heartbeat failed:", error);
  }
}, []);

useIdleSessionLock({
  enabled: Boolean(customerProfile),
  onIdle: handleCustomerIdleLock,
  onActivity: pingSession,
  timeoutMs: SESSION_IDLE_TIMEOUT_MS,
});

useIdleSessionLock({
  enabled: isAdminAuthenticated,
  onIdle: handleAdminIdleLock,
  onActivity: pingSession,
  timeoutMs: ADMIN_SESSION_IDLE_TIMEOUT_MS,
});

  const handleAdminLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: adminPassword,
      }),
    });

    const result = await response.json();

   if (response.ok && result.success) {
  adminSessionRequestIdRef.current += 1;
  setIsAdminAuthenticated(true);
  setAdminRole("admin");
  setAdminPassword("");

  setActiveTab("admin");
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Signed in successfully.");
}
    else {
      showToast(result.error || "Incorrect password.", "error");
    }
  } catch (error) {
    console.error("Admin login failed:", error);
    showToast("Unable to connect to the authentication server.", "error");
  }
};

  const handleNewspaperLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/newspaper/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "newspaper",
          password: newspaperLoginPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        adminSessionRequestIdRef.current += 1;
        setIsAdminAuthenticated(true);
        setAdminRole("news_editor");
        setNewspaperLoginPassword("");
        setActiveTab("admin");
        window.scrollTo({ top: 0, behavior: "smooth" });
        showToast("Signed in successfully.");
      } else {
        showToast(result.error || "Incorrect password.", "error");
      }
    } catch (error) {
      console.error("Newspaper login failed:", error);
      showToast("Unable to connect to the authentication server.", "error");
    }
  };

  const resetAdminPlayerForm = () => {
    setEditingPlayerId(null);
    setAdminPlayerName("");
    setAdminPlayerPos("Centre Back");
    setAdminPlayerJersey("");
    setAdminPlayerBio("");
    setAdminPlayerApps("0");
    setAdminPlayerGoals("0");
    setAdminPlayerAssists("0");
    setAdminPlayerFile(null);
  };

  const handleAdminEditPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setAdminPanelView("content");
    setPlayerPanelOpen(true);
    setSquadUpdatesOpen(false);
    setAdminPlayerName(player.name);
    setAdminPlayerPos(player.position);
    setAdminPlayerJersey(String(player.jerseyNumber));
    setAdminPlayerBio(player.bio || "");
    setAdminPlayerApps(String(player.appearances ?? 0));
    setAdminPlayerGoals(String(player.goals ?? 0));
    setAdminPlayerAssists(String(player.assists ?? 0));
    setAdminPlayerFile(null);
    setActiveTab("admin");
  };

  const handleAdminAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPlayerName || !adminPlayerJersey) {
      showToast("Player name and jersey number are required", "error");
      return;
    }

    setAdminBusy("player");
    try {
      const imageUrl = adminPlayerFile
        ? await uploadSelectedImage(adminPlayerFile, "players")
        : undefined;

      const res = await addPlayer({
        name: adminPlayerName,
        position: adminPlayerPos,
        jerseyNumber: parseInt(adminPlayerJersey),
        bio: adminPlayerBio,
        appearances: parseInt(adminPlayerApps) || 0,
        goals: parseInt(adminPlayerGoals) || 0,
        assists: parseInt(adminPlayerAssists) || 0,
        imageUrl,
      });

      if (res.success && res.player) {
        setClubData((prev) => ({
          ...prev,
          players: [...prev.players, res.player],
        }));
        showToast("Player added successfully!");
        resetAdminPlayerForm();
      } else {
        showToast(res.error || "Error adding player", "error");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Error uploading player photo", "error");
    } finally {
      setAdminBusy(null);
    }
  };

  const handleAdminUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingPlayerId) {
      showToast("No player selected for editing.", "error");
      return;
    }

    if (!adminPlayerName || !adminPlayerJersey) {
      showToast("Player name and jersey number are required", "error");
      return;
    }

    setAdminBusy("player");
    try {
      const currentPlayer = clubData.players.find(
        (player) => player.id === editingPlayerId
      );
      const imageUrl = adminPlayerFile
        ? await uploadSelectedImage(adminPlayerFile, "players")
        : currentPlayer?.imageUrl || "";

      const res = await updatePlayer(editingPlayerId, {
        name: adminPlayerName,
        position: adminPlayerPos,
        jerseyNumber: parseInt(adminPlayerJersey),
        bio: adminPlayerBio,
        appearances: parseInt(adminPlayerApps) || 0,
        goals: parseInt(adminPlayerGoals) || 0,
        assists: parseInt(adminPlayerAssists) || 0,
        imageUrl,
      });

      if (res.success && res.player) {
        setClubData((prev) => ({
          ...prev,
          players: prev.players.map((player) =>
            player.id === res.player.id ? res.player : player
          ),
        }));
        showToast("Player updated successfully!");
        resetAdminPlayerForm();
      } else {
        showToast(res.error || "Error updating player", "error");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Error updating player", "error");
    } finally {
      setAdminBusy(null);
    }
  };

  // Admin Add Management Official
const handleAdminAddManagement = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!adminManagementName || !adminManagementPosition) {
    showToast("Name and position are required", "error");
    return;
  }

  setAdminBusy("management");
  try {
    const imageUrl = adminManagementFile
      ? await uploadSelectedImage(adminManagementFile, "management")
      : undefined;

    const res = await addManagement({
      name: adminManagementName,
      position: adminManagementPosition,
      category: adminManagementCategory,
      bio: adminManagementBio,
      responsibilities: adminManagementResponsibilities,
      displayOrder: parseInt(adminManagementOrder) || 0,
      imageUrl,
    });

    if (res.success && res.member) {
      setClubData((prev) => ({
        ...prev,
        management: [...prev.management, res.member],
      }));
      showToast("Management official added successfully!");
      setAdminManagementName("");
      setAdminManagementPosition("Chairman");
      setAdminManagementCategory("Club Leadership");
      setAdminManagementBio("");
      setAdminManagementResponsibilities("");
      setAdminManagementOrder("0");
      setAdminManagementFile(null);
    } else {
      showToast(res.error || "Error adding management official", "error");
    }
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : "Error uploading management photo",
      "error"
    );
  } finally {
    setAdminBusy(null);
  }
};

 // Admin Add Fixture
const handleAdminAddFixture = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!adminOpponent || !adminMatchDate) {
    showToast("Opponent name and date are required", "error");
    return;
  }

  const fixtureDate = combineFixtureDateTime(adminMatchDate, adminMatchTime);

  setAdminBusy("fixture");
  try {
    const opponentLogoUrl = adminOpponentLogoFile
      ? await uploadSelectedImage(adminOpponentLogoFile, "fixtures")
      : adminOpponentLogoUrl || undefined;

    const res = await addFixture({
      opponent: adminOpponent,
      opponentLogoUrl,
      date: fixtureDate,
      isHome: adminIsHome,
      status: adminStatus,
      venue: adminVenue,
      matchType: adminMatchType,
      squadTeam: adminSquadTeam,
      homeScore:
        adminHomeScore !== "" ? parseInt(adminHomeScore) : undefined,
      awayScore:
        adminAwayScore !== "" ? parseInt(adminAwayScore) : undefined,
    });

    if (res.success && res.fixture) {
      setClubData((prev) => ({
        ...prev,
        fixtures: [...prev.fixtures, res.fixture],
      }));
      showToast("Fixture registered successfully!");
      setAdminOpponent("");
      setAdminMatchDate("");
      setAdminMatchTime("");
      setAdminHomeScore("");
      setAdminAwayScore("");
      setAdminSquadTeam("main");
      setAdminOpponentLogoFile(null);
      setAdminOpponentLogoUrl("");
    } else {
      showToast(res.error || "Error adding fixture", "error");
    }
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "Error uploading opponent logo",
      "error"
    );
  } finally {
    setAdminBusy(null);
  }
};


// Admin Update Fixture / Match Result
const handleAdminUpdateFixture = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!editingFixtureId) {
    showToast("No match selected for editing", "error");
    return;
  }

  if (!adminOpponent || !adminMatchDate) {
    showToast("Opponent name and date are required", "error");
    return;
  }

  const fixtureDate = combineFixtureDateTime(adminMatchDate, adminMatchTime);

  setAdminBusy("fixture");
  try {
    let opponentLogoUrl: string | null | undefined = adminOpponentLogoUrl || null;

    if (adminOpponentLogoFile) {
      opponentLogoUrl = await uploadSelectedImage(adminOpponentLogoFile, "fixtures");
    }

    const res = await updateFixture(editingFixtureId, {
      opponent: adminOpponent,
      opponentLogoUrl,
      date: fixtureDate,
      isHome: adminIsHome,
      status: adminStatus,
      venue: adminVenue,
      matchType: adminMatchType,
      squadTeam: adminSquadTeam,
      homeScore:
        adminHomeScore !== "" ? parseInt(adminHomeScore) : undefined,
      awayScore:
        adminAwayScore !== "" ? parseInt(adminAwayScore) : undefined,
    });

    if (res.success && res.fixture) {
      setClubData((prev) => ({
        ...prev,
        fixtures: prev.fixtures.map((fixture) =>
          fixture.id === res.fixture.id ? res.fixture : fixture
        ),
      }));
      showToast("Match result updated successfully!");
      setEditingFixtureId(null);
      setAdminOpponent("");
      setAdminMatchDate("");
      setAdminMatchTime("");
      setAdminHomeScore("");
      setAdminAwayScore("");
      setAdminStatus("upcoming");
      setAdminMatchType("league");
      setAdminSquadTeam("main");
      setAdminIsHome(true);
      setAdminVenue(HOME_GROUND.fullAddress);
      setAdminOpponentLogoFile(null);
      setAdminOpponentLogoUrl("");
    } else {
      showToast(res.error || "Error updating fixture", "error");
    }
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "Error updating fixture",
      "error"
    );
  } finally {
    setAdminBusy(null);
  }
};
// Load an existing fixture into the admin form for editing
const handleAddFixtureToCalendar = (
  fixture: (typeof clubData.fixtures)[number]
) => {
  const icsContent = buildFixtureIcs(fixture);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `kariobangi-legends-vs-${fixture.opponent.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const handleEditFixture = (
  fixture: (typeof clubData.fixtures)[number]
) => {
  setEditingFixtureId(fixture.id);

  setAdminOpponent(fixture.opponent);
  setAdminOpponentLogoUrl(fixture.opponentLogoUrl || "");
  setAdminOpponentLogoFile(null);
  setAdminMatchDate(toFixtureDateInputValue(fixture.date));
  setAdminMatchTime(toFixtureTimeInputValue(fixture.date));
  setAdminIsHome(fixture.isHome);
  setAdminVenue(fixture.venue);
  setAdminStatus(fixture.status);
  setAdminMatchType(fixture.matchType || "league");
  setAdminSquadTeam(fixture.squadTeam || "main");

  setAdminHomeScore(
    fixture.homeScore !== null && fixture.homeScore !== undefined
      ? String(fixture.homeScore)
      : ""
  );

  setAdminAwayScore(
    fixture.awayScore !== null && fixture.awayScore !== undefined
      ? String(fixture.awayScore)
      : ""
  );

  showToast(`Editing match vs ${fixture.opponent}. Set kick-off time in the match form.`);
  setActiveTab("admin");
  window.setTimeout(() => {
    document.getElementById("admin-fixture-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 80);
};
  // Admin Add News
  const handleAdminAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewsTitle || !adminNewsSummary || !adminNewsContent) {
      showToast("All news fields are required", "error");
      return;
    }

    setAdminBusy("news");
    try {
      const imageUrl = adminNewsFile
        ? await uploadSelectedImage(adminNewsFile, "news")
        : undefined;

      const res = await addNews({
        title: adminNewsTitle,
        summary: adminNewsSummary,
        content: adminNewsContent,
        imageUrl,
      });

      if (res.success && res.article) {
        setClubData((prev) => ({
          ...prev,
          news: [res.article, ...prev.news],
        }));
        showToast("News published successfully!");
        setAdminNewsTitle("");
        setAdminNewsSummary("");
        setAdminNewsContent("");
        setAdminNewsFile(null);
      } else {
        showToast(res.error || "Error publishing news", "error");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Error uploading news photo", "error");
    } finally {
      setAdminBusy(null);
    }
  };

  // Admin Add Gallery
  const handleAdminAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminGalleryFile) {
      showToast("Please choose a photo first.", "error");
      return;
    }

    if (!adminGalleryCaption.trim()) {
      showToast("Please enter a caption.", "error");
      return;
    }

    setAdminBusy("gallery");
    try {
      const imageUrl = await uploadSelectedImage(adminGalleryFile, "gallery");
      const res = await addGalleryImage({
        imageUrl,
        caption: adminGalleryCaption.trim(),
        category: adminGalleryCategory,
      });

      if (res.success && res.item) {
        setClubData((prev) => ({
          ...prev,
          gallery: [res.item, ...prev.gallery],
        }));
        showToast("Photo uploaded to the gallery successfully!");
        setAdminGalleryFile(null);
        setAdminGalleryCaption("");
        setAdminGalleryCategory("Training");
        if (adminGalleryPreview) {
          URL.revokeObjectURL(adminGalleryPreview);
          setAdminGalleryPreview(null);
        }
      } else {
        showToast(res.error || "Error adding photo", "error");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Error uploading gallery photo", "error");
    } finally {
      setAdminBusy(null);
    }
  };

  const handleAdminAddHighlight = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminHighlightVideoFile) {
      showToast("Please choose a highlight video first.", "error");
      return;
    }

    if (!adminHighlightTitle.trim()) {
      showToast("Please enter a title for this highlight.", "error");
      return;
    }

    setAdminBusy("highlights");
    try {
      const videoUrl = await uploadSelectedVideo(adminHighlightVideoFile);
      const thumbnailUrl = adminHighlightThumbFile
        ? await uploadSelectedImage(adminHighlightThumbFile, "gallery")
        : undefined;

      const res = await addTeamHighlight({
        title: adminHighlightTitle.trim(),
        description: adminHighlightDescription.trim(),
        videoUrl,
        thumbnailUrl,
        category: adminHighlightCategory,
      });

      if (res.success && res.item) {
        setClubData((prev) => ({
          ...prev,
          highlights: [res.item, ...prev.highlights],
        }));
        showToast("Team highlight video published successfully!");
        setAdminHighlightVideoFile(null);
        setAdminHighlightThumbFile(null);
        setAdminHighlightTitle("");
        setAdminHighlightDescription("");
        setAdminHighlightCategory("Match Highlights");
        if (adminHighlightVideoPreview) {
          URL.revokeObjectURL(adminHighlightVideoPreview);
          setAdminHighlightVideoPreview(null);
        }
        if (adminHighlightThumbPreview) {
          URL.revokeObjectURL(adminHighlightThumbPreview);
          setAdminHighlightThumbPreview(null);
        }
      } else {
        showToast(res.error || "Error publishing highlight video", "error");
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Error uploading highlight video",
        "error"
      );
    } finally {
      setAdminBusy(null);
    }
  };

  const handleDeleteHighlight = async (id: number, title: string) => {
    if (!confirm(`Remove highlight video "${title}"?`)) return;

    const res = await deleteTeamHighlight(id);
    if (res.success) {
      setClubData((prev) => ({
        ...prev,
        highlights: prev.highlights.filter((item) => item.id !== id),
      }));
      if (activeHighlight?.id === id) {
        setActiveHighlight(null);
      }
      showToast("Highlight video removed.");
    } else {
      showToast(res.error || "Unable to remove highlight video.", "error");
    }
  };

  const handleAdminEditManagement = (
  member: ManagementMember
) => {
  setEditingManagementId(member.id);
  setAdminPanelView("content");
  setManagementPanelOpen(true);

  setAdminManagementName(member.name);
  setAdminManagementPosition(member.position);
  setAdminManagementCategory(member.category);
  setAdminManagementBio(member.bio || "");
  setAdminManagementResponsibilities(
    member.responsibilities || ""
  );
  setAdminManagementOrder(
    String(member.displayOrder ?? 0)
  );
  setAdminManagementFile(null);

  setActiveTab("admin");
};
const handleCancelManagementEdit = () => {
  setEditingManagementId(null);

  setAdminManagementName("");
  setAdminManagementPosition("Chairman");
  setAdminManagementCategory("Club Leadership");
  setAdminManagementBio("");
  setAdminManagementResponsibilities("");
  setAdminManagementOrder("0");
  setAdminManagementFile(null);
};

const handleAdminDeleteManagement = async (managementId: number) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this management official?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const res = await deleteManagement(managementId);

    if (res.success) {
      setClubData((prev) => ({
        ...prev,
        management: prev.management.filter((member) => member.id !== managementId),
      }));
      showToast("Management official deleted successfully!");

      if (editingManagementId === managementId) {
        handleCancelManagementEdit();
      }
    } else {
      showToast(res.error || "Error deleting management official", "error");
    }
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : "Error deleting management official",
      "error"
    );
  }
};

const handleUpdateManagementRole = async (
  managementId: number,
  category: string,
  position: string
) => {
  setUpdatingManagementRoleId(managementId);
  try {
    const res = await updateManagementRole(managementId, { category, position });
    if (res.success && res.member) {
      setClubData((prev) => ({
        ...prev,
        management: prev.management.map((member) =>
          member.id === res.member.id ? res.member : member
        ),
      }));
      showToast(res.message || "Management role updated.");
    } else {
      showToast(res.error || "Failed to update role.", "error");
    }
  } finally {
    setUpdatingManagementRoleId(null);
  }
};

const handleAdminUpdateManagement = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!editingManagementId) {
    showToast("No management official selected", "error");
    return;
  }

  if (!adminManagementName || !adminManagementPosition) {
    showToast("Name and position are required", "error");
    return;
  }

  setAdminBusy("management");
  try {
    const imageUrl = adminManagementFile
      ? await uploadSelectedImage(adminManagementFile, "management")
      : undefined;

    const currentMember = clubData.management.find(
      (member) => member.id === editingManagementId
    );

    const res = await updateManagement(editingManagementId, {
      name: adminManagementName,
      position: adminManagementPosition,
      category: adminManagementCategory,
      bio: adminManagementBio,
      responsibilities: adminManagementResponsibilities,
      displayOrder: parseInt(adminManagementOrder) || 0,
      imageUrl: imageUrl || currentMember?.imageUrl || "",
    });

    if (res.success && res.member) {
      setClubData((prev) => ({
        ...prev,
        management: prev.management.map((member) =>
          member.id === res.member.id ? res.member : member
        ),
      }));
      showToast("Management official updated successfully!");
      setEditingManagementId(null);
      setAdminManagementName("");
      setAdminManagementPosition("Chairman");
      setAdminManagementCategory("Club Leadership");
      setAdminManagementBio("");
      setAdminManagementResponsibilities("");
      setAdminManagementOrder("0");
      setAdminManagementFile(null);
    } else {
      showToast(res.error || "Error updating management official", "error");
    }
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : "Error updating management official",
      "error"
    );
  } finally {
    setAdminBusy(null);
  }
};
  // ========== DELETE HANDLERS ==========
  const handleDeletePlayer = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the squad?`)) return;
    const res = await deletePlayer(id);
    if (res.success) {
      setClubData((prev) => ({
        ...prev,
        players: prev.players.filter((player) => player.id !== id),
      }));
      if (editingPlayerId === id) {
        resetAdminPlayerForm();
      }
      showToast(res.message || "Player deleted.");
    } else {
      showToast(res.error || "Failed to delete.", "error");
    }
  };

  const handleUpdatePlayerPosition = async (playerId: number, position: string) => {
    setUpdatingPlayerPositionId(playerId);
    try {
      const res = await updatePlayerPosition(playerId, position);
      if (res.success && res.player) {
        setClubData((prev) => ({
          ...prev,
          players: prev.players.map((player) =>
            player.id === res.player.id ? res.player : player
          ),
        }));
        showToast(res.message || "Player position updated.");
      } else {
        showToast(res.error || "Failed to update position.", "error");
      }
    } finally {
      setUpdatingPlayerPositionId(null);
    }
  };

  const handleUpdatePlayerJersey = async (
    playerId: number,
    jerseyNumber: number
  ) => {
    setUpdatingPlayerJerseyId(playerId);
    try {
      const res = await updatePlayerJerseyNumber(playerId, jerseyNumber);
      if (res.success && res.player) {
        setClubData((prev) => ({
          ...prev,
          players: prev.players.map((player) =>
            player.id === res.player.id ? res.player : player
          ),
        }));
        showToast(res.message || "Jersey number updated.");
      } else {
        showToast(res.error || "Failed to update jersey number.", "error");
      }
    } finally {
      setUpdatingPlayerJerseyId(null);
    }
  };

  const handleUpdatePlayerName = async (playerId: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Player name cannot be empty.", "error");
      return;
    }

    setUpdatingPlayerNameId(playerId);
    try {
      const res = await updatePlayerName(playerId, trimmed);
      if (res.success && res.player) {
        setClubData((prev) => ({
          ...prev,
          players: prev.players.map((player) =>
            player.id === res.player.id ? res.player : player
          ),
        }));
        showToast(res.message || "Player name updated.");
      } else {
        showToast(res.error || "Failed to update player name.", "error");
      }
    } finally {
      setUpdatingPlayerNameId(null);
    }
  };

  const handleUpdateManagementName = async (
    managementId: number,
    name: string
  ) => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Official name cannot be empty.", "error");
      return;
    }

    setUpdatingManagementNameId(managementId);
    try {
      const res = await updateManagementName(managementId, trimmed);
      if (res.success && res.member) {
        setClubData((prev) => ({
          ...prev,
          management: prev.management.map((member) =>
            member.id === res.member.id ? res.member : member
          ),
        }));
        showToast(res.message || "Management name updated.");
      } else {
        showToast(res.error || "Failed to update management name.", "error");
      }
    } finally {
      setUpdatingManagementNameId(null);
    }
  };

  const openSquadPlayerShop = () => {
    setActiveTab("shop");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteFixture = async (id: number, opponent: string) => {
    if (!confirm(`Remove the fixture against "${opponent}"?`)) return;
    const res = await deleteFixture(id);
    if (res.success) {
      setClubData((prev) => ({
        ...prev,
        fixtures: prev.fixtures.filter((fixture) => fixture.id !== id),
      }));
      showToast(res.message || "Fixture deleted.");
    } else {
      showToast(res.error || "Failed to delete.", "error");
    }
  };

  const handleDeleteNews = async (id: number, title: string) => {
    if (!confirm(`Delete the news article "${title}"?`)) return;
    const res = await deleteNews(id);
    if (res.success) {
      setClubData((prev) => ({
        ...prev,
        news: prev.news.filter((item) => item.id !== id),
      }));
      showToast(res.message || "News deleted.");
    } else {
      showToast(res.error || "Failed to delete.", "error");
    }
  };

  const handleDeleteGallery = async (id: number) => {
    if (!confirm("Remove this photo from the gallery?")) return;
    const res = await deleteGalleryImage(id);
    if (res.success) {
      setClubData((prev) => ({
        ...prev,
        gallery: prev.gallery.filter((item) => item.id !== id),
      }));
      showToast(res.message || "Photo deleted.");
    } else {
      showToast(res.error || "Failed to delete.", "error");
    }
  };

  // ========== IMAGE REPLACE HANDLERS ==========
  const openReplaceImage = (
    id: number,
    type: "player" | "management" | "gallery" | "news" | "merch",
    currentUrl: string,
    currentCaption?: string
  ) => {
    setReplaceImageId(id);
    setReplaceImageType(type);
    setReplaceImageFile(null);
    setReplaceImageNewCaption(currentCaption || "");
    setReplaceImageCurrentUrl(currentUrl || "");
  };

  const handleRemoveImage = async () => {
    if (replaceImageId === null) return;
    if (replaceImageType !== "player" && replaceImageType !== "management") return;

    setAdminBusy("remove-image");
    try {
      if (replaceImageType === "player") {
        const res = await updatePlayerImage(replaceImageId, "");
        if (res.success && res.player) {
          const updatedPlayer = res.player;
          setClubData((prev) => ({
            ...prev,
            players: prev.players.map((player) =>
              player.id === updatedPlayer.id ? updatedPlayer : player
            ),
          }));
          showToast("Player photo removed.");
        } else {
          showToast(res.error || "Failed to remove photo.", "error");
        }
      } else {
        const res = await updateManagementImage(replaceImageId, "");
        if (res.success && res.member) {
          const updatedMember = res.member;
          setClubData((prev) => ({
            ...prev,
            management: prev.management.map((member) =>
              member.id === updatedMember.id ? updatedMember : member
            ),
          }));
          showToast("Photo removed.");
        } else {
          showToast(res.error || "Failed to remove photo.", "error");
        }
      }

      setReplaceImageId(null);
      setReplaceImageFile(null);
      setReplaceImageCurrentUrl("");
    } catch (error) {
      console.error("Remove image failed:", error);
      showToast("Failed to remove photo.", "error");
    } finally {
      setAdminBusy(null);
    }
  };

  const handleReplaceImage = async () => {
    if (!replaceImageFile || replaceImageId === null) {
      showToast("Please choose a new photo first.", "error");
      return;
    }

    setAdminBusy("replace-image");
    try {
      const folder =
        replaceImageType === "player"
          ? "players"
          : replaceImageType === "management"
            ? "management"
            : replaceImageType === "gallery"
              ? "gallery"
              : replaceImageType === "news"
                ? "news"
                : "merch";
      const imageUrl = await uploadSelectedImage(replaceImageFile, folder);
      let success = false;
      let message = "Image replaced successfully!";
      let errorMessage = "Failed to replace image.";

      if (replaceImageType === "player") {
        const res = await updatePlayerImage(replaceImageId, imageUrl);
        success = Boolean(res.success);
        message = res.message || message;
        errorMessage = res.error || errorMessage;
        if (res.success && res.player) {
          const updatedPlayer = res.player;
          setClubData((prev) => ({
            ...prev,
            players: prev.players.map((player) =>
              player.id === updatedPlayer.id ? updatedPlayer : player
            ),
          }));
        }
      } else if (replaceImageType === "management") {
        const res = await updateManagementImage(replaceImageId, imageUrl);
        success = Boolean(res.success);
        message = res.message || message;
        errorMessage = res.error || errorMessage;
        if (res.success && res.member) {
          const updatedMember = res.member;
          setClubData((prev) => ({
            ...prev,
            management: prev.management.map((member) =>
              member.id === updatedMember.id ? updatedMember : member
            ),
          }));
        }
      } else if (replaceImageType === "gallery") {
        const res = await updateGalleryImage(replaceImageId, imageUrl, replaceImageNewCaption);
        success = Boolean(res.success);
        message = res.message || message;
        errorMessage = res.error || errorMessage;
        if (res.success && res.item) {
          const updatedItem = res.item;
          setClubData((prev) => ({
            ...prev,
            gallery: prev.gallery.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            ),
          }));
        }
      } else if (replaceImageType === "merch") {
        const res = await updateMerchandiseImage(replaceImageId, imageUrl);
        success = Boolean(res.success);
        message = res.message || message;
        errorMessage = res.error || errorMessage;
        if (res.success && res.item) {
          const updatedItem = res.item;
          setClubData((prev) => ({
            ...prev,
            merchandise: prev.merchandise.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            ),
          }));
        }
      } else {
        const res = await updateNewsImage(replaceImageId, imageUrl);
        success = Boolean(res.success);
        message = res.message || message;
        errorMessage = res.error || errorMessage;
        if (res.success && res.article) {
          const updatedArticle = res.article;
          setClubData((prev) => ({
            ...prev,
            news: prev.news.map((item) =>
              item.id === updatedArticle.id ? updatedArticle : item
            ),
          }));
        }
      }

      if (success) {
        showToast(message);
        setReplaceImageId(null);
        setReplaceImageFile(null);
        setReplaceImageNewCaption("");
      } else {
        showToast(errorMessage, "error");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Image replacement failed", "error");
    } finally {
      setAdminBusy(null);
    }
  };

  // ========== MERCHANDISE HANDLERS ==========
  const handleAddMerchandise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminMerchName || !adminMerchPrice) {
      showToast("Name and price are required", "error");
      return;
    }

    setAdminBusy("merch");
    try {
      const imageUrl = adminMerchFile
        ? await uploadSelectedImage(adminMerchFile, "merch")
        : "/images/shop-home-jersey.jpg";

      const res = await addMerchandise({
        name: adminMerchName,
        description: adminMerchDesc || "Official Kariobangi Legends merchandise.",
        price: parseInt(adminMerchPrice),
        imageUrl,
        sizes: adminMerchSizes,
        kitType: adminMerchType,
        stockStatus: adminMerchStockStatus,
      });

      if (res.success && res.item) {
        setClubData((prev) => ({
          ...prev,
          merchandise: [...prev.merchandise, res.item],
        }));
        showToast(res.message || "Merchandise added to shop!");
        setListedShopItemsOpen(true);
        setAdminMerchName("");
        setAdminMerchDesc("");
        setAdminMerchStockStatus("available");
        setAdminMerchPrice("");
        setAdminMerchFile(null);
      } else {
        showToast(res.error || "Failed to add item.", "error");
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Error uploading product photo", "error");
    } finally {
      setAdminBusy(null);
    }
  };

  const handleDeleteMerchandise = async (id: number, name: string) => {
    if (!confirm(`Remove "${name}" from the shop?`)) return;
    const res = await deleteMerchandise(id);
    if (res.success) {
      setClubData((prev) => ({
        ...prev,
        merchandise: prev.merchandise.filter((item) => item.id !== id),
      }));
      showToast(res.message || "Item removed.");
    } else {
      showToast(res.error || "Failed to delete.", "error");
    }
  };

  const handleClearAllMerchandise = async () => {
    if (clubData.merchandise.length === 0) {
      showToast("The shop is already empty.", "error");
      return;
    }
    if (
      !confirm(
        `Remove all ${clubData.merchandise.length} product(s) from the fan shop? This cannot be undone.`
      )
    ) {
      return;
    }

    setAdminBusy("merch-clear");
    try {
      const res = await clearAllMerchandise();
      if (res.success) {
        setClubData((prev) => ({ ...prev, merchandise: [] }));
        showToast(res.message || "Shop cleared.");
      } else {
        showToast(res.error || "Failed to clear shop.", "error");
      }
    } finally {
      setAdminBusy(null);
    }
  };

  const handleUpdateMerchandisePrice = async (id: number, priceValue: string) => {
    const price = Number(priceValue);
    if (!Number.isFinite(price) || price <= 0) {
      showToast("Enter a valid price greater than zero.", "error");
      return;
    }

    setAdminBusy("merch-price");
    try {
      const res = await updateMerchandisePrice(id, price);
      if (res.success && res.item) {
        setClubData((prev) => ({
          ...prev,
          merchandise: prev.merchandise.map((item) =>
            item.id === id ? res.item! : item
          ),
        }));
        setEditingMerchPriceId(null);
        setMerchPriceDraft("");
        setMerchAdminPriceDrafts((prev) => ({
          ...prev,
          [id]: String(res.item!.price),
        }));
        showToast(res.message || "Price updated.");
      } else {
        showToast(res.error || "Failed to update price.", "error");
      }
    } finally {
      setAdminBusy(null);
    }
  };

  const startEditingMerchPrice = (item: MerchandiseItem) => {
    setEditingMerchPriceId(item.id);
    setMerchPriceDraft(String(item.price));
  };

  const handleUpdateMerchandiseStockStatus = async (id: number, stockStatus: string) => {
    setAdminBusy("merch-stock");
    try {
      const res = await updateMerchandiseStockStatus(id, stockStatus);
      if (res.success && res.item) {
        setClubData((prev) => ({
          ...prev,
          merchandise: prev.merchandise.map((item) =>
            item.id === id ? res.item! : item
          ),
        }));
        showToast(res.message || "Stock status updated.");
      } else {
        showToast(res.error || "Failed to update stock status.", "error");
      }
    } finally {
      setAdminBusy(null);
    }
  };

  const handleUpdateMerchandiseCategory = async (id: number, kitType: string) => {
    const currentItem = clubData.merchandise.find((item) => item.id === id);
    if (currentItem && normalizeMerchandiseCategory(currentItem.kitType) === kitType) {
      return;
    }

    setAdminBusy("merch-category");
    try {
      const res = await updateMerchandiseCategory(id, kitType);
      if (res.success && res.item) {
        setClubData((prev) => ({
          ...prev,
          merchandise: prev.merchandise.map((item) =>
            item.id === id ? res.item! : item
          ),
        }));
        showToast(res.message || "Category updated.");
      } else {
        showToast(res.error || "Failed to move category.", "error");
      }
    } finally {
      setAdminBusy(null);
    }
  };

  // Product photo display — shows real photo or a styled fallback
  const renderProductPhoto = (item: MerchandiseItem) => {
    // If imageUrl is a real path (starts with /), show the image
    if (item.imageUrl.startsWith("/") || item.imageUrl.startsWith("http")) {
      return (
        <div className="relative h-48 sm:h-52 bg-white overflow-hidden group flex items-center justify-center p-2">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-contain group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          />
        </div>
      );
    }

    // Fallback CSS product card for items without real photos
    const kitColors: Record<string, { bg: string; border: string; accent: string; label: string }> = {
      jersey: { bg: "bg-slate-900", border: "border-yellow-500", accent: "text-yellow-500", label: "OFFICIAL JERSEY" },
      scarf: { bg: "bg-gradient-to-r from-slate-950 via-emerald-600 to-slate-950", border: "border-yellow-500", accent: "text-white", label: "SUPPORTER SCARF" },
      jumper: { bg: "bg-slate-800", border: "border-emerald-500", accent: "text-emerald-300", label: "CLUB JUMPER" },
      cap: { bg: "bg-amber-500", border: "border-slate-950", accent: "text-slate-950", label: "CLUB CAP" },
      socks: { bg: "bg-emerald-700", border: "border-white", accent: "text-white", label: "MATCH SOCKS" },
      tracksuit: { bg: "bg-slate-900", border: "border-emerald-500", accent: "text-emerald-400", label: "TRACKSUIT" },
      shorts: { bg: "bg-emerald-600", border: "border-yellow-400", accent: "text-white", label: "TRAINING SHORTS" },
      bag: { bg: "bg-slate-700", border: "border-yellow-500", accent: "text-yellow-400", label: "KIT BAG" },
      other: { bg: "bg-amber-500", border: "border-slate-950", accent: "text-slate-950", label: "CLUB MERCH" },
      home: { bg: "bg-slate-900", border: "border-yellow-500", accent: "text-yellow-500", label: "RESILIENCE BLACK" },
      "away-green": { bg: "bg-emerald-600", border: "border-white", accent: "text-white", label: "HOPE GREEN" },
      "away-white": { bg: "bg-white", border: "border-emerald-500", accent: "text-emerald-600", label: "PURE WHITE" },
      accessory: { bg: "bg-amber-500", border: "border-slate-950", accent: "text-slate-950", label: "ACCESSORY" },
    };

    const colors =
      kitColors[normalizeMerchandiseCategory(item.kitType)] || kitColors.other;

    return (
      <div className={`h-48 sm:h-52 ${colors.bg} ${colors.border} border-2 flex flex-col items-center justify-center relative`}>
        <div className="text-center space-y-3">
          <Shield className={`w-16 h-16 ${colors.accent} mx-auto`} />
          <p className={`text-sm font-black ${colors.accent} tracking-widest`}>KLFC</p>
          <p className={`text-[10px] font-bold ${colors.accent} uppercase tracking-widest`}>{colors.label}</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 p-4 text-center">
          <span className="text-yellow-400 text-sm font-black">Ksh {item.price.toLocaleString()}</span>
        </div>
      </div>
    );
  };

  const renderKitIcon = (kitType: string) => {
    switch (kitType) {
      case "home":
        return (
          <div className="relative w-24 h-28 mx-auto bg-slate-900 rounded-t-lg border-2 border-yellow-500 shadow-md flex flex-col justify-between p-2 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-yellow-500"></div>
            <div className="text-yellow-500 text-[10px] font-bold tracking-wider text-center">KLFC</div>
            <div className="w-12 h-12 rounded-full border border-yellow-500/30 flex items-center justify-center mx-auto bg-slate-950">
              <Shield className="w-6 h-6 text-yellow-500 fill-yellow-500" />
            </div>
            <div className="text-center text-[9px] text-yellow-500 font-bold uppercase">RESILIENCE</div>
          </div>
        );
      case "away-green":
        return (
          <div className="relative w-24 h-28 mx-auto bg-emerald-600 rounded-t-lg border-2 border-white shadow-md flex flex-col justify-between p-2 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-white"></div>
            <div className="text-white text-[10px] font-bold tracking-wider text-center">KLFC</div>
            <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center mx-auto bg-emerald-700">
              <Shield className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="text-center text-[9px] text-white font-bold uppercase">HOPE GREEN</div>
          </div>
        );
      case "away-white":
        return (
          <div className="relative w-24 h-28 mx-auto bg-white rounded-t-lg border-2 border-emerald-500 shadow-md flex flex-col justify-between p-2 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500"></div>
            <div className="text-emerald-700 text-[10px] font-bold tracking-wider text-center">KLFC</div>
            <div className="w-12 h-12 rounded-full border border-emerald-500/20 flex items-center justify-center mx-auto bg-slate-50">
              <Shield className="w-6 h-6 text-emerald-500 fill-emerald-500" />
            </div>
            <div className="text-center text-[9px] text-emerald-600 font-bold uppercase">PURE WHITE</div>
          </div>
        );
      case "scarf":
        return (
          <div className="w-24 h-12 mx-auto bg-gradient-to-r from-slate-950 via-emerald-600 to-slate-950 border border-yellow-500 rounded flex items-center justify-center text-[9px] text-white font-bold tracking-widest shadow-sm">
            KARIOBANGI
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 mx-auto bg-amber-500 rounded-full flex items-center justify-center text-white shadow-md">
            <Award className="w-8 h-8 text-slate-950" />
          </div>
        );
    }
  };

  const renderMerchandiseProductGrid = (items: MerchandiseItem[]) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((item) => {
        const sizesArray = item.sizes.split(",").map((s) => s.trim());
        const categoryMeta = getMerchandiseCategoryMeta(item.kitType);
        const stockMeta = getMerchandiseStockStatusMeta(item.stockStatus);
        const isAvailable = isMerchandiseAvailable(item.stockStatus);
        const productCopy = getImprovedMerchandiseCopy(item);
        const selectedSize = selectedSizes[item.id] || sizesArray[0];

        return (
          <div
            key={item.id}
            className={`bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition flex flex-col justify-between ${
              isAvailable ? "border-slate-100" : "border-slate-200 opacity-95"
            }`}
          >
            <div className="relative">
              {renderProductPhoto(item)}
              {canManageClubContent && (
                <div className="absolute top-3 right-3 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => openReplaceImage(item.id, "merch", item.imageUrl)}
                    className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg text-blue-600 hover:bg-white shadow cursor-pointer"
                    title="Replace product photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMerchandise(item.id, item.name)}
                    className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg text-rose-500 hover:bg-white shadow cursor-pointer"
                    title="Remove item from shop"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="px-3 pt-2.5 flex flex-wrap gap-1.5">
              <span className="bg-slate-950 text-yellow-400 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                {categoryMeta.label}
              </span>
              <span
                className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${stockMeta.badgeClass}`}
              >
                {stockMeta.label}
              </span>
            </div>

            <div className="p-3 pt-2 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-extrabold text-slate-950 text-sm leading-snug flex-1">
                    {productCopy.name}
                  </h3>
                  {canManageClubContent && editingMerchPriceId === item.id ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min={1}
                        value={merchPriceDraft}
                        onChange={(e) => setMerchPriceDraft(e.target.value)}
                        className="w-20 px-2 py-1 rounded-lg border border-emerald-200 text-[11px] font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateMerchandisePrice(item.id, merchPriceDraft)}
                        disabled={adminBusy === "merch-price"}
                        className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold uppercase hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMerchPriceId(null);
                          setMerchPriceDraft("");
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase hover:bg-slate-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                        {formatShopPrice(item.price)}
                      </span>
                      {canManageClubContent && (
                        <button
                          type="button"
                          onClick={() => startEditingMerchPrice(item)}
                          className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                          title="Edit price"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{productCopy.description}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] text-slate-400 font-bold uppercase">Select Size</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Size {selectedSize}
                  </p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {sizesArray.map((size) => (
                    <button
                      key={size}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => {
                        setSelectedSizes((prev) => ({
                          ...prev,
                          [item.id]: size,
                        }));
                        setExplicitShopSizes((prev) => ({ ...prev, [item.id]: true }));
                      }}
                      className={`px-2 py-0.5 text-[10px] rounded-md font-bold transition ${
                        !isAvailable
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : selectedSize === size
                            ? "bg-slate-950 text-yellow-400 cursor-pointer ring-2 ring-yellow-400/40"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedShopItemId(item.id)}
                className="w-full font-bold text-[10px] uppercase tracking-wider py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                View details
              </button>

              <button
                type="button"
                disabled={!isAvailable}
                onClick={() => addToCart(item, selectedSize)}
                className={`w-full font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-lg transition flex items-center justify-center gap-1 shadow-sm ${
                  isAvailable
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    : stockMeta.id === "out_of_stock"
                      ? "bg-rose-100 text-rose-700 cursor-not-allowed"
                      : "bg-amber-100 text-amber-800 cursor-not-allowed"
                }`}
              >
                {isAvailable ? (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" /> Add {selectedSize}
                  </>
                ) : (
                  stockMeta.buttonLabel
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const categoryGallery =
    selectedGalleryCategory === "All"
      ? clubData.gallery
      : clubData.gallery.filter(
          (item) => item.category === selectedGalleryCategory
        );

  const filteredGallery = categoryGallery.filter(
    (item) => canManageClubContent || isUploadedMediaUrl(item.imageUrl)
  );

  const filteredHighlights = useMemo(() => {
    const highlights = clubData.highlights ?? [];
    return selectedHighlightCategory === "All"
      ? highlights
      : highlights.filter((item) => item.category === selectedHighlightCategory);
  }, [clubData.highlights, selectedHighlightCategory]);

  const merchandiseByCategory = useMemo(
    () => groupMerchandiseByCategory(clubData.merchandise),
    [clubData.merchandise]
  );

  const shopCategoriesWithItems = useMemo(
    () => getMerchandiseCategoriesWithItems(clubData.merchandise),
    [clubData.merchandise]
  );

  const visibleShopCategories = useMemo(() => {
    if (selectedShopCategory === "All") {
      return shopCategoriesWithItems;
    }

    const category = MERCHANDISE_CATEGORIES.find((entry) => entry.id === selectedShopCategory);
    return category ? [category] : [];
  }, [selectedShopCategory, shopCategoriesWithItems]);

  const selectedShopItem = useMemo(
    () => clubData.merchandise.find((item) => item.id === selectedShopItemId) ?? null,
    [clubData.merchandise, selectedShopItemId]
  );

  const viewingPlayer = useMemo(
    () => clubData.players.find((player) => player.id === viewingPlayerId) ?? null,
    [clubData.players, viewingPlayerId]
  );

  const viewingManagementMember = useMemo(
    () => clubData.management.find((member) => member.id === viewingManagementId) ?? null,
    [clubData.management, viewingManagementId]
  );

  const relatedShopItems = useMemo(() => {
    if (!selectedShopItem) return [];
    const categoryId = normalizeMerchandiseCategory(selectedShopItem.kitType);
    const others = clubData.merchandise.filter((item) => item.id !== selectedShopItem.id);
    const sameCategory = others.filter(
      (item) => normalizeMerchandiseCategory(item.kitType) === categoryId
    );
    const otherCategories = others.filter(
      (item) => normalizeMerchandiseCategory(item.kitType) !== categoryId
    );
    return [...sameCategory, ...otherCategories].slice(0, 3);
  }, [clubData.merchandise, selectedShopItem]);

  const complementaryShopItems = useMemo(() => {
    if (selectedShopCategory === "All") return [];
    const visibleIds = new Set(
      visibleShopCategories.flatMap((category) =>
        (merchandiseByCategory.get(category.id) ?? []).map((item) => item.id)
      )
    );
    return clubData.merchandise.filter((item) => !visibleIds.has(item.id)).slice(0, 4);
  }, [
    clubData.merchandise,
    merchandiseByCategory,
    selectedShopCategory,
    visibleShopCategories,
  ]);

  const navAccountAction = useMemo(() => {
    if (customerProfile) {
      return {
        label: "My Account",
        mobileLabel: "My Account",
        title: `Signed in as ${customerProfile.fullName}`,
        signedIn: true,
        kind: "fan" as const,
      };
    }

    if (isAdminAuthenticated) {
      if (adminRole === "news_editor") {
        return {
          label: "Press Desk",
          mobileLabel: "Press Account",
          title: "Signed in as newspaper / press partner",
          signedIn: true,
          kind: "press" as const,
        };
      }

      return {
        label: "Admin Panel",
        mobileLabel: "Admin Panel",
        title: "Signed in as club administrator",
        signedIn: true,
        kind: "admin" as const,
      };
    }

    return {
      label: "Sign In",
      mobileLabel: "Sign In",
      title: "Sign in",
      signedIn: false,
      kind: "guest" as const,
    };
  }, [customerProfile, isAdminAuthenticated, adminRole]);

  const navAccountIsActive =
    activeTab === "account" || (isAdminAuthenticated && activeTab === "admin");

    useEffect(() => {
  if (!selectedGalleryImage || activeTab !== "gallery") return;

  const handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT")
    ) {
      return;
    }

    const currentIndex = filteredGallery.findIndex(
      (image) => image.id === selectedGalleryImage.id
    );

    if (event.key === "Escape") {
      setSelectedGalleryImage(null);
    }

    if (event.key === "ArrowLeft") {
      const previousIndex =
        currentIndex === 0
          ? filteredGallery.length - 1
          : currentIndex - 1;

      setSelectedGalleryImage(filteredGallery[previousIndex]);
    }

    if (event.key === "ArrowRight") {
      const nextIndex =
        currentIndex === filteredGallery.length - 1
          ? 0
          : currentIndex + 1;

      setSelectedGalleryImage(filteredGallery[nextIndex]);
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [selectedGalleryImage, filteredGallery, activeTab]);

useEffect(() => {
  if (activeTab !== "admin") return;

  const handleAdminKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT")
    ) {
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
    }
  };

  window.addEventListener("keydown", handleAdminKeyDown);
  return () => window.removeEventListener("keydown", handleAdminKeyDown);
}, [activeTab]);

  const goToTab = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAccountTab = () => {
    if (isAdminAuthenticated) {
      goToTab("admin");
      return;
    }

    goToTab("account");
  };

  const resumeAfterAuth = () => {
    if (isCartOpen || pendingCheckoutAfterAuth) {
      setPendingCheckoutAfterAuth(false);
      setIsCartOpen(true);
      if (cart.length > 0) {
        showToast("Your account is ready. Complete payment in your cart.");
      }
      return;
    }

    if (activeTab === "membership" || pendingMembershipAfterAuth) {
      setPendingMembershipAfterAuth(false);
      showToast("Your account is ready. Choose a plan and pay with M-Pesa.");
    }
  };

  const handleMembershipSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerProfile) {
      showToast("Sign in or register below to join.", "error");
      return;
    }

    if (fanMembership) {
      showToast("You already have an active membership. It is on your account card.");
      goToTab("account");
      return;
    }

    const plan = MEMBERSHIP_PLANS.find((item) => item.id === selectedMembershipPlanId);
    if (!plan) {
      showToast("Choose a membership plan.", "error");
      return;
    }

    if (!membershipPhone.trim()) {
      showToast("Enter your M-Pesa phone number.", "error");
      return;
    }

    startTransition(async () => {
      setMembershipPaymentPending(true);
      setMembershipPaymentMessage("");

      try {
        const response = await fetch("/api/mpesa/membership-stkpush", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan.id,
            phone: membershipPhone,
          }),
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
          showToast(data.error || "Unable to start membership payment.", "error");
          setMembershipPaymentPending(false);
          return;
        }

        const membershipId = data.membershipId;
        setMembershipPaymentMessage(
          `M-Pesa payment request sent to ${membershipPhone}. Enter your PIN to complete Ksh ${plan.price.toLocaleString()}.`
        );

        let attempts = 0;
        const maxAttempts = 30;

        const checkMembershipStatus = async () => {
          attempts += 1;

          try {
            const statusResponse = await fetch(
              `/api/mpesa/membership-status?membershipId=${membershipId}&phone=${encodeURIComponent(membershipPhone)}`,
              { method: "GET", cache: "no-store", credentials: "include" }
            );
            const statusData = await statusResponse.json();

            if (statusResponse.ok && statusData.success) {
              if (statusData.paymentStatus === "paid") {
                setMembershipPaymentMessage(
                  `Welcome in. Payment confirmed. Receipt: ${statusData.mpesaReceiptNumber || "confirmed"}.`
                );
                showToast("You are now an official Kariobangi Legends supporter.");
                await loadCustomerMembership();
                setMembershipPaymentPending(false);
                return;
              }

              if (statusData.paymentStatus === "failed") {
                setMembershipPaymentMessage("");
                showToast("M-Pesa payment was cancelled or failed. Please try again.", "error");
                setMembershipPaymentPending(false);
                return;
              }
            }

            if (attempts < maxAttempts) {
              setTimeout(checkMembershipStatus, 3000);
            } else {
              setMembershipPaymentMessage(
                "We are still waiting for M-Pesa. If you paid, refresh My Account in a minute."
              );
              setMembershipPaymentPending(false);
            }
          } catch (error) {
            console.error("Membership status poll failed:", error);
            if (attempts < maxAttempts) {
              setTimeout(checkMembershipStatus, 3000);
            } else {
              setMembershipPaymentPending(false);
            }
          }
        };

        setTimeout(checkMembershipStatus, 3000);
      } catch (error) {
        console.error("Membership payment failed:", error);
        showToast("Unable to start membership payment.", "error");
        setMembershipPaymentPending(false);
      }
    });
  };

  const renderFanAuthPanel = (heading: string, description: string, compact = false) => (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <div
        className={
          compact
            ? "bg-white rounded-2xl border border-slate-200 p-4 space-y-4"
            : "bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5"
        }
      >
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            {heading}
          </h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setAccountView("login");
              setResetStep("request");
            }}
            className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
              accountView === "login"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAccountView("register");
              setResetStep("request");
            }}
            className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
              accountView === "register"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Register
          </button>
        </div>

        {accountView === "login" ? (
          <form onSubmit={handleCustomerLogin} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Phone or Email
              </label>
              <input
                type="text"
                placeholder="e.g. 0712345678 or you@example.com"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <PasswordInput
                value={loginPassword}
                onChange={setLoginPassword}
                placeholder="Your account password"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
            >
              Sign In
            </button>
          </form>
        ) : (
          <form onSubmit={handleCustomerRegister} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Full Name
              </label>
              <input
                type="text"
                placeholder="As on M-PESA"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                M-PESA Phone
              </label>
              <input
                type="tel"
                placeholder="e.g. 0712345678"
                value={registerPhone}
                onChange={(e) => setRegisterPhone(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Email (optional)
              </label>
              <input
                type="email"
                placeholder="For receipts"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <PasswordInput
                value={registerPassword}
                onChange={setRegisterPassword}
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
            >
              Create Account
            </button>
          </form>
        )}

        <button
          type="button"
          aria-expanded={showFanPasswordReset}
          onClick={() => {
            setShowFanPasswordReset((open) => {
              if (open) setResetStep("request");
              return !open;
            });
          }}
          className="w-full text-[10px] font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-800 cursor-pointer"
        >
          {showFanPasswordReset ? "Hide password reset" : "Forgot your password?"}
        </button>
      </div>

      {showFanPasswordReset && (
        <div
          className={
            compact
              ? "bg-white rounded-2xl border border-emerald-100 p-4 space-y-4"
              : "bg-white rounded-3xl border border-emerald-100 shadow-sm p-6 space-y-5"
          }
        >
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-950 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Reset Fan Password
            </h3>
            <p className="text-xs text-slate-600">
              Enter your M-PESA phone number to receive a 6-digit SMS code.
            </p>
          </div>

          {resetStep === "request" ? (
            <form onSubmit={handleCustomerRequestReset} className="space-y-3">
              <input
                type="tel"
                placeholder="e.g. 0712345678"
                value={resetPhone}
                onChange={(e) => setResetPhone(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={isFanResetPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {isFanResetPending ? "Sending..." : "Send Reset Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCustomerCompleteReset} className="space-y-3">
              <p className="text-xs text-slate-500">
                Check SMS on {resetPhone || "your phone"} and choose a new password.
              </p>
              <input
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
              <PasswordInput
                value={resetNewPassword}
                onChange={setResetNewPassword}
                placeholder="New password"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <PasswordInput
                value={resetConfirmPassword}
                onChange={setResetConfirmPassword}
                placeholder="Confirm password"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="submit"
                disabled={isFanResetPending}
                className="w-full bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase tracking-wider py-3 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {isFanResetPending ? "Updating..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );

  const desktopNavLinkClass = (isActive: boolean) =>
    `relative px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
      isActive
        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  const desktopNavTriggerClass = (isActive: boolean) =>
    `${desktopNavLinkClass(isActive)} flex items-center gap-1 ${
      isActive ? "" : "group-hover:bg-white group-hover:shadow-sm group-hover:ring-1 group-hover:ring-emerald-200/50"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white overflow-x-hidden">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 rounded-xl p-4 shadow-xl border animate-bounce flex items-start gap-3 bg-white text-slate-900 border-emerald-500">
          <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Notification Info</p>
            <p className="text-xs text-slate-600 mt-1">{toastMessage.text}</p>
          </div>
        </div>
      )}


      {/* Main Header — fixed so it stays visible while scrolling */}
      <header
        className={`fixed top-0 inset-x-0 z-[60] backdrop-blur-xl border-b transition-all duration-300 ${
          isHeaderElevated
            ? "bg-white/98 border-slate-200 shadow-[0_12px_36px_-10px_rgba(15,23,42,0.28)]"
            : "bg-white/95 border-slate-200/80 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]"
        }`}
      >

        {/* Top club strip */}
        <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between gap-2 sm:gap-4 min-w-0">

            <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300 min-w-0 truncate">
              <span className="inline-flex items-center gap-1.5 text-yellow-400">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                Est. 2018
              </span>
              <span className="text-slate-600">|</span>
              <span>Nairobi County, Kenya</span>
            </div>

            <p className="hidden lg:block text-[10px] text-slate-400 tracking-wide">
              From Kariobangi North slums to the world, molding football legends
            </p>

            <div className="hidden sm:flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
              <Trophy className="w-3 h-3" />
              Official Club Site
            </div>

          </div>
        </div>

        {/* Main navigation bar */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-[76px] sm:min-h-[88px] flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">

            {/* Club brand */}
            <button
              type="button"
              onClick={() => goToTab("home")}
              className="flex items-center gap-3 sm:gap-4 min-w-0 cursor-pointer group shrink"
            >
              <div className="relative shrink-0">
                <Image
                  src="/assets/logo.png"
                  alt="Kariobangi Legends FC badge"
                  width={80}
                  height={80}
                  priority
                  className="w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] md:w-20 md:h-20 object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="min-w-0 text-left">
                <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                  <h1 className="font-black italic text-sm sm:text-lg md:text-xl tracking-[-0.04em] text-slate-950 leading-none uppercase">
                    KARIOBANGI
                  </h1>
                  <span className="font-black italic text-sm sm:text-lg md:text-xl tracking-[-0.04em] text-emerald-600 leading-none uppercase">
                    LEGENDS
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 tracking-[0.16em] uppercase">
                    Football Club
                  </span>
                  <span className="w-1 h-1 rounded-full bg-yellow-400" />
                  <span className="text-[8px] sm:text-[9px] font-bold text-emerald-600 tracking-[0.12em] uppercase">
                    Est. 2018
                  </span>
                </div>
              </div>
            </button>

            {/* Desktop navigation */}
            <nav className="hidden lg:flex items-center gap-0.5 p-1 rounded-2xl bg-white/70 border border-slate-200/80 shadow-sm backdrop-blur-sm">

              <button
                type="button"
                onClick={() => goToTab("home")}
                className={desktopNavLinkClass(activeTab === "home")}
              >
                Home
              </button>

              <DesktopNavDropdown
                label="Club"
                isActive={["history", "management"].includes(activeTab)}
                triggerClassName={desktopNavTriggerClass}
                title="Club"
                subtitle="Identity, leadership, and our journey"
                activeTab={activeTab}
                onNavigate={goToTab}
                items={[
                  {
                    tabId: "history",
                    label: "Our Story",
                    description: "Club history and journey from Kariobangi",
                    icon: BookOpen,
                  },
                  {
                    tabId: "management",
                    label: "Management",
                    description: "Leadership board and technical staff",
                    icon: Shield,
                  },
                ]}
              />

              <button
                type="button"
                onClick={() => goToTab("squad")}
                className={desktopNavLinkClass(activeTab === "squad")}
              >
                Squad
              </button>

              <DesktopNavDropdown
                label="Matches"
                isActive={activeTab === "fixtures"}
                triggerClassName={desktopNavTriggerClass}
                title="Matches"
                subtitle="Fixtures, results, and matchday info"
                activeTab={activeTab}
                onNavigate={goToTab}
                items={[
                  {
                    tabId: "fixtures",
                    label: "Fixtures & Results",
                    description: "Upcoming fixtures and completed results",
                    icon: CalendarDays,
                  },
                ]}
              />

              <button
                type="button"
                onClick={() => goToTab("news")}
                className={desktopNavLinkClass(activeTab === "news")}
              >
                News
              </button>

              <DesktopNavDropdown
                label="Media"
                isActive={["gallery", "highlights"].includes(activeTab)}
                triggerClassName={desktopNavTriggerClass}
                title="Media"
                subtitle="Photos, videos, and matchday moments"
                activeTab={activeTab}
                onNavigate={goToTab}
                items={[
                  {
                    tabId: "gallery",
                    label: "Gallery",
                    description: "Matchday, training, and community photos",
                    icon: Images,
                  },
                  {
                    tabId: "highlights",
                    label: "Highlights",
                    description: "Goals, skills, and official video clips",
                    icon: Film,
                  },
                ]}
              />

              <button
                type="button"
                onClick={() => goToTab("fanzone")}
                className={desktopNavLinkClass(activeTab === "fanzone")}
              >
                Fan Zone
              </button>

              <button
                type="button"
                onClick={() => goToTab("shop")}
                className={desktopNavLinkClass(activeTab === "shop")}
              >
                Shop
              </button>

              <button
                type="button"
                onClick={() => goToTab("membership")}
                className={desktopNavLinkClass(activeTab === "membership")}
              >
                Join
              </button>

              <button
                type="button"
                onClick={() => goToTab("contact")}
                className={desktopNavLinkClass(activeTab === "contact")}
              >
                Contact
              </button>

              <button
                type="button"
                onClick={() => goToTab("donors")}
                className={desktopNavLinkClass(activeTab === "donors")}
              >
                Donations
              </button>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  navAccountAction.signedIn ? openAccountTab() : goToTab("account")
                }
                className={`flex items-center gap-2 border font-bold text-[10px] uppercase tracking-wider px-2.5 sm:px-3.5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
                  navAccountIsActive
                    ? navAccountAction.kind === "admin" || navAccountAction.kind === "press"
                      ? "border-slate-800 bg-slate-950 text-yellow-400 shadow-md shadow-slate-950/20"
                      : "border-emerald-300 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : navAccountAction.kind === "admin"
                      ? "border-slate-900 bg-slate-950 text-yellow-400 hover:bg-slate-900"
                      : navAccountAction.kind === "press"
                        ? "border-slate-800 bg-slate-900 text-emerald-300 hover:bg-slate-800"
                        : navAccountAction.signedIn
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                }`}
                title={navAccountAction.title}
              >
                {navAccountAction.kind === "admin" ? (
                  <Settings className="w-4 h-4 shrink-0" />
                ) : (
                  <User className="w-4 h-4 shrink-0" />
                )}
                <span className="max-lg:sr-only">{navAccountAction.label}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 cursor-pointer shadow-sm"
                title="Open Shopping Cart"
                aria-label="Open Shopping Cart"
              >
                <ShoppingBag className="w-[18px] h-[18px]" />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => goToTab("donors")}
                className="hidden 2xl:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <HeartHandshake className="w-4 h-4" />
                Donate
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden w-11 h-11 flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer ${
                  mobileMenuOpen
                    ? "border-slate-950 bg-slate-950 text-yellow-400"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                }`}
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>

          {/* Mobile navigation */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-xl shadow-slate-950/10 max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain">
              <div className="py-5 space-y-5">

                  {!navAccountAction.signedIn && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 px-1">
                        Account
                      </p>
                      <button
                        type="button"
                        onClick={() => goToTab("account")}
                        className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border transition-all ${
                          activeTab === "account"
                            ? "bg-slate-950 text-yellow-400 border-slate-950 shadow-md"
                            : "bg-white text-slate-700 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                        }`}
                      >
                        <User className="w-4 h-4 shrink-0" />
                        <span>
                          <span className="block text-xs font-bold uppercase tracking-wide">
                            Sign In
                          </span>
                          <span
                            className={`block text-[11px] mt-0.5 leading-snug ${
                              activeTab === "account" ? "text-yellow-400/80" : "text-slate-500"
                            }`}
                          >
                            Continue with your password
                          </span>
                        </span>
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 px-1">
                      Main
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: "home", label: "Home", icon: Home },
                        ...(navAccountAction.signedIn
                          ? [
                              {
                                id: "account",
                                label: navAccountAction.mobileLabel,
                                icon:
                                  navAccountAction.kind === "admin" ? Settings : User,
                              },
                            ]
                          : []),
                        { id: "news", label: "Club News", icon: Newspaper },
                        { id: "shop", label: "Merchandise Shop", icon: ShoppingBag },
                        { id: "membership", label: "Join as a Fan", icon: Award },
                        { id: "donors", label: "Donations", icon: HeartHandshake },
                        { id: "contact", label: "Contact Centre", icon: Phone },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            type="button"
                            key={tab.id}
                            onClick={() =>
                              tab.id === "account" ? openAccountTab() : goToTab(tab.id)
                            }
                            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border transition-all ${
                              isActive
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                                : "bg-white text-slate-700 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="text-xs font-bold uppercase tracking-wide">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <MobileNavSection
                    title="Club"
                    subtitle="Story, leadership, squad, and matches"
                    activeTab={activeTab}
                    onNavigate={goToTab}
                    items={[
                      {
                        id: "history",
                        label: "Our Story",
                        description: "Club history and journey",
                        icon: BookOpen,
                      },
                      {
                        id: "management",
                        label: "Management",
                        description: "Leadership and technical team",
                        icon: Shield,
                      },
                      {
                        id: "squad",
                        label: "Squad",
                        description: "First team and youth players",
                        icon: Users,
                      },
                      {
                        id: "fixtures",
                        label: "Matches",
                        description: "Fixtures and results",
                        icon: CalendarDays,
                      },
                    ]}
                  />

                  <MobileNavSection
                    title="Media"
                    subtitle="Photos and official video highlights"
                    activeTab={activeTab}
                    onNavigate={goToTab}
                    items={[
                      {
                        id: "gallery",
                        label: "Gallery",
                        description: "Matchday and community photos",
                        icon: Images,
                      },
                      {
                        id: "highlights",
                        label: "Highlights",
                        description: "Goals, skills, and video clips",
                        icon: Film,
                      },
                    ]}
                  />

                  <MobileNavSection
                    title="Fan Zone"
                    subtitle="Connect with fellow supporters"
                    activeTab={activeTab}
                    onNavigate={goToTab}
                    items={[
                      {
                        id: "fanzone",
                        label: "Supporter Board",
                        description: "Messages from the Legends family",
                        icon: MessageCircle,
                      },
                    ]}
                  />

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => goToTab("donors")}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition cursor-pointer shadow-lg shadow-emerald-600/20"
                    >
                      <HeartHandshake className="w-4 h-4" />
                      Donate
                    </button>
                  </div>

                </div>
              </div>
            )}

        </div>
      </header>

      {/* Spacer matching fixed header height (top strip + nav bar) */}
      <div aria-hidden="true" className="h-[7rem] sm:h-[7.75rem] shrink-0" />

{/* Main body wrapper */}
<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full min-w-0">
        
        {/* ================= TAB: HOME ================= */}
        {activeTab === "home" && (
          <div className="space-y-12">
         {/* ================= HERO BANNER ================= */}
<div className="relative min-h-[520px] sm:min-h-0 sm:aspect-[3/2] rounded-3xl overflow-hidden bg-slate-950 text-white border border-slate-800 shadow-2xl">

  {/* Hero background image — original file, full frame, no extra compression */}
  <div className="absolute inset-0">
    <Image
      src="/assets/hero-team.jpg"
      alt="Kariobangi Legends FC team photo"
      fill
      priority
      sizes="100vw"
      className="object-contain object-center contrast-[1.08] saturate-[1.08] brightness-[1.08]"
    />
  </div>

  {/* Light overlays — text stays readable, jerseys and faces stay clear */}
  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-slate-950/15 to-transparent" />
  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-slate-950/10" />

  {/* Hero content over the background photo */}
  <div className="relative z-10 min-h-[520px] sm:min-h-0 sm:h-full flex items-center">

    <div className="w-full p-6 sm:p-10 md:p-14 lg:p-16">

      <div className="max-w-4xl space-y-4 sm:space-y-5 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">

        {/* Club status */}
        <div className="flex flex-wrap items-center gap-2">

          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/90 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            FKF Division One
          </span>

          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-slate-200 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
            Nairobi, Kenya
          </span>

        </div>


        {/* Main heading */}
        <div className="space-y-1">

          <p className="text-yellow-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.25em]">
            Welcome to the Legends
          </p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.9]">

            KARIOBANGI

            <span className="block text-yellow-400">
              LEGENDS FC
            </span>

          </h1>

        </div>


        {/* Club statement */}
        <p className="max-w-2xl text-xs sm:text-sm md:text-base text-slate-200 leading-relaxed font-medium">

          Born in Kariobangi North, Nairobi, we are more than a football club.
          We are a community built on{" "}

          <span className="text-yellow-400 font-bold">
            talent, discipline, resilience and hope.
          </span>{" "}

          Our mission is to empower young people through football and education.

        </p>


        {/* CTA buttons */}
        <div className="flex flex-wrap gap-2.5 pt-1">

          <button
            onClick={() => setActiveTab("fixtures")}
            className="group bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-wider px-5 sm:px-6 py-3 rounded-xl transition-all duration-300 shadow-xl hover:shadow-yellow-400/20 flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            Match Centre

            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>


          <button
            onClick={() => setActiveTab("squad")}
            className="group bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider px-5 sm:px-6 py-3 rounded-xl transition-all duration-300 backdrop-blur-sm flex items-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            Meet the Team

            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>


          <button
            onClick={() => setActiveTab("donors")}
            className="group bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider px-5 sm:px-6 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
          >
            <HeartHandshake className="w-4 h-4" />
            Donate
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>


          <button
            onClick={() => setActiveTab("history")}
            className="bg-slate-950/70 hover:bg-slate-900 border border-yellow-400/30 text-yellow-400 font-black text-[10px] sm:text-xs uppercase tracking-wider px-5 sm:px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            Our Story
          </button>

        </div>


        {/* Club identity strip */}
        <div className="pt-2">

          <div className="inline-flex flex-wrap items-center gap-4 sm:gap-6 px-4 py-3 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">

            <div>
              <p className="text-yellow-400 text-base sm:text-lg font-black">
                2018
              </p>

              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                Founded
              </p>
            </div>


            <div className="h-7 w-px bg-white/10 hidden sm:block" />


            <div>
              <p className="text-emerald-400 text-base sm:text-lg font-black">
                KARIOBANGI
              </p>

              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                Home
              </p>
            </div>


            <div className="h-7 w-px bg-white/10 hidden sm:block" />


            <div>
              <p className="text-white text-base sm:text-lg font-black">
                COMMUNITY
              </p>

              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                Our Foundation
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>

  </div>


  {/* Bottom accent */}
  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-yellow-400 to-emerald-500" />

</div>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                <div className="space-y-2 max-w-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">
                    Official Supporters
                  </p>
                  <h2 className="text-2xl font-black text-slate-950 tracking-tight">
                    Join the Legends
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Youth Fan Ksh 500 or Official Fan Ksh 1,500 for one year. You get a digital card
                    in My Account and {MEMBER_SHOP_DISCOUNT_PERCENT}% off shop kits. Donate separately
                    if you want to give extra today.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => goToTab("membership")}
                  className="inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 text-yellow-400 font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  Become a member
                </button>
              </div>
            </section>

            {/* ================= NEXT MATCH ================= */}
{upcomingFixtures.length > 0 && (
  <section className="space-y-5">

    {/* Section heading */}
    <div className="flex items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
            Matchday
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
          Next Match
        </h2>
      </div>

      <button
        onClick={() => setActiveTab("fixtures")}
        className="hidden sm:flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
      >
        Full Fixtures
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>

    {/* Match card */}
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl">

      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-950" />

      <div className="absolute -top-32 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 right-0 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl" />

      {/* Top match information */}
      <div className="relative z-10 px-5 sm:px-8 pt-6 sm:pt-8">

        <div className="flex flex-wrap items-center justify-between gap-3">

          {/* Next match badge */}
          <span className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Next Match
          </span>

          {/* Home / Away */}
          <span
            className={`px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${
              upcomingFixtures[0].isHome
                ? "bg-yellow-400 text-slate-950"
                : "bg-white/10 text-slate-200 border border-white/10"
            }`}
          >
            {upcomingFixtures[0].isHome ? "Home Match" : "Away Match"}
          </span>

        </div>

      </div>

      {/* Teams */}
      <div className="relative z-10 px-5 sm:px-8 py-8 sm:py-12">

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-8 md:gap-6">

          {/* ================= HOME TEAM ================= */}
          <div className="flex flex-col items-center text-center">

            {/* Logo */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center mb-4">
              <Image
                src="/assets/logo.png"
                alt="Kariobangi Legends FC"
                width={112}
                height={112}
                className="w-full h-full object-contain drop-shadow-2xl"
              />
            </div>

            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 mb-2">
              {upcomingFixtures[0].isHome ? "Home" : "Away"}
            </p>

            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              KARIOBANGI
            </h3>

            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-yellow-400 tracking-tight">
              LEGENDS FC
            </h3>

          </div>

          {/* ================= VS ================= */}
          <div className="flex flex-col items-center">

            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-xl">
              <span className="text-xl sm:text-2xl font-black text-white">
                VS
              </span>
            </div>

          </div>

          {/* ================= OPPONENT ================= */}
          <div className="flex flex-col items-center text-center">

            {/* Opponent logo */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border border-white/20 flex items-center justify-center shadow-xl mb-4 overflow-hidden p-2">
              {upcomingFixtures[0].opponentLogoUrl ? (
                <Image
                  src={upcomingFixtures[0].opponentLogoUrl}
                  alt={`${upcomingFixtures[0].opponent} logo`}
                  width={112}
                  height={112}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Shield className="w-12 h-12 sm:w-14 sm:h-14 text-slate-400" />
              )}
            </div>

            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-2">
              Opponent
            </p>

            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              {upcomingFixtures[0].opponent}
            </h3>

          </div>

        </div>

      </div>

      {/* Match details */}
      <div className="relative z-10 border-t border-white/10 bg-black/20">

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">

          {/* Date */}
          <div className="flex items-center justify-center gap-3 px-5 py-5">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-yellow-400" />
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-widest font-black text-slate-500">
                Kick-off
              </p>
              <p className="text-sm font-bold text-white">
                {formatKickoff(upcomingFixtures[0].date)}
              </p>
            </div>
          </div>

          {/* Venue */}
          <a
            href={getGoogleDirectionsUrl(upcomingFixtures[0].venue)}
            target="_blank"
            rel="noopener noreferrer"
            title="Get directions on Google Maps"
            className="group flex items-center justify-center gap-3 px-5 py-5 cursor-pointer transition hover:bg-white/5"
          >
            <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-emerald-400/20 flex items-center justify-center transition">
              <MapPin className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-widest font-black text-slate-500">
                Venue
              </p>
              <p className="text-sm font-bold text-white truncate max-w-[180px] group-hover:underline">
                {upcomingFixtures[0].venue}
              </p>
              {isClubHomeVenue(upcomingFixtures[0].venue) && (
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  {HOME_GROUND.landmark}, {HOME_GROUND.constituency}
                </p>
              )}
            </div>
          </a>

          {/* Status */}
          <div className="flex items-center justify-center gap-3 px-5 py-5">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Activity className="w-5 h-5 text-rose-400" />
            </div>

            <div>
              <p className="text-[9px] uppercase tracking-widest font-black text-slate-500">
                Status
              </p>
              <p className="text-sm font-bold text-white capitalize">
                {getMatchStatusMeta(upcomingFixtures[0]).label}
              </p>
            </div>
          </div>

        </div>

      </div>

      <div className="relative z-10 px-5 sm:px-8 pt-4">
        <MatchCountdown date={upcomingFixtures[0].date} />
      </div>

      <div className="relative z-10 px-5 sm:px-8 pb-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 sm:px-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mb-2">
            Match preview
          </p>
          <p className="text-sm text-slate-200 leading-relaxed">
            {getMatchTypeMeta(upcomingFixtures[0].matchType).label}{" "}
            {upcomingFixtures[0].isHome ? "at home" : "on the road"} against{" "}
            {upcomingFixtures[0].opponent}. Kick-off {formatKickoff(upcomingFixtures[0].date)} at{" "}
            {upcomingFixtures[0].venue}.
            {recentForm.length > 0
              ? ` Recent league form: ${recentForm
                  .map((result) => getResultLabel(result))
                  .join(" · ")}.`
              : ""}
          </p>
        </div>
      </div>

      {/* Match Centre + Directions */}
      <div className="relative z-10 p-5 sm:p-6 border-t border-white/10 space-y-3">

        <button
          onClick={() => setActiveTab("fixtures")}
          className="w-full group flex items-center justify-center gap-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black uppercase tracking-wider text-xs sm:text-sm py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-yellow-400/20 cursor-pointer"
        >
          <Trophy className="w-4 h-4" />
          Match Centre
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <GetDirectionsLink
          venue={upcomingFixtures[0].venue}
          variant="outline-dark"
          label={upcomingFixtures[0].isHome ? "Directions to the Ground" : "Directions to Venue"}
          className="w-full py-4 text-xs sm:text-sm"
        />

      </div>

    </div>

    {recentFixtures[0] && (
      <div className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
              Last time out
            </p>
            <h3 className="text-lg sm:text-xl font-black text-slate-950">
              {(() => {
                const lastMatch = recentFixtures[0];
                const result = getMatchResult(lastMatch);
                const { home, away } = getHomeAwayTeams(lastMatch);
                return `${home.name} ${lastMatch.homeScore ?? "-"}-${lastMatch.awayScore ?? "-"} ${away.name}`;
              })()}
            </h3>
            <p className="text-sm text-slate-500">
              {getMatchTypeMeta(recentFixtures[0].matchType).label} · {formatKickoff(recentFixtures[0].date)}
              {getMatchResult(recentFixtures[0])
                ? ` · ${getResultLabel(getMatchResult(recentFixtures[0])!)}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("fixtures")}
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-yellow-400"
          >
            Full recap
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )}

    {/* Mobile fixtures link */}
    <button
      onClick={() => setActiveTab("fixtures")}
      className="sm:hidden w-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
    >
      View Full Fixtures
      <ArrowRight className="w-4 h-4" />
    </button>

  </section>
)}
    {/* ================= CLUB GALLERY CAROUSEL ================= */}
<div className="space-y-6">

  {/* Section heading */}
  <div className="flex items-end justify-between gap-4">

    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-8 h-px bg-yellow-400" />
        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.28em] text-emerald-600">
          Club Media
        </span>
      </div>

      <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
        Life at Kariobangi Legends
      </h3>

      <p className="text-sm text-slate-500 mt-2 max-w-xl">
        Matchdays, training, and community — the stories behind the crest.
      </p>
    </div>

    <button
      onClick={() => setActiveTab("gallery")}
      className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-800 shadow-sm hover:border-emerald-300 hover:text-emerald-700 transition cursor-pointer"
    >
      Full gallery
      <ArrowRight className="w-4 h-4" />
    </button>

  </div>


  {/* ================= AUTO CAROUSEL ================= */}
  {carouselGallery.length > 0 ? (
    <div
      className="overflow-hidden rounded-[1.75rem] bg-slate-950 shadow-[0_28px_80px_-32px_rgba(15,23,42,0.7)] ring-1 ring-slate-900/10"
      onMouseEnter={() => setGalleryCarouselPaused(true)}
      onMouseLeave={() => setGalleryCarouselPaused(false)}
    >
      <div
        className="relative aspect-[4/3] sm:aspect-[16/10] bg-slate-950 touch-pan-y cursor-grab active:cursor-grabbing select-none"
        onTouchStart={(e) => handleCarouselDragStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={(e) => handleCarouselDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
        onPointerDown={(e) => {
          if (e.pointerType === "touch") return;
          handleCarouselDragStart(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (e.pointerType === "touch") return;
          handleCarouselDragEnd(e.clientX, e.clientY);
        }}
      >
          {carouselGallery.map((item, index) => (
            <div
              key={item.id}
              onClick={() => {
                if (carouselDidSwipeRef.current) {
                  carouselDidSwipeRef.current = false;
                  return;
                }
                if (index !== safeGalleryCarouselIndex) return;
                setActiveTab("gallery");
                setSelectedGalleryImage(item);
              }}
              role="button"
              aria-label="View full-size photo"
              className={`group/photo absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-out ${
                index === safeGalleryCarouselIndex
                  ? "opacity-100 z-10 cursor-pointer"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <Image
                src={item.imageUrl}
                alt=""
                aria-hidden="true"
                fill
                sizes="100vw"
                className="scale-110 object-cover opacity-30 blur-2xl"
              />
              <Image
                src={item.imageUrl}
                alt={item.caption || "Kariobangi Legends FC"}
                fill
                sizes="100vw"
                className={`z-10 object-contain transition-transform ease-out ${
                  index === safeGalleryCarouselIndex
                    ? "scale-110 duration-[6000ms]"
                    : "scale-100 duration-0"
                }`}
              />
              <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-slate-950/0 group-hover/photo:bg-slate-950/20 transition-colors duration-300">
                <span className="w-12 h-12 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover/photo:opacity-100 scale-90 group-hover/photo:scale-100 transition-all duration-300">
                  <Maximize2 className="w-5 h-5 text-white" />
                </span>
              </span>
            </div>
          ))}

          <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-slate-950 via-slate-950/10 to-slate-950/35" />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-24 bg-gradient-to-r from-slate-950/40 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24 bg-gradient-to-l from-slate-950/40 to-transparent" />

          <div className="absolute left-4 top-4 z-30 flex items-center gap-2 sm:left-6 sm:top-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md ring-1 ring-white/15">
              <Camera className="h-3 w-3 text-yellow-400" />
              From the ground
            </span>
          </div>

          <div className="absolute right-4 top-4 z-30 flex items-center gap-2 sm:right-6 sm:top-6">
            <span className="rounded-full bg-slate-950/50 px-3 py-1 font-mono text-[11px] font-bold tabular-nums text-yellow-400 backdrop-blur-md ring-1 ring-white/10">
              {String(safeGalleryCarouselIndex + 1).padStart(2, "0")}
              <span className="mx-1 text-white/40">/</span>
              {String(carouselGallery.length).padStart(2, "0")}
            </span>
            {carouselGallery.length > 1 && (
              <button
                type="button"
                onClick={() => setGalleryCarouselPaused((paused) => !paused)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-md hover:bg-white/20"
                aria-label={galleryCarouselPaused ? "Play slideshow" : "Pause slideshow"}
              >
                {galleryCarouselPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          {carouselGallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={goToPrevCarouselSlide}
                className="absolute left-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md transition hover:bg-yellow-400 hover:text-slate-950 sm:left-5 sm:h-12 sm:w-12"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goToNextCarouselSlide}
                className="absolute right-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md transition hover:bg-yellow-400 hover:text-slate-950 sm:right-5 sm:h-12 sm:w-12"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {carouselGallery[safeGalleryCarouselIndex] && (
            <div className="absolute inset-x-0 bottom-0 z-30 p-4 sm:p-7">
              <div className="max-w-xl rounded-2xl bg-slate-950/55 p-4 sm:p-5 ring-1 ring-white/10 backdrop-blur-md">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {carouselGallery[safeGalleryCarouselIndex].category && (
                    <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-white">
                      {carouselGallery[safeGalleryCarouselIndex].category}
                    </span>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                    {new Date(carouselGallery[safeGalleryCarouselIndex].createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-base sm:text-2xl font-black leading-tight text-white">
                  {carouselGallery[safeGalleryCarouselIndex].caption || "Kariobangi Legends FC"}
                </p>
              </div>
            </div>
          )}

          {carouselGallery.length > 1 && !galleryCarouselPaused && (
            <div className="absolute inset-x-0 bottom-0 z-30 h-0.5 bg-white/10">
              <div
                key={safeGalleryCarouselIndex}
                className="h-full origin-left bg-gradient-to-r from-yellow-400 to-emerald-400"
                style={{ animation: "klfc-carousel-progress 4s linear" }}
              />
            </div>
          )}
      </div>

      {carouselGallery.length > 1 && (
        <div className="flex gap-2 overflow-x-auto bg-slate-950 px-3 py-3 sm:px-4">
          {carouselGallery.map((item, index) => (
            <button
              key={`thumb-${item.id}`}
              type="button"
              onClick={() => setGalleryCarouselIndex(index)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-2 transition sm:h-20 sm:w-32 ${
                index === safeGalleryCarouselIndex
                  ? "ring-yellow-400"
                  : "ring-white/10 opacity-70 hover:opacity-100 hover:ring-white/30"
              }`}
              aria-label={`Show photo ${index + 1}`}
            >
              <Image
                src={item.imageUrl}
                alt=""
                fill
                sizes="128px"
                className="object-cover"
              />
              <span className="absolute left-1.5 top-1.5 rounded bg-slate-950/70 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                {String(index + 1).padStart(2, "0")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>

  ) : (

    /* Empty gallery */
    <div className="relative rounded-3xl overflow-hidden border border-dashed border-emerald-200 bg-gradient-to-br from-white via-emerald-50/30 to-white p-12 text-center shadow-sm">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_55%)] pointer-events-none" />

      <div className="relative w-16 h-16 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
        <Camera className="w-8 h-8 text-emerald-500" />
      </div>

      <h4 className="font-black text-slate-800 text-lg">
        No Gallery Photos Yet
      </h4>

      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
        Club photos and matchday moments will appear here once uploaded from the Admin Panel.
      </p>

    </div>

  )}


  {/* Mobile gallery button */}
  <button
    onClick={() => setActiveTab("gallery")}
    className="sm:hidden w-full flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
  >
    View All Photos
    <ArrowRight className="w-4 h-4" />
  </button>

</div>

    {homeHighlights.length > 0 && (
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
                Club Media
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <Film className="w-6 h-6 text-yellow-500" />
              Team Highlights
            </h3>

            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              Fresh goals, skills, and matchday clips uploaded by club officials.
            </p>
          </div>

          <button
            type="button"
            onClick={() => goToTab("highlights")}
            className="hidden sm:flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
          >
            All Highlights
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {homeHighlights.map((highlight) => (
            <HighlightVideoCard
              key={highlight.id}
              highlight={highlight}
              onPlay={setActiveHighlight}
              showAdminControls={false}
              onDelete={handleDeleteHighlight}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goToTab("highlights")}
          className="sm:hidden w-full flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
        >
          All Highlights
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )}

           {/* ================= NEWS & FAN SUPPORT ================= */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

  {/* ================= LATEST CLUB NEWS ================= */}
  <div className="lg:col-span-2 space-y-6">

    {/* Heading */}
    <div className="flex items-end justify-between gap-4">

      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />

          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
            From the Club
          </span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2">
          Latest Club News
        </h3>

        <p className="text-sm text-slate-500 mt-2">
          Stay updated with the latest from Kariobangi Legends FC.
        </p>
      </div>

      <button
        onClick={() => setActiveTab("news")}
        className="hidden sm:flex items-center gap-1 text-xs font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
      >
        All News
        <ArrowRight className="w-4 h-4" />
      </button>

    </div>


    {/* News cards */}
    {clubData.news.length > 0 ? (

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {clubData.news.slice(0, 2).map((item, index) => (

          <article
            key={item.id}
            className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >

            {/* News image — full-bleed, cropped to fill for a punchy editorial look */}
            <div className="relative overflow-hidden h-56 sm:h-64">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover object-center group-hover:scale-[1.06] transition-transform duration-700 ease-out"
              />

              {/* Mood gradient for legibility + depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/5 to-transparent" />

              {/* Category */}
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-white/95 text-slate-950 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md backdrop-blur-sm">
                <Activity className="w-3 h-3 text-emerald-600" />
                Official Update
              </span>

              {/* News number */}
              <span className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-950/50 text-white flex items-center justify-center text-[11px] font-black backdrop-blur-sm ring-1 ring-white/20">
                0{index + 1}
              </span>

            </div>


            {/* News content */}
            <div className="p-6 flex-1 flex flex-col">

              <div className="flex items-center gap-2 mb-3">

                <Calendar className="w-3.5 h-3.5 text-emerald-600" />

                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                  {new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>

              </div>


              <h4 className="font-black text-lg text-slate-950 leading-snug group-hover:text-emerald-600 transition-colors">
                {item.title}
              </h4>


              <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed mt-3">
                {item.summary}
              </p>


              <div className="mt-auto pt-5 flex flex-wrap items-center gap-3">

                <button
                  onClick={() => {
                    setHighlightNewsId(item.id);
                    setActiveTab("news");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group/link inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  Read Full Story

                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </button>

              </div>

            </div>

          </article>

        ))}

      </div>

    ) : (

      /* No news message */
      <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center">

        <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />

        <h4 className="font-black text-slate-800">
          No Club News Yet
        </h4>

        <p className="text-sm text-slate-500 mt-1">
          New club updates will appear here.
        </p>

      </div>

    )}


    {/* Mobile All News button */}
    <button
      onClick={() => setActiveTab("news")}
      className="sm:hidden w-full flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-wider text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
    >
      View All News
      <ArrowRight className="w-4 h-4" />
    </button>

  </div>


  {/* ================= FAN SUPPORT BOARD ================= */}
  <div className="space-y-6">

    {/* Heading */}
    <div>

      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-yellow-400" />

        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-yellow-600">
          The Fans
        </span>
      </div>

      <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2">
        Fan Support
      </h3>

      <p className="text-sm text-slate-500 mt-2">
        Send your message of support to the Legends.
      </p>

    </div>


    {/* Fan board card */}
    <div className="relative overflow-hidden bg-slate-950 rounded-3xl border border-slate-800 shadow-xl p-6">

      {/* Decorative glow */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl" />

      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />


      <div className="relative z-10 space-y-5">

        {/* Fan message form */}
        <form
          onSubmit={handleFanSubmit}
          className="space-y-3"
          suppressHydrationWarning
        >

          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Your Name
            </label>

            <input
              type="text"
              placeholder="e.g. Kiprono from Nairobi"
              value={fanName}
              onChange={(e) => setFanName(e.target.value)}
              className="w-full text-xs p-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>


          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Message of Support
            </label>

            <textarea
              rows={3}
              placeholder="Let's win the next match!..."
              value={fanText}
              onChange={(e) => setFanText(e.target.value)}
              className="w-full text-xs p-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
            />
          </div>


          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-yellow-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HeartHandshake className="w-4 h-4" />

            {isPending ? "Posting..." : "Post Message of Hope"}

            {!isPending && (
              <ArrowRight className="w-4 h-4" />
            )}

          </button>

        </form>


        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px bg-white/10 flex-1" />

          <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">
            From Our Fans
          </span>

          <div className="h-px bg-white/10 flex-1" />
        </div>


        {/* Fan messages */}
        <div className="space-y-3 max-h-52 overflow-y-auto pr-1">

          {clubData.fanMessages.length > 0 ? (

            clubData.fanMessages.slice(0, 3).map((msg) => (

              <div
                key={msg.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition"
              >

                <div className="flex justify-between items-center gap-3 mb-2">

                  <span className="font-black text-xs text-white truncate">
                    {msg.name}
                  </span>

                  <span className="shrink-0 text-[8px] text-yellow-400 font-black uppercase tracking-wider">
                    Faithful Fan
                  </span>

                </div>

                <p className="text-xs text-slate-400 italic leading-relaxed">
                  &ldquo;{msg.message}&rdquo;
                </p>

              </div>

            ))

          ) : (

            <div className="text-center py-5">

              <MessageSquare className="w-7 h-7 text-slate-700 mx-auto mb-2" />

              <p className="text-xs text-slate-500">
                Be the first fan to leave a message.
              </p>

            </div>

          )}

        </div>


        {/* View board */}
        <button
          onClick={() => setActiveTab("fanzone")}
          className="w-full pt-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-yellow-400 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          View Fan Board
          <ChevronRight className="w-4 h-4" />
        </button>

      </div>

    </div>

  </div>

</div>

           {/* ================= CLUB STORY / FOUNDER ================= */}
<section className="space-y-6">

  {/* Section heading */}
  <div className="flex items-center gap-2">
    <span className="w-2 h-2 rounded-full bg-yellow-400" />

    <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
      Our Story
    </span>
  </div>

  {/* Main story card */}
  <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800">

    {/* Decorative background */}
    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[minmax(300px,420px)_1fr]">

      {/* Founder image */}
      <div className="relative min-h-[420px] sm:min-h-[480px] lg:min-h-full overflow-hidden bg-slate-900">
        <Image
          src="/images/founder-atanga.jpg"
          alt="Mr. Erick Otieno Atanga - Founder and Patron of Kariobangi Legends FC"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover object-[center_18%] contrast-[1.1] saturate-[1.08] brightness-[1.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <span className="inline-flex items-center bg-yellow-400 text-slate-950 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
            Founder & Patron
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
            Mr. Erick Otieno Atanga
          </h3>
        </div>
      </div>


      {/* Story content */}
      <div className="p-7 sm:p-10 lg:p-12 flex flex-col justify-center">

        <p className="text-yellow-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] mb-3">
          More Than Football
        </p>

        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          What is Kariobangi Legends?
        </h2>

        <p className="mt-5 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
          Kariobangi Legends is more than a football club. It is a community
          built through <span className="text-yellow-400 font-bold">football,
          friendship and opportunity.</span>
        </p>

        <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-2xl">
          Born from a generation of footballers from Kariobangi and Eastlands,
          the Legends came together through their Sunday
          <span className="text-white font-bold"> Football & Bonding (FB)</span>
          sessions and a shared vision to create opportunities for the next
          generation.
        </p>

        {/* Milestones */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-yellow-400 text-lg font-black">2023</p>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mt-1">
              CBO Founded
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-emerald-400 text-lg font-black">2023</p>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mt-1">
              Youth FC
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-white text-lg font-black">2024</p>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mt-1">
              Regional Champions
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <p className="text-yellow-400 text-lg font-black">2026/27</p>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider mt-1">
              NSL Target
            </p>
          </div>

        </div>

        {/* Read history */}
        <div className="mt-8">

          <button
            onClick={() => setActiveTab("history")}
            className="group inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-yellow-400/20 cursor-pointer"
          >
            Read Our Full Story

            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

        </div>

      </div>

    </div>

    {/* Bottom accent */}
    <div className="h-1 bg-gradient-to-r from-emerald-500 via-yellow-400 to-emerald-500" />

  </div>

</section>
        </div>
      )}

        {/* ================= TAB: PHOTO GALLERY ================= */}
        {activeTab === "gallery" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="max-w-xl space-y-1">
                <h2 className="text-3xl font-black text-slate-950 tracking-tight">Legends Photo Gallery</h2>
                <p className="text-sm text-slate-600">
                  Showcasing real team moments in Kariobangi North: matchday action, training, academy work, and community events.
                </p>
              </div>
              {canManageClubContent && (
                <button
                  onClick={() => {
                    setActiveTab("admin");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Photo to Board
                </button>
              )}
            </div>

            {/* Category Filter buttons */}
            <div className="flex gap-2 flex-wrap bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
              {["All", "Match", "Training", "Community", "Academy", "Wazee"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedGalleryCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    selectedGalleryCategory === cat
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/10"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  {cat} Categories
                </button>
              ))}
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGallery.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative min-h-64 bg-white overflow-hidden border-b border-slate-100">

                    <button
                      type="button"
                      onClick={() => {
                        if (isUploadedMediaUrl(item.imageUrl)) {
                          setSelectedGalleryImage(item);
                        }
                      }}
                      className="relative z-10 w-full min-h-64 flex items-center justify-center p-3 cursor-zoom-in"
                    >
                      {isUploadedMediaUrl(item.imageUrl) ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.caption}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-contain group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="min-h-64 w-full flex flex-col items-center justify-center text-center text-slate-400 px-4 bg-slate-50">
                          <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                          <p className="text-[10px] font-bold uppercase tracking-wider">
                            Legacy entry: upload a photo
                          </p>
                        </div>
                      )}
                    </button>

                    <span className="absolute top-4 left-4 z-20 bg-slate-950/90 text-yellow-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-yellow-400/20">
                      {item.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-2 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                      {item.caption}
                    </p>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-slate-400 font-bold">
                        Published: {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      {canManageClubContent && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openReplaceImage(item.id, "gallery", item.imageUrl, item.caption)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer px-2 py-1 rounded hover:bg-blue-50"
                          >
                            <Camera className="w-3 h-3" /> Swap
                          </button>
                          <button
                            onClick={() => handleDeleteGallery(item.id)}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-0.5 cursor-pointer px-2 py-1 rounded hover:bg-rose-50"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredGallery.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-500 text-sm mt-3">No photos in this category yet</p>
                {canManageClubContent && (
                  <p className="text-xs text-slate-400 mt-1">Go to the Admin Panel to post pictures of this event.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: TEAM HIGHLIGHTS ================= */}
        {activeTab === "highlights" && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="max-w-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
                    Matchday Film Room
                  </span>
                </div>
                <h2 className="text-3xl font-black text-slate-950 tracking-tight">
                  Team Highlights
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Watch official Kariobangi Legends clips — goals, skills, training, and community moments uploaded directly from pitch-side phones and cameras.
                </p>
              </div>
              {canManageClubContent && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("admin");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <Film className="w-4 h-4" /> Upload Highlight
                </button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
              {["All", ...HIGHLIGHT_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedHighlightCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    selectedHighlightCategory === cat
                      ? "bg-slate-950 text-yellow-400 shadow-md shadow-slate-950/10"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filteredHighlights.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredHighlights.map((highlight) => (
                  <HighlightVideoCard
                    key={highlight.id}
                    highlight={highlight}
                    onPlay={setActiveHighlight}
                    showAdminControls={canManageClubContent}
                    onDelete={handleDeleteHighlight}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
                <Film className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-black text-slate-800 text-lg">Highlight Videos Coming Soon</h4>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Club officials can upload MP4, MOV, or WEBM clips from a phone or computer in the Admin Panel.
                </p>
              </div>
            )}
          </div>
        )}

                    {selectedGalleryImage && (
              <div
                className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
                onClick={() => setSelectedGalleryImage(null)}
              >
                <div
                  className="relative w-full max-w-6xl max-h-[90vh] flex flex-col items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedGalleryImage(null)}
                    className="absolute top-2 right-2 z-20 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-2xl transition"
                    aria-label="Close image"
                  >
                    ×
                  </button>

{/* Previous Button */}
<button
  type="button"
  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center text-2xl transition shadow-sm"
  aria-label="Previous photo"
  onClick={() => {
    const currentIndex = filteredGallery.findIndex(
      (image) => image.id === selectedGalleryImage.id
    );

    const previousIndex =
      currentIndex === 0
        ? filteredGallery.length - 1
        : currentIndex - 1;

    setSelectedGalleryImage(filteredGallery[previousIndex]);
  }}
>
  ‹
</button>

{/* Next Button */}
<button
  type="button"
  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center text-2xl transition shadow-sm"
  aria-label="Next photo"
  onClick={() => {
    const currentIndex = filteredGallery.findIndex(
      (image) => image.id === selectedGalleryImage.id
    );

    const nextIndex =
      currentIndex === filteredGallery.length - 1
        ? 0
        : currentIndex + 1;

    setSelectedGalleryImage(filteredGallery[nextIndex]);
  }}
>
  ›
</button>
{/* Photo Counter */}
<div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-full shadow-sm">
  {filteredGallery.findIndex(
    (image) => image.id === selectedGalleryImage.id
  ) + 1}{" "}
  / {filteredGallery.length}
</div>
                  {/* Large Image */}
                  <Image
                    src={selectedGalleryImage.imageUrl}
                    alt={selectedGalleryImage.caption}
                    width={1200}
                    height={900}
                    className="w-auto h-auto max-w-full max-h-[calc(90vh-8rem)] object-contain rounded-lg animate-in zoom-in-95 duration-300"
                  />

                  {/* Caption */}
                  <div className="mt-4 w-full max-w-3xl text-center px-4">
                    <p className="text-slate-950 font-bold text-sm">
                      {selectedGalleryImage.caption}
                    </p>
                    <p className="text-emerald-600 text-xs font-semibold mt-1 uppercase">
                      {selectedGalleryImage.category}
                    </p>
                  </div>
                </div>
              </div>
            )}

        {/* ================= TAB: CLUB HISTORY ================= */}
{activeTab === "history" && (
  <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm space-y-10">

    {/* Header */}
    <div className="max-w-4xl space-y-4">
      <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
        Our Story: Kariobangi Legends Football Club
      </h2>

      <p className="text-sm text-emerald-600 font-bold uppercase tracking-wider">
        From Football & Bonding to Community Football Excellence
      </p>

      <hr className="w-20 border-2 border-yellow-500" />

      <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
        Kariobangi Legends is a community institution built by yesteryear
        football players from Kariobangi and Eastlands who came together
        through their shared love for football, friendship and community.
      </p>
    </div>

    {/* ================= STORY ================= */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

      {/* Main Story */}
      <div className="lg:col-span-2 space-y-7 text-sm text-slate-700 leading-relaxed">

        <div>
          <h3 className="text-xl font-black text-slate-950 mb-3">
            What Is Kariobangi Legends?
          </h3>

          <p>
            Kariobangi Legends is a solid institution built by yesteryear
            football players around Kariobangi and Eastlands. Many of these
            players were very talented and contributed significantly to
            Kenyan football, but did not receive the opportunities they
            expected. Their football efforts became a subject of discussion
            as many felt that their potential had not been fully realised.
          </p>
        </div>

        {/* Football & Bonding */}
        <div className="bg-slate-50 rounded-2xl p-5 border-l-4 border-yellow-500">
          <h3 className="text-lg font-black text-slate-950 mb-2">
            Football & Bonding
          </h3>

          <p>
            These former players came together and formed Legends FC,
            bringing together old players who still had football in their
            hearts. Every Sunday, they met to share football experience,
            score goals, have fun, debate football and reminisce about
            memorable football moments.
          </p>

          <p className="mt-3 font-bold text-emerald-700">
            They called it FB, Football & Bonding.
          </p>
        </div>

        {/* Community Transformation */}
        <div>
          <h3 className="text-xl font-black text-slate-950 mb-3">
            From Football & Bonding to Community Action
          </h3>

          <p>
            As the bond grew stronger, an idea emerged: the friendship and
            football fellowship could become something bigger that would
            positively impact the community.
          </p>

          <p className="mt-3">
            The group transformed its friendship into a registered Community
            Based Organisation. On{" "}
            <strong>11 August 2023</strong>, Kariobangi Legends CBO was
            officially registered.
          </p>
        </div>

        {/* Community Initiatives */}
        <div>
          <h3 className="text-xl font-black text-slate-950 mb-4">
            Serving the Community
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <p className="font-extrabold text-emerald-700 text-sm">
                Sanitary Towels Distribution
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Supporting school-going girls through the distribution of
                sanitary towels.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-100">
              <p className="font-extrabold text-yellow-700 text-sm">
                Masomo Kwanza
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Group contributions are used to support less privileged
                students by helping pay for their educational needs.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="font-extrabold text-slate-900 text-sm">
                Anti-Drugs Campaign
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Creating awareness and sensitising the Kariobangi community
                about the dangers of drug abuse.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
              <p className="font-extrabold text-emerald-700 text-sm">
                Environmental Clean-Ups
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Working together with the local community to improve the
                environment through clean-up activities.
              </p>
            </div>

          </div>
        </div>

        {/* Talent Discovery */}
        <div>
          <h3 className="text-xl font-black text-slate-950 mb-3">
            The Talent Was Already Here
          </h3>

          <p>
            Through their interactions with the community, the Legends
            discovered that many talented young boys were not attached to
            any football team. Some had even quit football while still at
            their prime because of different challenges and circumstances.
          </p>

          <p className="mt-3">
            The talent was plentiful, but there was often nobody taking
            responsibility for nurturing and supporting it.
          </p>

          <p className="mt-3 font-bold text-slate-950">
            This became the driving force behind the next chapter:
            gathering the talent and starting a youth team that could help
            reshape the community.
          </p>
        </div>

        {/* Youth Team */}
        <div className="bg-slate-950 text-white rounded-2xl p-6">
          <p className="text-yellow-400 text-xs font-black uppercase tracking-widest mb-2">
            20 September 2023
          </p>

          <h3 className="text-xl font-black mb-3">
            Kariobangi Legends Youth FC Was Born
          </h3>

          <p className="text-slate-300 text-sm leading-relaxed">
            After discussions and a naming process, the youth team was
            established as{" "}
            <strong className="text-white">
              Kariobangi Legends Youth FC
            </strong>{" "}
            on 20 September 2023.
          </p>

          <p className="text-slate-300 text-sm leading-relaxed mt-3">
            The mission and vision were established and the work commenced
            immediately.
          </p>
        </div>

        {/* Building the Team */}
        <div>
          <h3 className="text-xl font-black text-slate-950 mb-3">
            Building the Team
          </h3>

          <p>
            Through collections from the group, players were appreciated
            with a flat motivation of{" "}
            <strong>KSh 5,000</strong>, while officials received{" "}
            <strong>KSh 10,000</strong> motivation.
          </p>

          <p className="mt-3">
            A structure was established, technical staff were appointed,
            and the work of building the football team began.
          </p>
        </div>

        {/* Football Progress */}
        <div>
          <h3 className="text-xl font-black text-slate-950 mb-3">
            From Community Football to Competitive Football
          </h3>

          <p>
            Football became another powerful way of bringing communal change,
            activating dreams and giving young people an opportunity to
            pursue their football ambitions.
          </p>

          <p className="mt-3">
            The journey moved from community football into competitive
            federation football, with the team progressing through the
            ranks through hard work, determination and collective effort.
          </p>
        </div>

        {/* Closing */}
        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
          <h3 className="text-xl font-black text-slate-950 mb-3">
            The Dream Continues
          </h3>

          <p>
            Kariobangi Legends enters every season with the desire to improve,
            develop talent and leave a universal mark through football and
            community development.
          </p>

          <p className="mt-3">
            The objective for the{" "}
            <strong>2026–27 season</strong> is promotion to the{" "}
            <strong>National Super League (NSL)</strong>.
          </p>

          <p className="mt-3 font-bold text-emerald-700">
            The journey continues with hard work, determination and prayers.
          </p>
        </div>

      </div>

      {/* ================= TIMELINE ================= */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">

        <h3 className="font-extrabold text-base text-slate-900">
          Our Journey
        </h3>

        <div className="relative space-y-6">

          {/* Timeline line */}
          <div className="absolute left-[13px] top-2 bottom-2 w-px bg-slate-200" />

          {[
            {
              date: "11 AUG 2023",
              title: "Kariobangi Legends CBO",
              desc: "The Football & Bonding friendship was transformed into a registered Community Based Organisation."
            },
            {
              date: "20 SEP 2023",
              title: "Youth Team Established",
              desc: "Kariobangi Legends Youth FC was formed to gather and nurture talented young players."
            },
            {
              date: "14 JAN 2024",
              title: "Regional Competition",
              desc: "The football journey at regional level officially began."
            },
            {
              date: "2023–24",
              title: "Regional Champions",
              desc: "Kariobangi Legends won the regional championship crown and earned promotion to Division 2."
            },
            {
              date: "2024–25",
              title: "Division 1 Promotion",
              desc: "The team led its group, progressed to the playoffs and secured automatic promotion to Division 1."
            },
            {
              date: "2025–26",
              title: "Division 1 Debut",
              desc: "As debutants in Division 1, Kariobangi Legends finished in position 5."
            },
            {
              date: "2026–27",
              title: "The NSL Dream",
              desc: "The objective is promotion to the National Super League through hard work, determination and prayers."
            }
          ].map((milestone, index) => (
            <div key={index} className="relative flex gap-4">

              <div className="relative z-10 w-7 h-7 rounded-full bg-yellow-400 border-4 border-slate-50 flex-shrink-0" />

              <div className="pb-1">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                  {milestone.date}
                </p>

                <p className="font-extrabold text-xs text-slate-900 mt-1">
                  {milestone.title}
                </p>

                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {milestone.desc}
                </p>
              </div>

            </div>
          ))}

        </div>

        <hr className="border-slate-200" />

        {/* Donations */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-slate-900 uppercase">
            Club Donations
          </h4>

          <p className="text-xs text-slate-600 leading-relaxed">
            Donating to Kariobangi Legends means investing in football talent,
            community development, and the dreams of young people.
          </p>

          <button
            onClick={() => setActiveTab("donors")}
            className="w-full bg-slate-950 text-yellow-400 text-xs font-bold py-3 rounded-xl hover:bg-slate-900 transition uppercase tracking-wider cursor-pointer"
          >
            Donate Now
          </button>
        </div>

      </div>

    </div>

    {/* Closing Statement */}
    <div className="border-t border-slate-100 pt-8 text-center">
      <p className="text-xl sm:text-2xl font-black text-slate-950">
        Our Football. Our Community. Our Legacy.
      </p>

      <p className="text-xs text-slate-500 mt-2">
        Built through friendship, community and a shared belief in the power
        of football.
      </p>
    </div>

  </div>
)}

       {/* ================= TAB: MANAGEMENT ================= */}
{activeTab === "management" && (
  <div className="space-y-12">
    {canManageClubContent && (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs font-semibold text-amber-900">
          Admin mode is active — edit and delete controls are visible on this page.
        </p>
        <button
          type="button"
          onClick={async () => {
            await logoutAdminSession();
            showToast("Admin signed out. Edit controls are now hidden.");
          }}
          className="inline-flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg transition cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out Admin
        </button>
      </div>
    )}

    {canManageClubContent &&
      clubData.management.some((member) => !hasRealPassportPhoto(member.imageUrl)) && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs font-semibold text-rose-900">
            {clubData.management.filter((member) => !hasRealPassportPhoto(member.imageUrl)).length} official
            {clubData.management.filter((member) => !hasRealPassportPhoto(member.imageUrl)).length === 1 ? " still needs" : "s still need"} a passport photo.
          </p>
          <button
            type="button"
            onClick={() => {
              setAdminPanelView("content");
              setBulkPhotosOpen(true);
              setActiveTab("admin");
            }}
            className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-yellow-400"
          >
            Upload missing photos
          </button>
        </div>
      )}

    <div className="max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        <span className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
          Club Leadership & Football Operations
        </span>
      </div>

      <h2 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight">
        Kariobangi Legends Management
      </h2>

      <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-2xl">
        Meet the people responsible for leading, managing and developing
        Kariobangi Legends Football Club both on and off the pitch.
      </p>
    </div>

    {clubData.management.length > 0 && (
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={managementSearchQuery}
            onChange={(e) => setManagementSearchQuery(e.target.value)}
            placeholder="Search by name or role..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {!managementSearchQuery.trim() && managementJumpLinks.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {managementJumpLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition"
              >
                <span className="text-slate-400">{link.badge}</span>
                {link.label}
              </a>
            ))}
          </div>
        )}

        {managementSearchQuery.trim() && !clubData.management.some(matchesManagementSearch) && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h4 className="font-black text-slate-800 text-lg">No one found</h4>
            <p className="text-sm text-slate-500 mt-2">
              No one matches "{managementSearchQuery.trim()}". Try a different name or role.
            </p>
          </div>
        )}
      </div>
    )}

    {filteredManagementGrouped.map((section) => (
      <section key={section.id} className="space-y-8">
        <div className="flex items-start gap-4 border-b border-slate-200 pb-4">
          <span className="inline-flex items-center justify-center min-w-12 h-12 px-2 rounded-xl bg-slate-950 text-yellow-400 text-[10px] font-black tracking-wider shrink-0">
            {section.badge}
          </span>
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-950">
              {section.heading}
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              {section.description}
            </p>
            <p className="text-[11px] text-slate-400 font-semibold mt-1">
              {section.members.length} official
              {section.members.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {section.roleGroups.map((roleGroup) => {
          if (roleGroup.members.length === 0) return null;

          return (
            <div key={roleGroup.id} id={`mgmt-${roleGroup.id}`} className="space-y-4 scroll-mt-24">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center min-w-9 h-8 px-2 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-black tracking-wider border border-emerald-100">
                  {roleGroup.badge}
                </span>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {roleGroup.heading}
                </h4>
              </div>

              <div className="flex flex-wrap gap-3">
                {roleGroup.members.map((member) => (
                  <ManagementMemberCard
                    key={member.id}
                    member={member}
                    featured={isFeaturedManagementRole(member.position)}
                    showAdminControls={canManageClubContent}
                    isUpdatingRole={updatingManagementRoleId === member.id}
                    onEdit={handleAdminEditManagement}
                    onDelete={handleAdminDeleteManagement}
                    onReplaceImage={(id, imageUrl) =>
                      openReplaceImage(id, "management", imageUrl)
                    }
                    onRoleChange={handleUpdateManagementRole}
                    onViewProfile={setViewingManagementId}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {section.otherMembers.length > 0 && (
          <div id={`mgmt-${section.id}-other`} className="space-y-4 scroll-mt-24">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center min-w-9 h-8 px-2 rounded-lg bg-slate-100 text-slate-600 text-[9px] font-black">
                ?
              </span>
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Other Roles
              </h4>
            </div>
            <div className="flex flex-wrap gap-3">
              {section.otherMembers.map((member) => (
                <ManagementMemberCard
                  key={member.id}
                  member={member}
                  showAdminControls={canManageClubContent}
                  isUpdatingRole={updatingManagementRoleId === member.id}
                  onEdit={handleAdminEditManagement}
                  onDelete={handleAdminDeleteManagement}
                  onReplaceImage={(id, imageUrl) =>
                    openReplaceImage(id, "management", imageUrl)
                  }
                  onRoleChange={handleUpdateManagementRole}
                  onViewProfile={setViewingManagementId}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    ))}

    {clubData.management.length === 0 && (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-slate-300" />
        </div>

        <h4 className="font-black text-slate-800 text-lg">
          Management Information Coming Soon
        </h4>

        <p className="text-sm text-slate-500 mt-2">
          Club leadership and technical team information will appear here.
        </p>
      </div>
    )}
  </div>
)}

        {/* ================= TAB: SQUAD ================= */}
        {activeTab === "squad" && (
          <div className="space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-3xl font-black text-slate-950 tracking-tight">Kariobangi Legends Squad</h2>
              <p className="text-sm text-slate-600">
                Meet our local champions playing in Division One. These players are molded from the local neighborhoods and represent our pride on the field.
              </p>
            </div>

            {canManageClubContent &&
              clubData.players.some((player) => !hasRealPassportPhoto(player.imageUrl)) && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-xs font-semibold text-rose-900">
                    {clubData.players.filter((player) => !hasRealPassportPhoto(player.imageUrl)).length} player
                    {clubData.players.filter((player) => !hasRealPassportPhoto(player.imageUrl)).length === 1 ? " still needs" : "s still need"} a passport photo.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPanelView("content");
                      setBulkPhotosOpen(true);
                      setActiveTab("admin");
                    }}
                    className="inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-yellow-400"
                  >
                    Upload missing photos
                  </button>
                </div>
              )}

            {clubData.players.length > 0 && (
              <div className="space-y-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={squadSearchQuery}
                    onChange={(e) => setSquadSearchQuery(e.target.value)}
                    placeholder="Search players by name..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {!squadSearchQuery.trim() && squadJumpLinks.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {squadJumpLinks.map((link) => (
                      <a
                        key={link.id}
                        href={`#${link.id}`}
                        className={
                          link.isWazee
                            ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-[10px] font-bold uppercase tracking-wider text-amber-800 hover:border-amber-400 hover:text-amber-900 transition"
                            : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition"
                        }
                      >
                        <span className={link.isWazee ? "text-amber-500" : "text-slate-400"}>{link.badge}</span>
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {clubData.players.length > 0 ? (
            <div className="space-y-10">
              {SQUAD_POSITION_GROUPS.filter((group) => group.id !== "wazee").map((group) => {
                const groupPlayers = (squadByPosition.get(group.id) ?? []).filter(matchesSquadSearch);
                if (groupPlayers.length === 0) return null;

                return (
                  <section key={group.id} id={`squad-${group.id}`} className="space-y-4 scroll-mt-24">
                    <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center min-w-10 h-10 px-2 rounded-xl bg-slate-950 text-yellow-400 text-[10px] font-black tracking-wider">
                          {group.badge}
                        </span>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight">
                            {group.heading}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            {groupPlayers.length} player{groupPlayers.length === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {groupPlayers.map((player) => (
                        <SquadPlayerCard
                          key={player.id}
                          player={player}
                          showAdminControls={canManageClubContent}
                          isUpdatingPosition={updatingPlayerPositionId === player.id}
                          isUpdatingJersey={updatingPlayerJerseyId === player.id}
                          onReplaceImage={(id, imageUrl) =>
                            openReplaceImage(id, "player", imageUrl)
                          }
                          onDelete={handleDeletePlayer}
                          onEdit={handleAdminEditPlayer}
                          onPositionChange={handleUpdatePlayerPosition}
                          onJerseyChange={handleUpdatePlayerJersey}
                          onShopClick={openSquadPlayerShop}
                          onViewProfile={setViewingPlayerId}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}

              {(() => {
                const otherPlayers = (squadByPosition.get("other") ?? []).filter(matchesSquadSearch);
                if (otherPlayers.length === 0) return null;

                return (
                  <section id="squad-other" className="space-y-4 scroll-mt-24">
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                      <span className="inline-flex items-center justify-center min-w-10 h-10 px-2 rounded-xl bg-slate-200 text-slate-700 text-[10px] font-black">
                        ?
                      </span>
                      <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                        Other Roles
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {otherPlayers.map((player) => (
                        <SquadPlayerCard
                          key={player.id}
                          player={player}
                          showAdminControls={canManageClubContent}
                          isUpdatingPosition={updatingPlayerPositionId === player.id}
                          isUpdatingJersey={updatingPlayerJerseyId === player.id}
                          onReplaceImage={(id, imageUrl) =>
                            openReplaceImage(id, "player", imageUrl)
                          }
                          onDelete={handleDeletePlayer}
                          onEdit={handleAdminEditPlayer}
                          onPositionChange={handleUpdatePlayerPosition}
                          onJerseyChange={handleUpdatePlayerJersey}
                          onShopClick={openSquadPlayerShop}
                          onViewProfile={setViewingPlayerId}
                        />
                      ))}
                    </div>
                  </section>
                );
              })()}

              {(() => {
                const wazeeGroup = SQUAD_POSITION_GROUPS.find((group) => group.id === "wazee");
                const wazeePlayers = (squadByPosition.get("wazee") ?? []).filter(matchesSquadSearch);
                if (!wazeeGroup || wazeePlayers.length === 0) return null;

                return (
                  <section
                    id="squad-wazee"
                    className="space-y-4 scroll-mt-24 pt-8 mt-2 border-t-4 border-dashed border-amber-300"
                  >
                    <div className="flex items-end justify-between gap-4 border-b border-amber-200 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center min-w-10 h-10 px-2 rounded-xl bg-amber-400 text-slate-950 text-[10px] font-black tracking-wider">
                          {wazeeGroup.badge}
                        </span>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-black text-amber-900 uppercase tracking-tight">
                            {wazeeGroup.heading}
                          </h3>
                          <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                            {wazeePlayers.length} player{wazeePlayers.length === 1 ? "" : "s"} &middot; Not part of the competitive squad
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 max-w-2xl">
                      Club legends and veteran players who turn out for Kariobangi Legends in friendly and
                      community matches, kept separate from the competitive Division One squad above.
                    </p>

                    <div className="flex flex-wrap gap-3">
                      {wazeePlayers.map((player) => (
                        <SquadPlayerCard
                          key={player.id}
                          player={player}
                          showAdminControls={canManageClubContent}
                          isUpdatingPosition={updatingPlayerPositionId === player.id}
                          isUpdatingJersey={updatingPlayerJerseyId === player.id}
                          onReplaceImage={(id, imageUrl) =>
                            openReplaceImage(id, "player", imageUrl)
                          }
                          onDelete={handleDeletePlayer}
                          onEdit={handleAdminEditPlayer}
                          onPositionChange={handleUpdatePlayerPosition}
                          onJerseyChange={handleUpdatePlayerJersey}
                          onShopClick={openSquadPlayerShop}
                          onViewProfile={setViewingPlayerId}
                        />
                      ))}
                    </div>
                  </section>
                );
              })()}

              {squadSearchQuery.trim() && !clubData.players.some(matchesSquadSearch) && (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
                  <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <h4 className="font-black text-slate-800 text-lg">No players found</h4>
                  <p className="text-sm text-slate-500 mt-2">
                    No one matches "{squadSearchQuery.trim()}". Try a different name.
                  </p>
                </div>
              )}
            </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="font-black text-slate-800 text-lg">
                  Squad Information Coming Soon
                </h4>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  Player profiles will appear here once the club updates the squad list.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: FIXTURES & MATCHES ================= */}
        {activeTab === "fixtures" && (
          <div className="space-y-8">
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
                  {COMPETITION_NAME}
                </span>
              </div>
              <h2 className="text-3xl font-black text-slate-950 tracking-tight">
                Match Centre
              </h2>
            </div>

            {(seasonStats.played > 0 || recentForm.length > 0) && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 font-semibold">
                  League season stats. Friendly and charity matches are listed separately and do not affect this table.
                </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {[
                  { label: "Played", value: seasonStats.played },
                  { label: "Wins", value: seasonStats.wins },
                  { label: "Draws", value: seasonStats.draws },
                  { label: "Losses", value: seasonStats.losses },
                  { label: "GF", value: seasonStats.goalsFor },
                  { label: "GA", value: seasonStats.goalsAgainst },
                  {
                    label: "GD",
                    value:
                      seasonStats.goalDifference > 0
                        ? `+${seasonStats.goalDifference}`
                        : seasonStats.goalDifference,
                  },
                  { label: "Pts", value: seasonStats.points },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl border border-slate-100 p-3 text-center shadow-sm"
                  >
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      {stat.label}
                    </p>
                    <p className="text-lg font-black text-slate-950 mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>
              </div>
            )}

            {recentForm.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl border border-slate-100 px-4 py-3 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Last {recentForm.length} matches
                </span>
                <div className="flex items-center gap-1.5">
                  {recentForm.map((result, index) => (
                    <span
                      key={`${result}-${index}`}
                      className={`w-7 h-7 rounded-full text-[10px] font-black flex items-center justify-center ${
                        result === "win"
                          ? "bg-emerald-600 text-white"
                          : result === "draw"
                          ? "bg-slate-200 text-slate-700"
                          : "bg-rose-600 text-white"
                      }`}
                    >
                      {result === "win" ? "W" : result === "draw" ? "D" : "L"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {fixtureGroups.nextMatch && (
              <section
                id={`fixture-${fixtureGroups.nextMatch.id}`}
                className={`relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl scroll-mt-24 ${
                  highlightFixtureId === fixtureGroups.nextMatch.id
                    ? "ring-2 ring-emerald-400"
                    : ""
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-950" />
                <div className="absolute -top-24 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="relative z-10 p-6 sm:p-8 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <Activity className="w-3.5 h-3.5" />
                        Next Fixture
                      </span>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-yellow-400 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                        {getMatchTypeMeta(fixtureGroups.nextMatch.matchType).label}
                      </span>
                    </div>
                    <MatchStatusPill fixture={fixtureGroups.nextMatch} />
                  </div>
                  <MatchScoreboard fixture={fixtureGroups.nextMatch} variant="hero" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-3 text-white">
                      <Calendar className="w-5 h-5 text-yellow-400 shrink-0" />
                      <div>
                        <p className="text-[9px] uppercase tracking-widest font-black text-slate-500">
                          Kick-off
                        </p>
                        <p className="text-sm font-bold">
                          {formatKickoff(fixtureGroups.nextMatch.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-white min-w-0">
                      <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-widest font-black text-slate-500">
                          Venue
                        </p>
                        <p className="text-sm font-bold">
                          {fixtureGroups.nextMatch.venue}
                        </p>
                        {isClubHomeVenue(fixtureGroups.nextMatch.venue) && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {HOME_GROUND.landmark}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <MatchCountdown date={fixtureGroups.nextMatch.date} />
                  {canManageClubContent && (
                    <button
                      type="button"
                      onClick={() => handleEditFixture(fixtureGroups.nextMatch)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-yellow-400 font-black text-xs uppercase tracking-wider py-3 rounded-xl cursor-pointer"
                    >
                      <Clock className="w-4 h-4" />
                      {hasKickoffTime(fixtureGroups.nextMatch.date)
                        ? "Edit kick-off time"
                        : "Set kick-off time"}
                    </button>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <GetDirectionsLink
                      venue={fixtureGroups.nextMatch.venue}
                      variant="yellow"
                      label={
                        fixtureGroups.nextMatch.isHome
                          ? "Get Directions on Google Maps"
                          : "Directions to Match Venue"
                      }
                      className="w-full py-3.5"
                    />
                    <WhatsAppShareButton
                      href={buildFixtureWhatsAppShare(fixtureGroups.nextMatch, shareBaseUrl)}
                      label="Share on WhatsApp"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddFixtureToCalendar(fixtureGroups.nextMatch!)}
                      className="sm:col-span-2 w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition cursor-pointer"
                    >
                      <CalendarDays className="w-4 h-4 text-yellow-400" />
                      Add to Calendar
                    </button>
                  </div>
                </div>
              </section>
            )}

            {fixtureGroups.live.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  Live Now
                </h3>
                <div className="space-y-3">
                  {fixtureGroups.live.map((fixture) => (
                    <MatchFixtureCard
                      key={fixture.id}
                      fixture={fixture}
                      mode="live"
                      isAdminAuthenticated={canManageClubContent}
                      onEdit={handleEditFixture}
                      onDelete={handleDeleteFixture}
                      highlighted={highlightFixtureId === fixture.id}
                      shareBaseUrl={shareBaseUrl}
                    />
                  ))}
                </div>
              </section>
            )}

            {(fixtureGroups.upcomingRest.length > 0 || recentFixtures.length > 0) && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMatchTypeFilter("all")}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                    matchTypeFilter === "all"
                      ? "bg-slate-950 text-yellow-400"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  All Matches
                </button>
                {MATCH_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setMatchTypeFilter(type.value)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                      matchTypeFilter === type.value
                        ? "bg-slate-950 text-yellow-400"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="space-y-4">
                <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Upcoming Fixtures
                </h3>
                {filteredUpcomingRest.length > 0 ? (
                  <div className="space-y-3">
                    {filteredUpcomingRest.map((fixture) => (
                      <MatchFixtureCard
                        key={fixture.id}
                        fixture={fixture}
                        mode="upcoming"
                        isAdminAuthenticated={canManageClubContent}
                        onEdit={handleEditFixture}
                        onDelete={handleDeleteFixture}
                        highlighted={highlightFixtureId === fixture.id}
                        shareBaseUrl={shareBaseUrl}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                    <p className="text-sm font-bold text-slate-700">
                      {matchTypeFilter === "all"
                        ? "No further fixtures scheduled"
                        : `No upcoming ${getMatchTypeMeta(matchTypeFilter).label.toLowerCase()} fixtures`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      New matches will appear here once added in the admin panel.
                    </p>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Results
                </h3>
                {filteredRecentFixtures.length > 0 ? (
                  <div className="space-y-3">
                    {filteredRecentFixtures.map((fixture) => (
                      <MatchFixtureCard
                        key={fixture.id}
                        fixture={fixture}
                        mode="result"
                        isAdminAuthenticated={canManageClubContent}
                        onEdit={handleEditFixture}
                        onDelete={handleDeleteFixture}
                        highlighted={highlightFixtureId === fixture.id}
                        shareBaseUrl={shareBaseUrl}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                    <p className="text-sm font-bold text-slate-700">
                      {matchTypeFilter === "all"
                        ? "No results yet"
                        : `No ${getMatchTypeMeta(matchTypeFilter).label.toLowerCase()} results yet`}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Completed matches and full-time scores will show here.
                    </p>
                  </div>
                )}
              </section>
            </div>

            {wazeeFixtures.length > 0 && (
              <section className="space-y-4 pt-8 mt-2 border-t-4 border-dashed border-amber-300">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center min-w-10 h-10 px-2 rounded-xl bg-amber-400 text-slate-950 text-[10px] font-black tracking-wider">
                    {getSquadTeamMeta("wazee").badge}
                  </span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-amber-900 uppercase tracking-tight">
                      Wazee Legends Fixtures
                    </h3>
                    <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                      Friendly matches played by our veteran squad
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 max-w-2xl">
                  Friendly and community fixtures featuring the Senior Team (Wazee Legends), kept separate
                  from the competitive first-team calendar above and excluded from league season stats.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-slate-950 uppercase tracking-wide flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      Upcoming
                    </h4>
                    {wazeeFixtureGroups.upcoming.length > 0 ? (
                      <div className="space-y-3">
                        {wazeeFixtureGroups.upcoming.map((fixture) => (
                          <MatchFixtureCard
                            key={fixture.id}
                            fixture={fixture}
                            mode="upcoming"
                            isAdminAuthenticated={canManageClubContent}
                            onEdit={handleEditFixture}
                            onDelete={handleDeleteFixture}
                            highlighted={highlightFixtureId === fixture.id}
                            shareBaseUrl={shareBaseUrl}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-6 text-center">
                        <p className="text-sm font-bold text-slate-700">No upcoming Wazee fixtures</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-slate-950 uppercase tracking-wide flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      Results
                    </h4>
                    {wazeeFixtureGroups.recent.length > 0 ? (
                      <div className="space-y-3">
                        {wazeeFixtureGroups.recent.map((fixture) => (
                          <MatchFixtureCard
                            key={fixture.id}
                            fixture={fixture}
                            mode="result"
                            isAdminAuthenticated={canManageClubContent}
                            onEdit={handleEditFixture}
                            onDelete={handleDeleteFixture}
                            highlighted={highlightFixtureId === fixture.id}
                            shareBaseUrl={shareBaseUrl}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-6 text-center">
                        <p className="text-sm font-bold text-slate-700">No Wazee results yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {clubData.fixtures.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
                <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="font-black text-slate-800 text-lg">Fixtures Coming Soon</h4>
                <p className="text-sm text-slate-500 mt-2">
                  Match schedules and results will be published here.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: NEWS & BLOGS ================= */}
        {activeTab === "news" && (
          <div className="space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-3xl font-black text-slate-950 tracking-tight">Club News & Community Updates</h2>
              <p className="text-sm text-slate-600">
                Official statements, training updates, matches review, and community projects initiated by Mr. Erick Otieno Atanga and Kariobangi Legends.
              </p>
            </div>

            <div className="space-y-12">
              {clubData.news.map((item, idx) => (
                <div
                  key={item.id}
                  id={`news-${item.id}`}
                  className={`bg-white rounded-3xl overflow-hidden border shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 scroll-mt-24 ${
                    highlightNewsId === item.id
                      ? "border-emerald-300 ring-2 ring-emerald-200"
                      : "border-slate-100"
                  } ${idx % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
                >
                  <div className="lg:col-span-5 relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-100 h-64 min-h-[220px] lg:h-full lg:min-h-[280px]">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      className="object-contain p-4 sm:p-6"
                    />
                  </div>

                  <div className="lg:col-span-7 flex flex-col justify-between space-y-4 py-2">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase">
                        <span>Official Blog</span>
                        <span>•</span>
                        <span>
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-950 leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-slate-800 font-semibold text-sm">
                        {item.summary}
                      </p>
                      <p className="text-slate-600 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                        {item.content}
                      </p>
                    </div>

                    {canManageClubContent && (
                      <div className="pt-2 border-t border-slate-100 flex justify-end items-center gap-2 text-xs">
                        <button
                          onClick={() => openReplaceImage(item.id, "news", item.imageUrl)}
                          className="text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <Camera className="w-3 h-3" /> Replace Photo
                        </button>
                        <button
                          onClick={() => handleDeleteNews(item.id, item.title)}
                          className="text-rose-500 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB: MERCHANDISE SHOP ================= */}
        {activeTab === "shop" && (
          <div className="space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-3xl font-black text-slate-950 tracking-tight">Official Fan Shop</h2>
              <p className="text-sm text-slate-600">
                100% of profit goes directly toward sponsoring player boots, school scholarships, and match travel for our Division One squad.
              </p>
            </div>

            {fanMembership ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <strong>{fanMembership.planName} perk:</strong> {MEMBER_SHOP_DISCOUNT_PERCENT}% off is already applied
                until {formatMembershipExpiry(fanMembership.expiresAt)}.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                Official supporters get {MEMBER_SHOP_DISCOUNT_PERCENT}% off shop kits.{" "}
                <button
                  type="button"
                  onClick={() => goToTab("membership")}
                  className="font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                >
                  Join from Ksh 500
                </button>
              </div>
            )}

            {clubData.merchandise.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 sm:p-14 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-lg font-black text-slate-950">No merchandise listed yet</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  {canManageClubContent
                    ? "The fan shop is empty. Use the Admin Panel to upload fresh jerseys and merch."
                    : "New official kit and club merchandise will appear here soon. Check back shortly."}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex gap-2 flex-wrap bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
                  {["All", ...shopCategoriesWithItems.map((category) => category.id)].map((categoryId) => (
                    <button
                      key={categoryId}
                      type="button"
                      onClick={() => setSelectedShopCategory(categoryId)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                        selectedShopCategory === categoryId
                          ? "bg-slate-950 text-yellow-400 shadow-md shadow-slate-950/10"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                      }`}
                    >
                      {categoryId === "All"
                        ? "All Items"
                        : MERCHANDISE_CATEGORIES.find((category) => category.id === categoryId)?.label ??
                          categoryId}
                    </button>
                  ))}
                </div>

                <div className="space-y-10">
                  {visibleShopCategories.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center space-y-2">
                      <p className="text-sm font-bold text-slate-700">No items in this category yet.</p>
                      <p className="text-xs text-slate-500">
                        Choose another category or upload new merchandise from the Admin Panel.
                      </p>
                    </div>
                  ) : null}
                  {visibleShopCategories.map((category) => {
                    const categoryItems = merchandiseByCategory.get(category.id) ?? [];
                    if (categoryItems.length === 0) return null;

                    return (
                      <section key={category.id} className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-slate-100 pb-4">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                              Shop Category
                            </p>
                            <h3 className="text-2xl font-black text-slate-950">{category.label}</h3>
                            <p className="text-sm text-slate-500">{category.description}</p>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {categoryItems.length} item{categoryItems.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        {renderMerchandiseProductGrid(categoryItems)}
                      </section>
                    );
                  })}
                </div>

                {complementaryShopItems.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                          Keep browsing
                        </p>
                        <h3 className="text-xl font-black text-slate-950">You may also like</h3>
                      </div>
                    </div>
                    {renderMerchandiseProductGrid(complementaryShopItems)}
                  </div>
                )}
              </div>
            )}

            {/* Track order */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
                    <Package className="w-5 h-5 text-emerald-600" />
                    Track Your Order
                  </h3>
                  <p className="text-sm text-slate-600">
                    {customerProfile
                      ? "View all your orders in My Account, or look up a single order below."
                      : "Track a purchase with your order number and the M-PESA phone used at checkout."}
                  </p>
                </div>
                {customerProfile && (
                <button
                  type="button"
                  onClick={() => openAccountTab()}
                  className="shrink-0 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  My Account
                </button>
                )}
              </div>

              <form onSubmit={handleTrackOrder} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Order Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 12"
                    value={trackOrderId}
                    onChange={(e) => setTrackOrderId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    M-PESA Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 0712345678"
                    value={trackPhone}
                    onChange={(e) => setTrackPhone(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold px-6 py-3 rounded-xl uppercase tracking-wider text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? "Checking..." : "Track Order"}
                  </button>
                </div>
              </form>

              {trackError && (
                <p className="text-sm text-rose-600 font-semibold">{trackError}</p>
              )}

              {trackedOrder && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Order #{trackedOrder.id}
                      </p>
                      <p className="text-lg font-black text-slate-950">
                        {trackedOrder.customerName}
                      </p>
                    </div>
                    <OrderStatusBadge orderStatus={trackedOrder.orderStatus} />
                  </div>

                  <OrderProgressTimeline
                    orderStatus={trackedOrder.orderStatus}
                    paymentStatus={trackedOrder.paymentStatus}
                    mpesaReceiptNumber={trackedOrder.mpesaReceiptNumber}
                    items={trackedOrder.items}
                    totalAmount={trackedOrder.totalAmount}
                    createdAt={trackedOrder.createdAt}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB: MEMBERSHIP ================= */}
        {activeTab === "membership" && (
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-yellow-400/10" />
              <div className="relative z-10 p-6 sm:p-10 space-y-4">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400 text-slate-950 text-[9px] font-black uppercase tracking-widest">
                  <Award className="w-3.5 h-3.5" />
                  Official Supporters
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                  Join the <span className="text-yellow-400">Legends</span>
                </h2>
                <p className="max-w-2xl text-sm sm:text-base text-slate-300 leading-relaxed">
                  A simple yearly membership. Sign in, pay with M-Pesa, then keep your digital card
                  in My Account. Members get {MEMBER_SHOP_DISCOUNT_PERCENT}% off official shop kits.
                  Want to give extra today? Use Donations instead.
                </p>
              </div>
            </div>

            {fanMembership ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8 space-y-4">
                <p className="text-sm font-black uppercase tracking-wider text-emerald-700">
                  You are already a member
                </p>
                <p className="text-2xl font-black text-slate-950">{fanMembership.planName}</p>
                <p className="text-sm text-slate-600">
                  Active until {formatMembershipExpiry(fanMembership.expiresAt)}. Your digital card
                  is in My Account, and shop prices already include your {MEMBER_SHOP_DISCOUNT_PERCENT}% perk.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => goToTab("account")}
                    className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    View my card
                  </button>
                  <button
                    type="button"
                    onClick={() => goToTab("shop")}
                    className="inline-flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer"
                  >
                    Shop with member prices
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MEMBERSHIP_PLANS.map((plan) => {
                    const selected = selectedMembershipPlanId === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedMembershipPlanId(plan.id)}
                        className={`text-left rounded-3xl border p-6 space-y-3 transition cursor-pointer ${
                          selected
                            ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-600/10"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                            {plan.id === "youth" ? "Young supporters" : "Full membership"}
                          </p>
                          {selected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                              <Check className="w-3.5 h-3.5" />
                              Selected
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl font-black text-slate-950">{plan.name}</h3>
                        <p className="text-3xl font-black text-emerald-700">
                          Ksh {plan.price.toLocaleString()}
                          <span className="ml-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                            / year
                          </span>
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed">{plan.blurb}</p>
                      </button>
                    );
                  })}
                </div>

                {!customerProfile ? (
                  renderFanAuthPanel(
                    "Fan account to join",
                    "Sign in or register here, then pay with M-Pesa. Your digital card will appear in My Account."
                  )
                ) : (
                  <form onSubmit={handleMembershipSubmit} className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 space-y-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        M-Pesa phone number
                      </label>
                      <input
                        type="tel"
                        placeholder="0712345678"
                        value={membershipPhone}
                        onChange={(e) => setMembershipPhone(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        required
                      />
                    </div>
                    {membershipPaymentMessage && (
                      <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                        {membershipPaymentMessage}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={isPending || membershipPaymentPending}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      {membershipPaymentPending
                        ? "Waiting for M-Pesa..."
                        : `Pay Ksh ${
                            MEMBERSHIP_PLANS.find((plan) => plan.id === selectedMembershipPlanId)?.price.toLocaleString() ??
                            "1,500"
                          } with M-Pesa`}
                    </button>
                    <p className="text-xs text-slate-500 text-center">
                      You will get an STK prompt on your phone. After payment, your card appears in My Account.
                    </p>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: DONATIONS ================= */}
        {activeTab === "donors" && (
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_55%)] pointer-events-none" />
              <div className="relative z-10 px-6 sm:px-10 py-8 sm:py-10">
                <div className="max-w-3xl space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-emerald-400">
                      Club Donations
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Donate to Kariobangi Legends FC
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    Division One football demands more than passion. Your donation helps us provide
                    boots, academy programmes, match travel, and daily training for young players
                    from Kariobangi North. Give in KES via M-Pesa or in USD, GBP, and EUR from abroad.
                    Membership is yearly support; a donation here is an extra gift today.
                  </p>
                  <button
                    type="button"
                    onClick={() => goToTab("membership")}
                    className="inline-flex items-center gap-2 text-yellow-400 text-xs font-black uppercase tracking-wider hover:text-yellow-300 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    Prefer yearly membership? Join from Ksh 500
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-950">Make a donation</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    KES donations are paid instantly via M-Pesa STK Push. International pledges
                    are recorded and our team follows up with payment details.
                  </p>
                </div>

                <form onSubmit={handleDonationSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">
                      Currency
                    </label>
                    <select
                      value={donationCurrency}
                      onChange={(e) => {
                        const nextCurrency = e.target.value;
                        if (!isDonationCurrencyCode(nextCurrency)) return;
                        setDonationCurrency(nextCurrency);
                        setDonationAmount(getDefaultDonationAmount(nextCurrency));
                        setCustomDonation("");
                      }}
                      className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {DONATION_CURRENCY_CODES.map((code) => (
                        <option key={code} value={code}>
                          {DONATION_CURRENCIES[code].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">
                      Select amount ({getDonationCurrency(donationCurrency).code})
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {DONATION_CURRENCIES[donationCurrency].presets.map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => {
                            setDonationAmount(preset.val);
                            setCustomDonation("");
                          }}
                          className={`p-3 rounded-xl font-bold text-center transition border ${
                            donationAmount === preset.val && !customDonation
                              ? "bg-slate-950 text-yellow-400 border-slate-950"
                              : "bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100"
                          }`}
                        >
                          <span className="text-sm block">
                            {formatDonationAmount(preset.val, donationCurrency)}
                          </span>
                          <span className="text-[9px] font-medium text-slate-400 mt-1 block">
                            {preset.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">
                      Custom amount ({getDonationCurrency(donationCurrency).code})
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-400 font-bold text-sm">
                        {getDonationCurrency(donationCurrency).symbol}
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g. 5000"
                        value={customDonation}
                        onChange={(e) => {
                          setCustomDonation(e.target.value);
                          setDonationAmount(0);
                        }}
                        className={`w-full text-sm pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          donationCurrency === "KES" ? "pl-12" : "pl-8"
                        }`}
                      />
                    </div>
                  </div>

                  <DonationPaymentPrompt
                    currency={donationCurrency}
                    amount={selectedDonationAmount}
                    showPhone={donationCurrency === "KES"}
                    phone={donationPhone}
                    onPhoneChange={setDonationPhone}
                    email={CONTACT_CENTER.email}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block">
                        Full name
                      </label>
                      <input
                        type="text"
                        placeholder="Your name or organisation"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block">
                        Donation purpose
                      </label>
                      <select
                        value={donationPurpose}
                        onChange={(e) => setDonationPurpose(e.target.value)}
                        className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="Boots & Equipment">Boots & match equipment</option>
                        <option value="Academy Support">U-15 academy programme</option>
                        <option value="Transport & Meals">Match travel & meals</option>
                        <option value="General Club Fund">General club operations</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">
                      Message (optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Leave an encouraging message for the team..."
                      value={donationMessage}
                      onChange={(e) => setDonationMessage(e.target.value)}
                      className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  {donationPaymentMessage && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 leading-relaxed">
                      {donationPaymentMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPending || donationPaymentPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider py-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    {donationPaymentPending
                      ? "Waiting for M-Pesa..."
                      : isPending
                        ? "Submitting..."
                        : donationCurrency === "KES"
                          ? "Pay with M-Pesa"
                          : "Submit Donation"}
                  </button>

                  <p className="text-[10px] text-center text-slate-400 leading-relaxed">
                    Questions? Call{" "}
                    <a
                      href={toTelHref(CONTACT_CENTER.phones[0].number)}
                      className="font-bold text-emerald-600 underline underline-offset-2"
                    >
                      {CONTACT_CENTER.phones[0].number}
                    </a>{" "}
                    or email{" "}
                    <a
                      href={`mailto:${CONTACT_CENTER.email}`}
                      className="font-bold text-emerald-600 underline underline-offset-2 break-all"
                    >
                      {CONTACT_CENTER.email}
                    </a>
                    .
                  </p>
                </form>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-900 shadow-sm space-y-4">
                  <h3 className="font-black text-base text-yellow-400">Donors Honor Board</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    We recognise every donor helping Kariobangi Legends grow on and off the pitch.
                  </p>

                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {clubData.donations.filter(
                      (d) =>
                        !d.paymentStatus ||
                        d.paymentStatus === "paid" ||
                        d.paymentStatus === "pledge"
                    ).length > 0 ? (
                      clubData.donations
                        .filter(
                          (d) =>
                            !d.paymentStatus ||
                            d.paymentStatus === "paid" ||
                            d.paymentStatus === "pledge"
                        )
                        .map((d) => (
                        <div
                          key={d.id}
                          className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5"
                        >
                          <div className="flex justify-between items-start gap-3 text-xs">
                            <span className="font-bold text-slate-100">{d.donorName}</span>
                            <span className="text-emerald-400 font-black whitespace-nowrap">
                              {formatDonationAmount(d.amount, d.currency)}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                            {d.purpose}
                          </p>
                          {d.message && (
                            <p className="text-xs text-slate-300 italic">&ldquo;{d.message}&rdquo;</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 py-8 text-center">
                        No recorded donations yet. Your name can be first on the board.
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6 bg-white rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="font-black text-sm text-slate-950">Where your donation goes</h4>
                  <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-black">•</span>
                      FKF Division One registration and league operations
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-black">•</span>
                      Boots, balls, and training equipment for the squad
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-black">•</span>
                      Transport for away fixtures across Nairobi County
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-black">•</span>
                      U-15 academy meals and educational support
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: FAN ZONE ================= */}
        {activeTab === "fanzone" && (
          <div className="space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-3xl font-black text-slate-950 tracking-tight">Fan Zone Support Board</h2>
              <p className="text-sm text-slate-600">
                Are you a fan of Kariobangi Legends FC? Leave your message here to encourage Mr. Erick Otieno Atanga, the staff, and the players!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Message form */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-slate-950">Add Your Message</h3>
                <p className="text-xs text-slate-500">
                  Your words inspire the team as we fight for promotion. Any supporter from Kariobangi slums or global friends can post!
                </p>

                <form
                  onSubmit={handleFanSubmit}
                  className="space-y-3"
                  suppressHydrationWarning
                >
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Kiprotich Nairobi / Erick Otieno Atanga's Elder brother"
                      value={fanName}
                      onChange={(e) => setFanName(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">Message</label>
                    <textarea
                      rows={3}
                      placeholder="Write your blessing or message..."
                      value={fanText}
                      onChange={(e) => setFanText(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {isPending ? "Saving..." : "Post to Supporter Board ✓"}
                  </button>
                </form>
              </div>

              {/* Message Wall */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xl font-bold text-slate-950 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" /> Live Supporter Messages ({clubData.fanMessages.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clubData.fanMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 relative hover:scale-[1.01] transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-sm text-slate-900">{msg.name}</p>
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">
                            Faithful Fan
                          </p>
                        </div>
                        <span className="bg-yellow-50 text-yellow-700 text-[8px] font-black px-1.5 py-0.5 rounded">
                          EST. MEMBER
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 italic leading-relaxed">
                        &ldquo;{msg.message}&rdquo;
                      </p>
                      <p className="text-[9px] text-slate-400 text-right mt-1 font-semibold">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: MY ACCOUNT ================= */}
        {activeTab === "account" && (
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-yellow-400/10" />
              <div className="relative z-10 p-6 sm:p-10 space-y-4">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/90 text-white text-[9px] font-black uppercase tracking-widest">
                  {customerProfile ? (
                    <>
                      <User className="w-3.5 h-3.5" />
                      Fan Account
                    </>
                  ) : (
                    <>
                      <User className="w-3.5 h-3.5" />
                      Sign In
                    </>
                  )}
                </span>
                <div className="space-y-2 max-w-3xl">
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                    {customerProfile ? (
                      <>
                        Welcome,{" "}
                        <span className="text-yellow-400">
                          {customerProfile.fullName.split(" ")[0]}
                        </span>
                      </>
                    ) : (
                      <>
                        Welcome <span className="text-yellow-400">back</span>
                      </>
                    )}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {customerProfile
                      ? "Your digital membership card, shop orders, and club messages live here."
                      : "Enter your password to continue."}
                  </p>
                </div>
              </div>
            </div>

            {customerProfile ? (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-slate-950 text-yellow-400 font-black text-lg flex items-center justify-center">
                        {customerProfile.fullName
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("")}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Signed in as
                        </p>
                        <p className="text-xl font-black text-slate-950 truncate">{customerProfile.fullName}</p>
                        <p className="text-sm text-slate-600">
                          {formatPhoneDisplay(formatStoredPhoneForInput(customerProfile.phoneNumber))}
                          {customerProfile.email && (
                            <> • {customerProfile.email}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCustomerLogout}
                      className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>

                {fanMembership ? (
                  <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/25 via-transparent to-yellow-400/15" />
                    <div className="relative z-10 p-6 sm:p-8 space-y-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-yellow-400">
                          Official supporter card
                        </p>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider">
                          <Award className="w-3.5 h-3.5" />
                          Active
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-black tracking-tight">{customerProfile.fullName}</p>
                        <p className="text-sm text-slate-300">{fanMembership.planName}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Valid until</p>
                          <p className="font-bold text-white">{formatMembershipExpiry(fanMembership.expiresAt)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Paid</p>
                          <p className="font-bold text-white">Ksh {fanMembership.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Receipt</p>
                          <p className="font-bold text-white">{fanMembership.mpesaReceiptNumber || "Confirmed"}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300">
                        {MEMBER_SHOP_DISCOUNT_PERCENT}% off official shop kits is already applied at checkout.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 sm:p-8 space-y-3">
                    <p className="text-sm font-bold text-slate-800">No active membership yet</p>
                    <p className="text-sm text-slate-500">
                      Join as a Youth Fan or Official Fan to get your digital card and {MEMBER_SHOP_DISCOUNT_PERCENT}% off the shop.
                    </p>
                    <button
                      type="button"
                      onClick={() => goToTab("membership")}
                      className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      Join the Legends
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
                      <Package className="w-5 h-5 text-emerald-600" />
                      My Orders
                    </h3>
                    <button
                      type="button"
                      onClick={() => loadCustomerOrders()}
                      disabled={isLoadingCustomerOrders}
                      className="text-[10px] font-black uppercase tracking-wider text-emerald-700 hover:text-emerald-800 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoadingCustomerOrders ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  {isLoadingCustomerOrders ? (
                    <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center text-sm text-slate-500">
                      Loading your orders...
                    </div>
                  ) : customerOrders.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center space-y-4">
                      <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                      <div>
                        <p className="font-bold text-slate-700">No orders yet</p>
                        <p className="text-sm text-slate-500 mt-1">
                          When you buy official kits, your orders will show up here for easy tracking.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("shop");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition cursor-pointer"
                      >
                        Browse the Shop
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customerOrders.map((order) => {
                        const isExpanded =
                          expandedAccountOrderId === order.id ||
                          (trackOrderId !== "" &&
                            Number(trackOrderId) === order.id);
                        const itemCount = order.items?.length || 0;

                        return (
                          <div
                            key={order.id}
                            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedAccountOrderId(
                                  isExpanded ? null : order.id
                                )
                              }
                              className="w-full text-left p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/80 transition cursor-pointer"
                            >
                              <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Order #{order.id}
                                </p>
                                <p className="font-black text-slate-950">
                                  Ksh {order.totalAmount?.toLocaleString()}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {itemCount} item{itemCount === 1 ? "" : "s"} •{" "}
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <OrderStatusBadge orderStatus={order.orderStatus} />
                                <ChevronDown
                                  className={`w-4 h-4 text-slate-400 transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="px-5 sm:px-6 pb-6 border-t border-slate-100 pt-5 bg-slate-50/50">
                                <OrderProgressTimeline
                                  orderStatus={order.orderStatus}
                                  paymentStatus={order.paymentStatus}
                                  mpesaReceiptNumber={order.mpesaReceiptNumber}
                                  items={order.items}
                                  totalAmount={order.totalAmount}
                                  createdAt={order.createdAt}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-emerald-600" />
                      Message Admin
                    </h3>
                    <button
                      type="button"
                      onClick={() => loadCustomerMessages()}
                      disabled={isLoadingCustomerMessages}
                      className="text-[10px] font-black uppercase tracking-wider text-emerald-700 hover:text-emerald-800 disabled:opacity-50 cursor-pointer"
                    >
                      {isLoadingCustomerMessages ? "Refreshing..." : "Refresh"}
                    </button>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
                    <p className="text-sm text-slate-600">
                      Ask about orders, memberships, tickets, or club updates. Admin replies appear here in your account.
                    </p>

                    <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
                      {isLoadingCustomerMessages ? (
                        <p className="text-sm text-slate-500 text-center py-8">Loading messages...</p>
                      ) : customerMessages.length === 0 ? (
                        <div className="text-center py-8 space-y-2">
                          <MessageCircle className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-sm font-semibold text-slate-600">No messages yet</p>
                          <p className="text-xs text-slate-500">
                            Send your first message to the club admin below.
                          </p>
                        </div>
                      ) : (
                        customerMessages.map((entry) => {
                          const isAdmin = entry.senderType === "admin";

                          return (
                            <div
                              key={entry.id}
                              className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                                  isAdmin
                                    ? "bg-slate-100 border border-slate-200 text-slate-800"
                                    : "bg-emerald-600 text-white"
                                }`}
                              >
                                <p className="text-[10px] font-black uppercase tracking-wider opacity-80 mb-1">
                                  {isAdmin ? "Club Admin" : "You"}
                                </p>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                  {entry.message}
                                </p>
                                <p className="text-[10px] mt-2 opacity-70">
                                  {new Date(entry.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleSendCustomerMessage} className="space-y-3 border-t border-slate-100 pt-5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Your message
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Write your message to the club admin..."
                        value={customerMessageDraft}
                        onChange={(e) => setCustomerMessageDraft(e.target.value)}
                        maxLength={2000}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-y"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isSendingCustomerMessage}
                        className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingCustomerMessage ? "Sending..." : "Send to Admin"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto">
                {renderFanAuthPanel(
                  "Fan Sign In",
                  "Sign in or create your account to track orders, manage your membership, and message the club."
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: CONTACT CENTRE ================= */}
        {activeTab === "contact" && (
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-yellow-400/10" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />

              <div className="relative z-10 p-6 sm:p-10 lg:p-12 space-y-5">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/90 text-white text-[9px] font-black uppercase tracking-widest">
                  <Phone className="w-3.5 h-3.5" />
                  Official Contact Centre
                </span>

                <div className="space-y-2 max-w-3xl">
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                    Reach the{" "}
                    <span className="text-yellow-400">Legends</span>
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    Our contact centre is open to fans, donors, sponsors, and partners.
                    Call or email us for match tickets, merchandise, donations, academy enquiries,
                    or general club support.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <a
                    href={`mailto:${CONTACT_CENTER.email}`}
                    className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl transition-all duration-300 shadow-lg"
                  >
                    <Mail className="w-4 h-4" />
                    Email the Club
                  </a>
                  {CONTACT_CENTER.phones[0] && (
                    <a
                      href={toTelHref(CONTACT_CENTER.phones[0].number)}
                      className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl transition-all duration-300"
                    >
                      <Phone className="w-4 h-4" />
                      Call Now
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-950">For Fans</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Match updates, fan zone messages, ticket enquiries, merchandise orders,
                    and community events across Kariobangi North.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    Fixtures, results, and matchday information
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    Supporter messages and club news
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    Official kit and merchandise support
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-yellow-50 text-yellow-700 flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-950">For Donors</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sponsorship, donations, academy support, transport funding,
                    and partnership opportunities for individuals and organizations.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    Boots, kits, meals, and academy contributions
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    Corporate sponsorship and CSR partnerships
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    Donor receipts and follow-up coordination
                  </li>
                </ul>
              </div>

              <div className="bg-slate-950 text-white rounded-3xl p-6 border border-slate-900 shadow-sm space-y-4">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-yellow-400 flex items-center justify-center border border-slate-800">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-yellow-400">Visit Us</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {CONTACT_CENTER.location.fullAddress}
                  </p>
                </div>
                <GetDirectionsLink
                  variant="yellow"
                  label="Get Directions on Google Maps"
                  className="w-full py-3"
                />
                <a
                  href={getGoogleMapsViewUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-yellow-400 transition"
                >
                  View on Google Maps
                </a>
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{CONTACT_CENTER.hours}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
                  Founded under Mr. Erick Otieno Atanga&apos;s leadership.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-950">Club Phone Lines</h3>
                  <p className="text-xs text-slate-500">
                    Tap any number to call directly from your phone.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CONTACT_CENTER.phones.map((line) => (
                    <a
                      key={line.number}
                      href={toTelHref(line.number)}
                      className="group p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-200"
                    >
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-emerald-700">
                        {line.label}
                      </p>
                      <p className="mt-1 text-lg font-black text-slate-950 group-hover:text-emerald-800">
                        {formatPhoneDisplay(line.number)}
                      </p>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        Tap to call
                      </p>
                    </a>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-slate-950">Email the Club</h3>
                  <p className="text-xs text-slate-500">
                    For detailed enquiries, sponsorship proposals, or written follow-ups.
                  </p>
                </div>

                <a
                  href={`mailto:${CONTACT_CENTER.email}`}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-slate-950 text-white hover:bg-slate-900 transition-all duration-200 border border-slate-900"
                >
                  <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-yellow-400">
                      Official Email
                    </p>
                    <p className="text-sm sm:text-base font-bold break-all">
                      {CONTACT_CENTER.email}
                    </p>
                  </div>
                </a>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("donors");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition text-left cursor-pointer"
                  >
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      Donations
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      Make a club donation
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("fanzone");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition text-left cursor-pointer"
                  >
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Fans
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-950">
                      Post a supporter message
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: ADMIN PANEL ================= */}
        {activeTab === "admin" && (
          <AdminPanel
              activeTab={activeTab}
              adminArchivedOrders={adminArchivedOrders}
              adminAwayScore={adminAwayScore}
              adminBusy={adminBusy}
              adminGalleryCaption={adminGalleryCaption}
              adminGalleryCategory={adminGalleryCategory}
              adminGalleryFile={adminGalleryFile}
              adminGalleryPreview={adminGalleryPreview}
              adminHighlightCategory={adminHighlightCategory}
              adminHighlightDescription={adminHighlightDescription}
              adminHighlightThumbPreview={adminHighlightThumbPreview}
              adminHighlightTitle={adminHighlightTitle}
              adminHighlightVideoFile={adminHighlightVideoFile}
              adminHighlightVideoPreview={adminHighlightVideoPreview}
              adminHomeScore={adminHomeScore}
              adminInboxMessages={adminInboxMessages}
              adminInboxThreads={adminInboxThreads}
              adminIsHome={adminIsHome}
              adminManagementBio={adminManagementBio}
              adminManagementCategory={adminManagementCategory}
              adminManagementFile={adminManagementFile}
              adminManagementName={adminManagementName}
              adminManagementOrder={adminManagementOrder}
              adminManagementPosition={adminManagementPosition}
              adminManagementResponsibilities={adminManagementResponsibilities}
              adminMatchDate={adminMatchDate}
              adminMatchTime={adminMatchTime}
              adminMatchType={adminMatchType}
              adminMemberName={adminMemberName}
              adminMemberPhone={adminMemberPhone}
              adminMemberPlanId={adminMemberPlanId}
              adminMembershipStats={adminMembershipStats}
              adminMerchDesc={adminMerchDesc}
              adminMerchFile={adminMerchFile}
              adminMerchName={adminMerchName}
              adminMerchPrice={adminMerchPrice}
              adminMerchSizes={adminMerchSizes}
              adminMerchStockStatus={adminMerchStockStatus}
              adminMerchType={adminMerchType}
              adminNewsContent={adminNewsContent}
              adminNewsFile={adminNewsFile}
              adminNewsSummary={adminNewsSummary}
              adminNewsTitle={adminNewsTitle}
              adminOpponent={adminOpponent}
              adminOpponentLogoFile={adminOpponentLogoFile}
              adminOpponentLogoUrl={adminOpponentLogoUrl}
              adminOrderStats={adminOrderStats}
              adminOrders={adminOrders}
              adminPanelView={adminPanelView}
              adminPassword={adminPassword}
              adminPlayerApps={adminPlayerApps}
              adminPlayerAssists={adminPlayerAssists}
              adminPlayerBio={adminPlayerBio}
              adminPlayerFile={adminPlayerFile}
              adminPlayerGoals={adminPlayerGoals}
              adminPlayerJersey={adminPlayerJersey}
              adminPlayerName={adminPlayerName}
              adminPlayerPos={adminPlayerPos}
              adminReplyDraft={adminReplyDraft}
              adminResetCode={adminResetCode}
              adminResetConfirmPassword={adminResetConfirmPassword}
              adminResetNewPassword={adminResetNewPassword}
              adminResetPhone={adminResetPhone}
              adminResetStep={adminResetStep}
              adminRole={adminRole}
              adminSquadTeam={adminSquadTeam}
              adminStatus={adminStatus}
              adminUnseenOrderCount={adminUnseenOrderCount}
              adminVenue={adminVenue}
              bulkPhotosOpen={bulkPhotosOpen}
              clubData={clubData}
              editingFixtureId={editingFixtureId}
              editingManagementId={editingManagementId}
              editingPlayerId={editingPlayerId}
              fixtureGroups={fixtureGroups}
              handleAddAdminMembership={handleAddAdminMembership}
              handleAddMerchandise={handleAddMerchandise}
              handleAdminAddFixture={handleAdminAddFixture}
              handleAdminAddGallery={handleAdminAddGallery}
              handleAdminAddHighlight={handleAdminAddHighlight}
              handleAdminAddManagement={handleAdminAddManagement}
              handleAdminAddPlayer={handleAdminAddPlayer}
              handleAdminCompleteReset={handleAdminCompleteReset}
              handleAdminEditPlayer={handleAdminEditPlayer}
              handleAdminLogin={handleAdminLogin}
              handleAdminReply={handleAdminReply}
              handleAdminRequestReset={handleAdminRequestReset}
              handleAdminUpdateFixture={handleAdminUpdateFixture}
              handleAdminUpdateManagement={handleAdminUpdateManagement}
              handleAdminUpdatePlayer={handleAdminUpdatePlayer}
              handleArchiveOrder={handleArchiveOrder}
              handleBulkPassportUploads={handleBulkPassportUploads}
              handleCancelManagementEdit={handleCancelManagementEdit}
              handleClearAllMerchandise={handleClearAllMerchandise}
              handleDeleteHighlight={handleDeleteHighlight}
              handleDeleteMerchandise={handleDeleteMerchandise}
              handleEditFixture={handleEditFixture}
              handleMarkOrderCashPaid={handleMarkOrderCashPaid}
              handleNewspaperLogin={handleNewspaperLogin}
              handleNewspaperPasswordReset={handleNewspaperPasswordReset}
              handleRestoreOrder={handleRestoreOrder}
              handleRevokeMembership={handleRevokeMembership}
              handleUpdateManagementName={handleUpdateManagementName}
              handleUpdateManagementRole={handleUpdateManagementRole}
              handleUpdateMerchandiseCategory={handleUpdateMerchandiseCategory}
              handleUpdateMerchandisePrice={handleUpdateMerchandisePrice}
              handleUpdateMerchandiseStockStatus={handleUpdateMerchandiseStockStatus}
              handleUpdateOrderStatus={handleUpdateOrderStatus}
              handleUpdatePlayerJersey={handleUpdatePlayerJersey}
              handleUpdatePlayerName={handleUpdatePlayerName}
              handleUpdatePlayerPosition={handleUpdatePlayerPosition}
              hasRealPassportPhoto={hasRealPassportPhoto}
              isAdminAuthenticated={isAdminAuthenticated}
              isAdminResetPending={isAdminResetPending}
              isLoadingAdminInbox={isLoadingAdminInbox}
              isLoadingMemberships={isLoadingMemberships}
              isLoadingOrders={isLoadingOrders}
              isNewspaperResetPending={isNewspaperResetPending}
              isPending={isPending}
              isSendingAdminReply={isSendingAdminReply}
              listedShopItemsOpen={listedShopItemsOpen}
              loadAdminInboxThread={loadAdminInboxThread}
              loadAdminInboxThreads={loadAdminInboxThreads}
              loadAdminMemberships={loadAdminMemberships}
              loadAdminOrders={loadAdminOrders}
              logoutAdminSession={logoutAdminSession}
              managementMembersSorted={managementMembersSorted}
              managementPanelOpen={managementPanelOpen}
              managementUpdatesOpen={managementUpdatesOpen}
              membershipFilter={membershipFilter}
              membershipSearch={membershipSearch}
              merchAdminPriceDrafts={merchAdminPriceDrafts}
              newspaperLoginPassword={newspaperLoginPassword}
              newspaperResetAdminPassword={newspaperResetAdminPassword}
              newspaperResetConfirmPassword={newspaperResetConfirmPassword}
              newspaperResetNewPassword={newspaperResetNewPassword}
              notificationConfig={notificationConfig}
              orderFilter={orderFilter}
              orderSearch={orderSearch}
              playerPanelOpen={playerPanelOpen}
              publishedHighlightsOpen={publishedHighlightsOpen}
              resetAdminPlayerForm={resetAdminPlayerForm}
              returnToSignIn={returnToSignIn}
              revokingMembershipId={revokingMembershipId}
              selectedInboxCustomer={selectedInboxCustomer}
              selectedInboxCustomerId={selectedInboxCustomerId}
              setActiveHighlight={setActiveHighlight}
              setAdminAwayScore={setAdminAwayScore}
              setAdminGalleryCaption={setAdminGalleryCaption}
              setAdminGalleryCategory={setAdminGalleryCategory}
              setAdminGalleryFile={setAdminGalleryFile}
              setAdminGalleryPreview={setAdminGalleryPreview}
              setAdminHighlightCategory={setAdminHighlightCategory}
              setAdminHighlightDescription={setAdminHighlightDescription}
              setAdminHighlightThumbFile={setAdminHighlightThumbFile}
              setAdminHighlightThumbPreview={setAdminHighlightThumbPreview}
              setAdminHighlightTitle={setAdminHighlightTitle}
              setAdminHighlightVideoFile={setAdminHighlightVideoFile}
              setAdminHighlightVideoPreview={setAdminHighlightVideoPreview}
              setAdminHomeScore={setAdminHomeScore}
              setAdminIsHome={setAdminIsHome}
              setAdminManagementBio={setAdminManagementBio}
              setAdminManagementCategory={setAdminManagementCategory}
              setAdminManagementFile={setAdminManagementFile}
              setAdminManagementName={setAdminManagementName}
              setAdminManagementOrder={setAdminManagementOrder}
              setAdminManagementPosition={setAdminManagementPosition}
              setAdminManagementResponsibilities={setAdminManagementResponsibilities}
              setAdminMatchDate={setAdminMatchDate}
              setAdminMatchTime={setAdminMatchTime}
              setAdminMatchType={setAdminMatchType}
              setAdminMemberName={setAdminMemberName}
              setAdminMemberPhone={setAdminMemberPhone}
              setAdminMemberPlanId={setAdminMemberPlanId}
              setAdminMerchDesc={setAdminMerchDesc}
              setAdminMerchFile={setAdminMerchFile}
              setAdminMerchName={setAdminMerchName}
              setAdminMerchPrice={setAdminMerchPrice}
              setAdminMerchSizes={setAdminMerchSizes}
              setAdminMerchStockStatus={setAdminMerchStockStatus}
              setAdminMerchType={setAdminMerchType}
              setAdminNewsContent={setAdminNewsContent}
              setAdminNewsFile={setAdminNewsFile}
              setAdminNewsSummary={setAdminNewsSummary}
              setAdminNewsTitle={setAdminNewsTitle}
              setAdminOpponent={setAdminOpponent}
              setAdminOpponentLogoFile={setAdminOpponentLogoFile}
              setAdminOpponentLogoUrl={setAdminOpponentLogoUrl}
              setAdminPanelView={setAdminPanelView}
              setAdminPassword={setAdminPassword}
              setAdminPlayerApps={setAdminPlayerApps}
              setAdminPlayerAssists={setAdminPlayerAssists}
              setAdminPlayerBio={setAdminPlayerBio}
              setAdminPlayerFile={setAdminPlayerFile}
              setAdminPlayerGoals={setAdminPlayerGoals}
              setAdminPlayerJersey={setAdminPlayerJersey}
              setAdminPlayerName={setAdminPlayerName}
              setAdminPlayerPos={setAdminPlayerPos}
              setAdminReplyDraft={setAdminReplyDraft}
              setAdminResetCode={setAdminResetCode}
              setAdminResetConfirmPassword={setAdminResetConfirmPassword}
              setAdminResetNewPassword={setAdminResetNewPassword}
              setAdminResetPhone={setAdminResetPhone}
              setAdminResetStep={setAdminResetStep}
              setAdminSquadTeam={setAdminSquadTeam}
              setAdminStatus={setAdminStatus}
              setAdminVenue={setAdminVenue}
              setBulkPhotoFiles={setBulkPhotoFiles}
              setBulkPhotosOpen={setBulkPhotosOpen}
              setEditingFixtureId={setEditingFixtureId}
              setListedShopItemsOpen={setListedShopItemsOpen}
              setManagementPanelOpen={setManagementPanelOpen}
              setManagementUpdatesOpen={setManagementUpdatesOpen}
              setMembershipFilter={setMembershipFilter}
              setMembershipSearch={setMembershipSearch}
              setMerchAdminPriceDrafts={setMerchAdminPriceDrafts}
              setNewsPreviewOpen={setNewsPreviewOpen}
              setNewspaperLoginPassword={setNewspaperLoginPassword}
              setNewspaperResetAdminPassword={setNewspaperResetAdminPassword}
              setNewspaperResetConfirmPassword={setNewspaperResetConfirmPassword}
              setNewspaperResetNewPassword={setNewspaperResetNewPassword}
              setOrderFilter={setOrderFilter}
              setOrderSearch={setOrderSearch}
              setPlayerPanelOpen={setPlayerPanelOpen}
              setPublishedHighlightsOpen={setPublishedHighlightsOpen}
              setShowAdminPasswordReset={setShowAdminPasswordReset}
              setShowArchivedOrders={setShowArchivedOrders}
              setShowNewspaperPasswordReset={setShowNewspaperPasswordReset}
              setSquadUpdatesOpen={setSquadUpdatesOpen}
              setStaffLoginMode={setStaffLoginMode}
              showAdminPasswordReset={showAdminPasswordReset}
              showArchivedOrders={showArchivedOrders}
              showNewspaperPasswordReset={showNewspaperPasswordReset}
              showToast={showToast}
              squadPlayersSorted={squadPlayersSorted}
              squadUpdatesOpen={squadUpdatesOpen}
              staffLoginMode={staffLoginMode}
              updatingManagementNameId={updatingManagementNameId}
              updatingManagementRoleId={updatingManagementRoleId}
              updatingOrderId={updatingOrderId}
              updatingPlayerJerseyId={updatingPlayerJerseyId}
              updatingPlayerNameId={updatingPlayerNameId}
              updatingPlayerPositionId={updatingPlayerPositionId}
              visibleAdminMemberships={visibleAdminMemberships}
          />
        )}
      </main>

      {/* ================= SHOPPING CART COLLAPSIBLE PANEL ================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>

          <div className="absolute inset-y-0 right-0 pl-0 sm:pl-10 max-w-full flex">
            <div className="w-screen max-w-full sm:max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-100">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5.5 h-5.5 text-slate-950" />
                  <h2 className="font-black text-lg text-slate-950">Legends Fan Cart</h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Cart contents */}
              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                {checkoutSuccess ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                      <Check className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-950">Checkout Successful!</h3>
                      <p className="text-xs text-slate-600 mt-2">{checkoutMessage}</p>
                      {lastOrderId && (
                        <p className="text-xs text-emerald-700 font-bold mt-3">
                          Save your order number: #{lastOrderId}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {lastOrderId && (
                        <button
                          onClick={() => {
                            setCheckoutSuccess(false);
                            setIsCartOpen(false);
                            setActiveTab("account");
                            setExpandedAccountOrderId(lastOrderId);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          Track Order #{lastOrderId}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setCheckoutSuccess(false);
                          setIsCartOpen(false);
                        }}
                        className="bg-slate-950 text-yellow-400 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-900 cursor-pointer"
                      >
                        Back to Shop
                      </button>
                    </div>
                  </div>
                ) : cart.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                    <div>
                      <p className="font-bold text-slate-500 text-sm">Your shopping cart is empty</p>
                      <p className="text-xs text-slate-400 mt-1">Sponsor the slums of Kariobangi North by buying our official kits.</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        setActiveTab("shop");
                      }}
                      className="bg-slate-950 text-yellow-400 text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider cursor-pointer"
                    >
                      Browse Jerseys
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400">
                      Buying items directly finances the team&apos;s Division One league expenses.
                    </p>

                    <div className="space-y-3">
                      {cart.map((item, idx) => (
                        <div key={idx} className="flex gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          {/* Mini kit render */}
                          <div className="w-16 h-16 flex-shrink-0 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800">
                            <span className="text-[10px] text-yellow-400 font-bold uppercase text-center px-1">
                              {getMerchandiseCategoryLabel(item.kitType)}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs text-slate-500">
                              Size: <strong>{item.size}</strong> • Qty: <strong>{item.quantity}</strong>
                            </p>
                            <p className="text-xs font-bold text-slate-950">
                              {fanMembership ? (
                                <>
                                  <span className="mr-1.5 line-through font-semibold text-slate-400">
                                    Ksh {(item.price * item.quantity).toLocaleString()}
                                  </span>
                                  Ksh {(applyMemberUnitPrice(item.price) * item.quantity).toLocaleString()}
                                </>
                              ) : (
                                <>Ksh {(item.price * item.quantity).toLocaleString()}</>
                              )}
                            </p>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.merchId, item.size)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <hr className="border-slate-100" />

                  {/* Checkout — account required */}
                  {!customerProfile ? (
                    renderFanAuthPanel(
                      "Fan account to checkout",
                      "Sign in or register here to pay with M-Pesa or cash on delivery.",
                      true
                    )
                  ) : (
<form
  onSubmit={handleCheckoutSubmit}
  className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200"
>
  <div>
    <p className="font-black text-sm text-slate-950">
      Delivery & Payment
    </p>

    <p className="text-[10px] text-slate-500 mt-1">
      Complete your details below to place your merchandise order.
    </p>
  </div>

  {/* Recipient Name */}
  <div className="space-y-1">
    <label className="text-[9px] text-slate-400 font-bold uppercase block">
      Recipient Name
    </label>

    <input
      type="text"
      placeholder="e.g. John Kamau"
      value={checkoutName}
      onChange={(e) => setCheckoutName(e.target.value)}
      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
      required
    />
  </div>

  {/* Delivery Address */}
  <div className="space-y-1">
    <label className="text-[9px] text-slate-400 font-bold uppercase block">
      Delivery Address
    </label>

    <textarea
      rows={3}
      placeholder="Estate, street, building, and any delivery notes"
      value={checkoutDeliveryAddress}
      onChange={(e) => setCheckoutDeliveryAddress(e.target.value)}
      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 resize-none"
      required
    />

    <span className="text-[8px] text-slate-400 block">
      Include area, landmark, and phone contact if someone else will receive the order.
    </span>
  </div>

  {/* Order Note */}
  <div className="space-y-1">
    <label className="text-[9px] text-slate-400 font-bold uppercase block">
      Order Note (optional)
    </label>

    <textarea
      rows={2}
      maxLength={500}
      placeholder="Anything else we should know? e.g. preferred delivery time, a gift message..."
      value={checkoutNote}
      onChange={(e) => setCheckoutNote(e.target.value)}
      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 resize-none"
    />
  </div>

  {/* Jersey personalization */}
  {cartJerseyItems.length > 0 && (
    <div className="space-y-3">
      <div>
        <label className="text-[9px] text-slate-400 font-bold uppercase block">
          Jersey Personalization
        </label>
        <p className="text-[8px] text-slate-400 mt-1">
          Choose whether to print a name on each jersey in your order.
        </p>
      </div>

      {cartJerseyItems.map((item) => {
        const key = getCartItemKey(item);
        const customization = cartCustomizations[key] || {
          jerseyNameOption: "none" as const,
          jerseyName: "",
        };

        return (
          <div
            key={key}
            className="rounded-xl border border-slate-200 bg-white p-3 space-y-3"
          >
            <p className="text-xs font-bold text-slate-900">
              {item.name} • Size {item.size}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  updateCartCustomization(key, {
                    jerseyNameOption: "none",
                    jerseyName: "",
                  })
                }
                className={`p-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition ${
                  customization.jerseyNameOption === "none"
                    ? "bg-slate-950 text-yellow-400 border-slate-950"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                No name on jersey
              </button>

              <button
                type="button"
                onClick={() =>
                  updateCartCustomization(key, { jerseyNameOption: "name" })
                }
                className={`p-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition ${
                  customization.jerseyNameOption === "name"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Add name on jersey
              </button>
            </div>

            {customization.jerseyNameOption === "name" && (
              <input
                type="text"
                placeholder="Name to print (max 15 letters)"
                value={customization.jerseyName}
                maxLength={15}
                onChange={(e) =>
                  updateCartCustomization(key, {
                    jerseyName: e.target.value.toUpperCase(),
                  })
                }
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 uppercase"
              />
            )}
          </div>
        );
      })}
    </div>
  )}

  {/* Payment Method */}
  <div className="space-y-2">

    <label className="text-[9px] text-slate-400 font-bold uppercase block">
      Payment Method
    </label>

    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => setCheckoutMethod("mpesa")}
        className={`p-3 rounded-xl border-2 font-black text-xs flex items-center justify-center gap-2 transition ${
          checkoutMethod === "mpesa"
            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
        }`}
      >
        <Phone className="w-4 h-4" />
        M-PESA
      </button>

      <button
        type="button"
        onClick={() => setCheckoutMethod("cash")}
        className={`p-3 rounded-xl border-2 font-black text-xs flex items-center justify-center gap-2 transition ${
          checkoutMethod === "cash"
            ? "bg-slate-950 text-yellow-400 border-slate-950 shadow-sm"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
        }`}
      >
        <Banknote className="w-4 h-4" />
        Cash
      </button>
    </div>

  </div>

  {/* M-Pesa Payment Details */}
  {checkoutMethod === "mpesa" && (
    <div className="space-y-3">

      {/* PayBill information */}
      <div className="rounded-2xl bg-slate-950 text-white p-4 border border-slate-800">

        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
            M-Pesa Payment
          </p>

          <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
            SECURE
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">

          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[8px] text-slate-400 uppercase font-bold">
              PayBill Number
            </p>

            <p className="text-xl font-black text-yellow-400 mt-1">
              {MPESA_PAYBILL.paybill}
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[8px] text-slate-400 uppercase font-bold">
              Account
            </p>

            <p className="text-xs font-black text-white mt-2">
              {MPESA_PAYBILL.account}
            </p>
          </div>

        </div>

      </div>

      {/* Phone Number */}
      <div className="space-y-1">

        <label className="text-[9px] text-slate-400 font-bold uppercase block">
          M-Pesa Mobile Number
        </label>

        <div className="relative">

          <Phone className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400" />

          <input
            type="tel"
            placeholder="0712345678"
            value={checkoutPhone}
            onChange={(e) => setCheckoutPhone(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            required
          />

        </div>

        <span className="text-[8px] text-slate-400 block">
          Enter your Kenyan M-Pesa number.
        </span>

      </div>

      {/* Payment instructions */}
      <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3">

        <p className="text-[9px] font-black uppercase tracking-wider text-slate-900 mb-2">
          How to Pay
        </p>

        <ol className="space-y-1 text-[9px] text-slate-600 leading-relaxed">
          <li>1. Open M-Pesa on your phone.</li>
          <li>2. Select <strong>Lipa na M-Pesa</strong>.</li>
          <li>3. Select <strong>PayBill</strong>.</li>
          <li>
            4. Enter PayBill <strong>{MPESA_PAYBILL.paybill}</strong>.
          </li>
          <li>
            5. Enter Account <strong>{MPESA_PAYBILL.account}</strong>.
          </li>
          <li>
            6. Enter the order amount and confirm.
          </li>
        </ol>

      </div>

    </div>
  )}

  {checkoutMethod === "cash" && (
    <div className="space-y-3">
      <div className="rounded-2xl bg-slate-950 text-white p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
            Cash on Delivery
          </p>
          <span className="text-[9px] font-bold bg-yellow-400/15 text-yellow-300 px-2 py-1 rounded-full">
            Pay on delivery
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Your order will be placed now. Pay the total in cash when the merchandise is delivered or when you collect it from the club.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-[9px] text-slate-400 font-bold uppercase block">
          Contact Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="tel"
            placeholder="0712345678"
            value={checkoutPhone}
            onChange={(e) => setCheckoutPhone(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
            required
          />
        </div>
        <span className="text-[8px] text-slate-400 block">
          We will call or text this number about delivery.
        </span>
      </div>
    </div>
  )}

  {/* Order Amount */}
  <div className="flex items-center justify-between px-1 pt-1">

    <span className="text-xs font-bold text-slate-600">
      {checkoutMethod === "cash" ? "Total Due on Delivery" : "Amount to Pay"}
    </span>

    <span className="text-lg font-black text-emerald-600">
      Ksh {cartTotal.toLocaleString()}
    </span>

  </div>
  {fanMembership && cartSavings > 0 && (
    <p className="text-[11px] font-bold text-emerald-700 px-1">
      Member price: {MEMBER_SHOP_DISCOUNT_PERCENT}% off applied
    </p>
  )}

  {/* Confirm Payment */}
  <button
    type="submit"
    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2"
  >
    {checkoutMethod === "cash" ? (
      <>
        <Banknote className="w-4 h-4" />
        Place Cash Order
      </>
    ) : (
      <>
        <Check className="w-4 h-4" />
        Confirm M-Pesa Payment
      </>
    )}
  </button>

  <p className="text-[8px] text-center text-slate-400 leading-relaxed">
    {checkoutMethod === "cash"
      ? "Your order is saved immediately. Payment is collected in cash on delivery or pickup."
      : "Your order will be recorded after checkout. Keep your M-Pesa confirmation message for reference."}
  </p>

</form>
                  )}
                  </div>
                )}
              </div>

              {/* Footer Total bar */}
              {!checkoutSuccess && cart.length > 0 && (
                <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-slate-950">Subtotal Amount:</span>
                    <span className="font-black text-lg text-emerald-600">
                      Ksh {cartTotal.toLocaleString()}
                    </span>
                  </div>
                  {fanMembership && cartSavings > 0 && (
                    <p className="text-[11px] font-bold text-emerald-700">
                      {fanMembership.planName} perk: you save Ksh {cartSavings.toLocaleString()}
                    </p>
                  )}
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                    <span>Supporting local Nairobi factories</span>
                    <span>approx. ${(cartTotal / 130).toFixed(2)} USD</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= HIGHLIGHT VIDEO MODAL ================= */}
      {activeHighlight && (
        <div
          className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveHighlight(null)}
        >
          <div
            className="relative w-full max-w-5xl bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveHighlight(null)}
              className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close video"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-video bg-black">
              <video
                key={activeHighlight.id}
                src={activeHighlight.videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-5 sm:p-6 space-y-2 border-t border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  {activeHighlight.category}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {new Date(activeHighlight.createdAt).toLocaleDateString("en-KE", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">{activeHighlight.title}</h3>
              {activeHighlight.description && (
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeHighlight.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedShopItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setSelectedShopItemId(null)} />
          <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-white p-5 md:p-7 flex items-center justify-center min-h-[280px]">
                {renderProductPhoto(selectedShopItem)}
              </div>
              <div className="space-y-5 p-5 md:p-7">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                      {getMerchandiseCategoryMeta(selectedShopItem.kitType).label}
                    </p>
                    <h3 className="text-2xl font-black text-slate-950 leading-tight">
                      {getImprovedMerchandiseCopy(selectedShopItem).name}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {getImprovedMerchandiseCopy(selectedShopItem).description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedShopItemId(null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                    aria-label="Close product details"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-lg font-black text-emerald-700">
                  {formatShopPrice(selectedShopItem.price)}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Choose size</p>
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                      Selected: {selectedSizes[selectedShopItem.id] || selectedShopItem.sizes.split(",")[0].trim()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedShopItem.sizes.split(",").map((sizeValue) => {
                      const size = sizeValue.trim();
                      const selected = (selectedSizes[selectedShopItem.id] || selectedShopItem.sizes.split(",")[0].trim()) === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            setSelectedSizes((prev) => ({ ...prev, [selectedShopItem.id]: size }));
                            setExplicitShopSizes((prev) => ({ ...prev, [selectedShopItem.id]: true }));
                          }}
                          className={`min-w-12 rounded-xl px-3 py-2 text-xs font-black uppercase ${
                            selected
                              ? "bg-slate-950 text-yellow-400 ring-2 ring-yellow-400/40"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2">Size</th>
                        <th className="px-3 py-2">Chest</th>
                        <th className="px-3 py-2">Length</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SHOP_SIZE_CHART.map((row) => (
                        <tr key={row.size} className="border-t border-slate-100">
                          <td className="px-3 py-2 font-black text-slate-900">{row.size}</td>
                          <td className="px-3 py-2 text-slate-600">{row.chest}</td>
                          <td className="px-3 py-2 text-slate-600">{row.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-900">
                  {SHOP_DELIVERY_NOTE}
                </p>

                <button
                  type="button"
                  disabled={!isMerchandiseAvailable(selectedShopItem.stockStatus)}
                  onClick={() => {
                    const size =
                      selectedSizes[selectedShopItem.id] ||
                      selectedShopItem.sizes.split(",")[0].trim();
                    addToCart(selectedShopItem, size);
                  }}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Add {selectedSizes[selectedShopItem.id] || selectedShopItem.sizes.split(",")[0].trim()} to cart
                </button>
              </div>
            </div>

            {relatedShopItems.length > 0 && (
              <div className="border-t border-slate-100 p-5 md:p-7 space-y-4">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-500">You may also like</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {relatedShopItems.map((item) => {
                    const copy = getImprovedMerchandiseCopy(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedShopItemId(item.id)}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-emerald-200"
                      >
                        <p className="text-sm font-black text-slate-950">{copy.name}</p>
                        <p className="mt-1 text-xs text-emerald-700 font-bold">{formatShopPrice(item.price)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {newsPreviewOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setNewsPreviewOpen(false)} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Preview</p>
                <h3 className="text-2xl font-black text-slate-950 mt-1">{adminNewsTitle}</h3>
              </div>
              <button type="button" onClick={() => setNewsPreviewOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {adminNewsFile && (
              <p className="text-xs font-semibold text-emerald-700">Photo ready: {adminNewsFile.name}</p>
            )}
            <p className="text-sm font-semibold text-slate-600">{adminNewsSummary}</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{adminNewsContent}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewsPreviewOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-black uppercase tracking-wider text-slate-600"
              >
                Keep editing
              </button>
              <button
                type="button"
                disabled={adminBusy === "news"}
                onClick={() => {
                  setNewsPreviewOpen(false);
                  void handleAdminAddNews({ preventDefault() {} } as React.FormEvent);
                }}
                className="flex-1 rounded-xl bg-slate-950 py-2.5 text-xs font-black uppercase tracking-wider text-yellow-400 disabled:opacity-50"
              >
                {adminBusy === "news" ? "Publishing..." : "Looks good, publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= PLAYER PROFILE MODAL ================= */}
      {viewingPlayer && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setViewingPlayerId(null)} />
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setViewingPlayerId(null)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-md cursor-pointer"
              aria-label="Close player profile"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-5">
              <div className="md:col-span-2 relative bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.35),transparent_60%)]" />
                <div className="relative z-10 w-36 sm:w-44">
                  <PassportPhoto
                    imageUrl={viewingPlayer.imageUrl}
                    alt={`${viewingPlayer.name} - Kariobangi Legends`}
                    size="md"
                  />
                </div>
                <span className="relative z-10 mt-5 inline-flex items-center justify-center min-w-14 h-14 px-3 rounded-2xl bg-white/10 border border-white/15 text-yellow-400 text-2xl font-black backdrop-blur-sm">
                  #{viewingPlayer.jerseyNumber}
                </span>
              </div>

              <div className="md:col-span-3 p-6 sm:p-8 space-y-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                    {getSquadPositionBadge(viewingPlayer.position)}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
                    {viewingPlayer.name}
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 py-3 text-center">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Apps</p>
                    <p className="text-xl font-black text-slate-950 mt-0.5">{viewingPlayer.appearances}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 py-3 text-center">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Goals</p>
                    <p className="text-xl font-black text-slate-950 mt-0.5">{viewingPlayer.goals}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 py-3 text-center">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Assists</p>
                    <p className="text-xl font-black text-slate-950 mt-0.5">{viewingPlayer.assists}</p>
                  </div>
                </div>

                {viewingPlayer.bio ? (
                  <p className="text-sm text-slate-600 leading-relaxed">{viewingPlayer.bio}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">Bio coming soon.</p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setViewingPlayerId(null);
                    openSquadPlayerShop();
                  }}
                  className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-yellow-400 font-black text-[10px] uppercase tracking-wider px-5 py-3 rounded-xl transition cursor-pointer"
                >
                  Shop Official Jersey
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MANAGEMENT PROFILE MODAL ================= */}
      {viewingManagementMember && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setViewingManagementId(null)} />
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setViewingManagementId(null)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-md cursor-pointer"
              aria-label="Close profile"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-5">
              <div className="md:col-span-2 relative bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.35),transparent_60%)]" />
                <div className="relative z-10 w-36 sm:w-44">
                  <PassportPhoto
                    imageUrl={viewingManagementMember.imageUrl}
                    alt={`${viewingManagementMember.name} - ${viewingManagementMember.position}`}
                    size="md"
                  />
                </div>
                <span className="relative z-10 mt-5 inline-flex items-center px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-yellow-400 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                  {getManagementRoleBadge(viewingManagementMember.position, viewingManagementMember.category)}
                </span>
              </div>

              <div className="md:col-span-3 p-6 sm:p-8 space-y-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
                    {viewingManagementMember.position}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
                    {viewingManagementMember.name}
                  </h2>
                </div>

                {viewingManagementMember.responsibilities || viewingManagementMember.bio ? (
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {viewingManagementMember.responsibilities || viewingManagementMember.bio}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    Bio coming soon.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= IMAGE REPLACE MODAL ================= */}
      {replaceImageId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setReplaceImageId(null)}></div>
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-slate-950 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                {replaceImageType === "player"
                  ? "Replace Player Photo"
                  : replaceImageType === "management"
                    ? "Replace Management Photo"
                    : replaceImageType === "gallery"
                      ? "Replace Gallery Photo"
                      : replaceImageType === "merch"
                        ? "Replace Product Photo"
                        : "Replace News Article Photo"}
              </h3>
              <button
                onClick={() => setReplaceImageId(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Choose a new photo directly from your computer. The photo will be uploaded to Supabase Storage and the database record will be updated automatically.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase block">
                  New Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setReplaceImageFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-950 file:text-yellow-400 hover:file:bg-slate-800 cursor-pointer"
                />
                {replaceImageFile && (
                  <p className="text-xs text-emerald-600 font-semibold">
                    Selected: {replaceImageFile.name}
                  </p>
                )}
              </div>

              {replaceImageType === "gallery" && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">
                    Updated Caption (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Update the caption for this photo..."
                    value={replaceImageNewCaption}
                    onChange={(e) => setReplaceImageNewCaption(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 text-[11px] text-blue-800 leading-relaxed">
                Photos are stored in the Supabase <strong>gallery</strong> bucket. You no longer need to paste image URLs or copy files into <code className="font-mono bg-blue-100 px-1 rounded">public/images/</code>.
              </div>
            </div>

            {(replaceImageType === "player" || replaceImageType === "management") &&
              isUploadedMediaUrl(replaceImageCurrentUrl) && (
                <div className="border-t border-dashed border-slate-200 pt-4 space-y-2">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Remove the current photo instead? This reverts the {replaceImageType === "player" ? "player" : "profile"} card to "Photo coming soon" until a new one is uploaded.
                  </p>
                  <button
                    onClick={handleRemoveImage}
                    disabled={adminBusy === "remove-image"}
                    className="w-full inline-flex items-center justify-center gap-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {adminBusy === "remove-image" ? "Removing..." : "Remove Current Photo"}
                  </button>
                </div>
              )}

            <div className="flex gap-3">
              <button
                onClick={() => setReplaceImageId(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReplaceImage}
                disabled={adminBusy === "replace-image" || !replaceImageFile}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adminBusy === "replace-image" ? "Replacing..." : "Confirm Replace"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Branding */}
<footer className="bg-slate-950 text-white mt-12 sm:mt-20 border-t-2 border-yellow-500/30">

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">

    {/* ================= FOOTER BRANDING ================= */}
    <div className="space-y-5">

      {/* Club Logo + Name */}
      <div className="flex items-center gap-3">

        <div className="relative w-12 h-12 flex items-center justify-center">

          <Image
            src="/assets/logo.png"
            alt="Kariobangi Legends FC badge"
            fill
            sizes="48px"
            className="object-contain"
          />

        </div>

        <div>
          <span className="font-black italic text-sm tracking-wide text-white">
            KARIOBANGI
            <span className="text-emerald-400 ml-1">
              LEGENDS
            </span>
          </span>

          <p className="text-[9px] text-yellow-400 font-bold uppercase tracking-widest mt-0.5">
            Football Club
          </p>
        </div>

      </div>

      {/* Club Description */}
      <p className="text-xs text-slate-400 leading-relaxed">
        Empowering slum youths of Kariobangi North in Nairobi County through
        high-discipline sports and active educational collaboration.
        Molding the future legends of Kenya.
      </p>

      <SocialMediaLinks />

    </div>


    {/* ================= IDENTITY & KITS ================= */}
    <div className="space-y-3 text-xs">

      <h4 className="font-bold uppercase tracking-wider text-yellow-400">
        Our Identity & Kits
      </h4>

      <p className="text-slate-400 leading-relaxed">
        <strong>Home Kit:</strong> Sleek Resilience Black (Survival in the Slums).
      </p>

      <p className="text-slate-400 leading-relaxed">
        <strong>Away Kits:</strong> Emerald Hope Green & Pure White.
      </p>

    </div>


    {/* ================= QUICK NAVIGATION ================= */}
    <div className="space-y-3 text-xs">

      <h4 className="font-bold uppercase tracking-wider text-emerald-400">
        Quick Navigation
      </h4>

      <ul className="space-y-2">

        {[
          { label: "Our Story", tab: "history" },
          { label: "Matches & Fixtures", tab: "fixtures" },
          { label: "Team Photo Gallery", tab: "gallery" },
          { label: "Team Highlights", tab: "highlights" },
          { label: "Fan Zone", tab: "fanzone" },
          { label: "Merchandise Shop", tab: "shop" },
          { label: "Join as a Fan", tab: "membership" },
          ...(customerProfile ? [{ label: "My Account", tab: "account" }] : []),
          { label: "Donations", tab: "donors" },
          { label: "Contact Centre", tab: "contact" },
        ].map((item, idx) => (

          <li key={idx}>

            <button
              onClick={() => {
                setActiveTab(item.tab);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-slate-400 hover:text-white transition cursor-pointer text-left"
            >
              {item.label}
            </button>

          </li>

        ))}

      </ul>

    </div>


    {/* ================= CONTACT ================= */}
    <div className="space-y-3 text-xs">

      <h4 className="font-bold uppercase tracking-wider text-yellow-400">
        Contact Centre
      </h4>

      <p className="text-slate-400 leading-relaxed">
        {CONTACT_CENTER.location.fullAddress}
      </p>

      <GetDirectionsLink
        variant="text"
        label="Directions to the ground"
        className="text-yellow-400 hover:text-yellow-300 text-[11px]"
      />

      <div className="space-y-1.5">
        {CONTACT_CENTER.phones.map((line) => (
          <a
            key={line.number}
            href={toTelHref(line.number)}
            className="block text-slate-300 hover:text-yellow-400 transition"
          >
            {formatPhoneDisplay(line.number)}
          </a>
        ))}
      </div>

      <a
        href={`mailto:${CONTACT_CENTER.email}`}
        className="block text-slate-300 hover:text-yellow-400 transition break-all"
      >
        {CONTACT_CENTER.email}
      </a>

      <button
        type="button"
        onClick={() => {
          setActiveTab("contact");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider text-[10px] transition cursor-pointer"
      >
        Open Contact Centre →
      </button>

      <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-900">
        © <span suppressHydrationWarning>{new Date().getFullYear()}</span> Kariobangi Legends FC. Made with love for Nairobi youth.
      </p>

    </div>

  </div>

</footer>
    </div>
  );
}


