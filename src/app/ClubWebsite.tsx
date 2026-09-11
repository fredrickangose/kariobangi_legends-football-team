"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Settings,
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
  Menu,
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
  UserPlus,
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
  isUploadedMediaUrl,
  MEDIA_UPLOAD_RULES,
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
} from "@/lib/management-roles";
import {
  COMPETITION_NAME,
  combineFixtureDateTime,
  formatKickoff,
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
  MATCH_STATUSES,
  MATCH_TYPES,
  partitionFixtures,
  toFixtureDateInputValue,
  toFixtureTimeInputValue,
  type TeamDisplay,
} from "@/lib/match-fixtures";
import {
  getGoogleDirectionsUrl,
  getGoogleMapsViewUrl,
  HOME_GROUND,
  isClubHomeVenue,
} from "@/lib/venue-directions";
import {
  submitDonation,
  submitFanMessage,
  addPlayer,
  addNews,
  addGalleryImage,
  deletePlayer,
  deleteNews,
  deleteGalleryImage,
  updatePlayerPosition,
  updatePlayerImage,
  updateNewsImage,
  updateGalleryImage,
  addMerchandise,
  updateMerchandiseImage,
  deleteMerchandise,
  addManagement,
  updateManagement,
  updateManagementRole,
  deleteManagement,
  addFixture,
  updateFixture,
  deleteFixture,
  getOrders,
  updateOrderStatus,
  trackOrder,
  getNotificationSetup,
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
interface Player {
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

interface Fixture {
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
}

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  createdAt: Date;
}

interface MerchandiseItem {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  sizes: string;
  kitType: string;
}

interface Donation {
  id: number;
  donorName: string;
  amount: number;
  currency?: string | null;
  message: string | null;
  purpose: string;
  createdAt: Date;
}

interface FanMessage {
  id: number;
  name: string;
  message: string;
  createdAt: Date;
}

interface GalleryItem {
  id: number;
  imageUrl: string;
  caption: string;
  category: string;
  createdAt: Date;
}

interface ManagementMember {
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
    management: ManagementMember[];
  };
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
            M-Pesa Payment
          </p>
          <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full">
            Secure
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[8px] text-slate-400 uppercase font-bold">PayBill Number</p>
            <p className="text-xl font-black text-yellow-400 mt-1">{MPESA_PAYBILL.paybill}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[8px] text-slate-400 uppercase font-bold">Account</p>
            <p className="text-xs font-black text-white mt-2 leading-snug">
              {MPESA_PAYBILL.account}
            </p>
          </div>
        </div>

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
            M-Pesa mobile number (optional)
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="tel"
              placeholder="0712345678"
              value={phone ?? ""}
              onChange={(e) => onPhoneChange(e.target.value)}
              className="w-full text-sm pl-9 pr-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <span className="text-[10px] text-slate-400 block">
            For payment confirmation and receipt follow-up.
          </span>
        </div>
      )}

      <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3 sm:p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-900 mb-2">
          How to pay via M-Pesa
        </p>
        <ol className="space-y-1 text-xs text-slate-600 leading-relaxed list-decimal list-inside">
          <li>Open M-Pesa on your phone.</li>
          <li>Select <strong>Lipa na M-Pesa</strong>, then <strong>PayBill</strong>.</li>
          <li>
            Enter PayBill <strong>{MPESA_PAYBILL.paybill}</strong> and Account{" "}
            <strong>{MPESA_PAYBILL.account}</strong>.
          </li>
          <li>
            Enter {displayAmount} and confirm with your M-Pesa PIN.
          </li>
          <li>Submit your details below so we can acknowledge your gift.</li>
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

function formatPhoneDisplay(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return number;
}

function formatStoredPhoneForInput(number: string): string {
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
  href: string;
  label: string;
  title: string;
  hoverClassName: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={title}
      className={`group relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 text-white shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${hoverClassName}`}
    >
      <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-white/10 to-transparent" />
      <span className="relative z-10 transition-transform duration-300 group-hover:scale-110">
        {children}
      </span>
    </a>
  );
}

function SocialMediaLinks() {
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
      </div>
    </div>
  );
}

function PersonPhoto({
  imageUrl,
  alt,
  maxHeightClass = "max-h-[136px] sm:max-h-[152px]",
}: {
  imageUrl: string | null | undefined;
  alt: string;
  maxHeightClass?: string;
}) {
  if (isUploadedMediaUrl(imageUrl)) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={imageUrl as string}
        alt={alt}
        className={`max-w-full ${maxHeightClass} w-auto h-auto object-contain drop-shadow-md`}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-slate-400 py-4 px-3 text-center">
      <User className="w-9 h-9" />
      <p className="text-[9px] font-bold uppercase tracking-wider mt-2">
        Photo pending upload
      </p>
    </div>
  );
}

function SquadPlayerCard({
  player,
  isAdminAuthenticated,
  isUpdatingPosition,
  onReplaceImage,
  onDelete,
  onPositionChange,
  onShopClick,
}: {
  player: Player;
  isAdminAuthenticated: boolean;
  isUpdatingPosition: boolean;
  onReplaceImage: (id: number, imageUrl: string) => void;
  onDelete: (id: number, name: string) => void;
  onPositionChange: (id: number, position: string) => void;
  onShopClick: () => void;
}) {
  const positionInOptions = SQUAD_POSITION_OPTIONS.some(
    (option) => option.value === player.position
  );

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div className="p-3.5 sm:p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 text-slate-950 font-black text-[11px] flex items-center justify-center border border-slate-200">
              #{player.jerseyNumber}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                {player.name}
              </h3>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5 line-clamp-1">
                {getSquadPositionBadge(player.position)}
              </p>
            </div>
          </div>
          <span className="shrink-0 bg-slate-100 px-1.5 py-0.5 rounded text-[8px] font-bold text-slate-500 uppercase">
            Senior
          </span>
        </div>

        <div className="w-full h-40 sm:h-44 rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 border border-slate-100 flex items-center justify-center p-2">
          <PersonPhoto
            imageUrl={player.imageUrl}
            alt={`${player.name} - Kariobangi Legends`}
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2.5 rounded-xl text-center">
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Apps</p>
            <p className="text-xs font-black text-slate-900">{player.appearances}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Goals</p>
            <p className="text-xs font-black text-slate-900">{player.goals}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Assists</p>
            <p className="text-xs font-black text-slate-900">{player.assists}</p>
          </div>
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/30">
          <strong>Scout Notes:</strong> {player.bio}
        </p>

        {isAdminAuthenticated && (
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Squad section
            </label>
            <select
              value={player.position}
              onChange={(e) => onPositionChange(player.id, e.target.value)}
              disabled={isUpdatingPosition}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 disabled:opacity-50"
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
          </div>
        )}
      </div>

      <div className="bg-slate-950 text-white px-3.5 py-2.5 flex justify-between items-center text-xs border-t border-slate-900 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {isAdminAuthenticated && (
            <>
              <button
                onClick={() => onReplaceImage(player.id, player.imageUrl)}
                className="text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider text-[9px] flex items-center gap-0.5 cursor-pointer shrink-0"
                title="Replace this player's photo"
              >
                <Camera className="w-3 h-3" /> Swap
              </button>
              <button
                onClick={() => onDelete(player.id, player.name)}
                className="text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider text-[9px] flex items-center gap-0.5 cursor-pointer shrink-0"
                title="Remove player from squad"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </>
          )}
        </div>
        <button
          onClick={onShopClick}
          className="text-yellow-400 hover:text-yellow-500 font-bold uppercase tracking-wider text-[9px] flex items-center gap-0.5 cursor-pointer shrink-0"
        >
          Jersey <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function ManagementMemberCard({
  member,
  featured = false,
  isAdminAuthenticated,
  isUpdatingRole,
  onEdit,
  onDelete,
  onRoleChange,
}: {
  member: ManagementMember;
  featured?: boolean;
  isAdminAuthenticated: boolean;
  isUpdatingRole: boolean;
  onEdit: (member: ManagementMember) => void;
  onDelete: (id: number) => void;
  onRoleChange: (id: number, category: string, position: string) => void;
}) {
  const positionOptions = getManagementPositionOptions(member.category);
  const positionInOptions = positionOptions.some(
    (option) => option.value === member.position
  );
  const roleBadge = getManagementRoleBadge(member.position, member.category);

  return (
    <div
      className={`group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${
        featured ? "md:col-span-2" : ""
      }`}
    >
      <div
        className={`relative bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 flex items-center justify-center p-3 border-b border-slate-100 ${
          featured ? "h-52 sm:h-56" : "h-44 sm:h-48"
        }`}
      >
        <PersonPhoto
          imageUrl={member.imageUrl}
          alt={`${member.name} - ${member.position}`}
          maxHeightClass={
            featured
              ? "max-h-[168px] sm:max-h-[184px]"
              : "max-h-[132px] sm:max-h-[148px]"
          }
        />

        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-lg bg-slate-950/90 text-yellow-400 text-[8px] font-black tracking-wider">
            {roleBadge}
          </span>
          {featured && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-600/95 text-white text-[8px] font-black uppercase tracking-wider">
              Club Figurehead
            </span>
          )}
        </div>

        <div className="absolute bottom-2 left-2 right-2">
          <span className="inline-flex max-w-full bg-slate-950/90 text-yellow-400 text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-md truncate">
            {member.position}
          </span>
        </div>
      </div>

      <div className={`space-y-2.5 ${featured ? "p-4 sm:p-5" : "p-3.5 sm:p-4"}`}>
        <div>
          <h4
            className={`font-black text-slate-950 leading-tight ${
              featured ? "text-base sm:text-lg" : "text-sm sm:text-base"
            }`}
          >
            {member.name}
          </h4>
          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-0.5 line-clamp-1">
            {member.position}
          </p>
        </div>

        {member.responsibilities && (
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
              Key Responsibilities
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {member.responsibilities}
            </p>
          </div>
        )}

        {member.bio && (
          <div className="space-y-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
              Profile
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {member.bio}
            </p>
          </div>
        )}

        {isAdminAuthenticated && (
          <>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Department
                </label>
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
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 disabled:opacity-50"
                >
                  {MANAGEMENT_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.dbValue}>
                      {category.heading}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Role
                </label>
                <select
                  value={member.position}
                  onChange={(e) =>
                    onRoleChange(member.id, member.category, e.target.value)
                  }
                  disabled={isUpdatingRole}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 disabled:opacity-50"
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
            </div>

            <div className="flex gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => onEdit(member)}
                className="flex-1 bg-slate-950 text-yellow-400 font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider hover:bg-slate-900 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(member.id)}
                className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider hover:bg-red-700 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </>
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
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={team.logo}
        alt={team.name}
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
  status,
  pulseLive = false,
}: {
  status: string;
  pulseLive?: boolean;
}) {
  const meta = getMatchStatusMeta(status);
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
            {normalizeMatchStatus(fixture.status) === "live" ? "LIVE" : "VS"}
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

function normalizeMatchStatus(status: string) {
  return getMatchStatusMeta(status).value;
}

function MatchFixtureCard({
  fixture,
  mode,
  isAdminAuthenticated,
  onEdit,
  onDelete,
}: {
  fixture: Fixture;
  mode: "upcoming" | "result" | "live";
  isAdminAuthenticated: boolean;
  onEdit: (fixture: Fixture) => void;
  onDelete: (id: number, opponent: string) => void;
}) {
  const result = getMatchResult(fixture);
  const tone = getResultTone(result);
  const statusMeta = getMatchStatusMeta(fixture.status);

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
        mode === "live" ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-100"
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
          <MatchStatusPill status={fixture.status} pulseLive={mode === "live"} />
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
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-100 text-[10px] font-bold uppercase tracking-wider text-rose-700">
          Match in progress · {statusMeta.label}
        </div>
      )}
    </div>
  );
}

export default function ClubWebsite({ initialData }: ClubWebsiteProps) {
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === "undefined") return "home";
    return new URLSearchParams(window.location.search).get("order")
      ? "account"
      : "home";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [galleryCarouselIndex, setGalleryCarouselIndex] = useState(0);

  const carouselGallery = useMemo(
    () =>
      initialData.gallery
        .filter((item) => isUploadedMediaUrl(item.imageUrl))
        .slice(0, HOME_CAROUSEL_PHOTO_LIMIT),
    [initialData.gallery]
  );

  const safeGalleryCarouselIndex =
    carouselGallery.length === 0
      ? 0
      : Math.min(galleryCarouselIndex, carouselGallery.length - 1);

  const squadByPosition = useMemo(
    () => groupPlayersBySquadPosition(initialData.players),
    [initialData.players]
  );

  const squadPlayersSorted = useMemo(
    () =>
      [...initialData.players].sort((a, b) => a.jerseyNumber - b.jerseyNumber),
    [initialData.players]
  );

  const managementGrouped = useMemo(
    () => groupManagementByCategoryAndRole(initialData.management),
    [initialData.management]
  );

  const managementMembersSorted = useMemo(
    () =>
      [...initialData.management].sort(
        (a, b) =>
          a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
      ),
    [initialData.management]
  );

  const todayString = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

  const fixtureGroups = useMemo(
    () => partitionFixtures(initialData.fixtures, todayString),
    [initialData.fixtures, todayString]
  );

  const seasonStats = useMemo(
    () => getSeasonStats(initialData.fixtures),
    [initialData.fixtures]
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

  useEffect(() => {
    const closeMenuOnDesktop = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", closeMenuOnDesktop);
    return () => window.removeEventListener("resize", closeMenuOnDesktop);
  }, []);

  // Automatically rotate homepage gallery every 4 seconds
useEffect(() => {
  if (carouselGallery.length <= 1) return;

  const interval = setInterval(() => {
    setGalleryCarouselIndex((current) =>
      current === carouselGallery.length - 1
        ? 0
        : current + 1
    );
  }, 4000);

  return () => clearInterval(interval);
}, [carouselGallery.length]);

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

  const selectedDonationAmount = useMemo(() => {
    const custom = customDonation ? parseFloat(customDonation) : NaN;
    if (Number.isFinite(custom) && custom > 0) return custom;
    return donationAmount > 0 ? donationAmount : null;
  }, [customDonation, donationAmount]);

  const [fanName, setFanName] = useState<string>("");
  const [fanText, setFanText] = useState<string>("");

  // Checkout states
  const [checkoutName, setCheckoutName] = useState<string>("");
  const [checkoutPhone, setCheckoutPhone] = useState<string>("");
  const [checkoutMethod, setCheckoutMethod] = useState<"mpesa" | "card">("mpesa");
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string>("");
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);

  const [trackOrderId, setTrackOrderId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("order") || "";
  });
  const [trackPhone, setTrackPhone] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("order")) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);
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
  const [accountView, setAccountView] = useState<"login" | "register">("register");
  const [pendingCheckoutAfterAuth, setPendingCheckoutAfterAuth] = useState(false);
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
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [expandedAccountOrderId, setExpandedAccountOrderId] = useState<number | null>(null);
  const customerOrdersLoadRef = useRef(false);
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
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [adminResetStep, setAdminResetStep] = useState<"request" | "confirm">("request");
  const [showAdminPasswordReset, setShowAdminPasswordReset] = useState(false);
  const [isAdminResetPending, setIsAdminResetPending] = useState(false);
  const [adminResetPhone, setAdminResetPhone] = useState("");
  const [adminResetCode, setAdminResetCode] = useState("");
  const [adminResetNewPassword, setAdminResetNewPassword] = useState("");
  const [adminResetConfirmPassword, setAdminResetConfirmPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
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
const [adminPanelView, setAdminPanelView] = useState<"content" | "inbox" | "orders">("content");
const [notificationConfig, setNotificationConfig] = useState<{
  channels: string[];
  sms: boolean;
  whatsapp: boolean;
  trackingUrlConfigured: boolean;
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
  
  const [adminPlayerName, setAdminPlayerName] = useState<string>("");
  const [adminPlayerPos, setAdminPlayerPos] = useState<string>("Centre Back");
  const [adminPlayerJersey, setAdminPlayerJersey] = useState<string>("");
  const [adminPlayerBio, setAdminPlayerBio] = useState<string>("");
  const [adminPlayerApps, setAdminPlayerApps] = useState<string>("0");
  const [adminPlayerGoals, setAdminPlayerGoals] = useState<string>("0");
  const [adminPlayerAssists, setAdminPlayerAssists] = useState<string>("0");
  const [adminPlayerFile, setAdminPlayerFile] = useState<File | null>(null);
  const [updatingPlayerPositionId, setUpdatingPlayerPositionId] = useState<number | null>(null);

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

useEffect(() => {
  return () => {
    if (adminGalleryPreview) {
      URL.revokeObjectURL(adminGalleryPreview);
    }
  };
}, [adminGalleryPreview]);

    // Management admin states
const [adminManagementName, setAdminManagementName] = useState<string>("");
const [adminManagementPosition, setAdminManagementPosition] = useState<string>("Chairman");
const [adminManagementCategory, setAdminManagementCategory] = useState<string>("Club Leadership");
const [adminManagementBio, setAdminManagementBio] = useState<string>("");
const [adminManagementResponsibilities, setAdminManagementResponsibilities] = useState<string>("");
const [adminManagementOrder, setAdminManagementOrder] = useState<string>("0");
const [adminManagementFile, setAdminManagementFile] = useState<File | null>(null);
const [editingManagementId, setEditingManagementId] = useState<number | null>(null);
const [updatingManagementRoleId, setUpdatingManagementRoleId] = useState<number | null>(null);
  // Merchandise admin state
  const [adminMerchName, setAdminMerchName] = useState<string>("");
  const [adminMerchDesc, setAdminMerchDesc] = useState<string>("");
  const [adminMerchPrice, setAdminMerchPrice] = useState<string>("");
  const [adminMerchFile, setAdminMerchFile] = useState<File | null>(null);
  const [adminMerchSizes, setAdminMerchSizes] = useState<string>("S, M, L, XL");
  const [adminMerchType, setAdminMerchType] = useState<string>("home");

  // Image replace modal state
  const [replaceImageId, setReplaceImageId] = useState<number | null>(null);
  const [replaceImageType, setReplaceImageType] = useState<"player" | "gallery" | "news" | "merch">("gallery");
  const [replaceImageFile, setReplaceImageFile] = useState<File | null>(null);
  const [replaceImageNewCaption, setReplaceImageNewCaption] = useState<string>("");

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

  // Add item to cart
  const addToCart = (item: MerchandiseItem, size: string) => {
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
          name: item.name,
          price: item.price,
          size: size,
          quantity: 1,
          kitType: item.kitType,
        },
      ]);
    }
    showToast(`Added ${item.name} (${size}) to shopping cart!`);
  };

  const removeFromCart = (merchId: number, size: string) => {
    setCart(cart.filter((i) => !(i.merchId === merchId && i.size === size)));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
            (donationCurrency === "KES"
              ? `Thank you! Complete your M-Pesa payment of ${formattedAmount} to PayBill ${MPESA_PAYBILL.paybill} (${MPESA_PAYBILL.account}).`
              : `Thank you! Your ${formattedAmount} pledge is recorded. Email ${CONTACT_CENTER.email} for international payment details.`)
        );
        setDonorName("");
        setDonationMessage("");
        setCustomDonation("");
        setDonationPhone("");
        setDonationAmount(getDefaultDonationAmount(donationCurrency));
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

  // M-PESA checkout handler
const handleCheckoutSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  if (!customerProfile) {
    redirectToCheckoutAuth(true);
    return;
  }

  if (!checkoutName) {
    showToast("Please enter your name for delivery.", "error");
    return;
  }

  if (cart.length === 0) {
    showToast("Your cart is empty.", "error");
    return;
  }

  if (checkoutMethod === "mpesa" && !checkoutPhone) {
    showToast("Please enter your M-PESA phone number.", "error");
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
            cart: cart,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          if (response.status === 401) {
            redirectToCheckoutAuth(true);
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
              `/api/mpesa/status?orderId=${orderId}`,
              {
                method: "GET",
                cache: "no-store",
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
                setCheckoutMessage(
                  `Payment successful! Your M-PESA receipt number is ${statusData.mpesaReceiptNumber || "confirmed"}. Your Kariobangi Legends merchandise order #${orderId} has been received and will be processed shortly.`
                );

                setLastOrderId(orderId);
                setTrackOrderId(String(orderId));
                setTrackPhone(checkoutPhone);

                setCart([]);

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

  // Card payment
  setCheckoutMessage(
    `Card payment of Ksh ${cartTotal.toLocaleString()} processed successfully! A receipt has been sent to your email. Your official Kariobangi Legends merchandise will be shipped shortly.`
  );

  setCheckoutSuccess(true);
  setCart([]);
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

const clearCustomerState = () => {
  setCustomerProfile(null);
  setCustomerOrders([]);
  setExpandedAccountOrderId(null);
  setCustomerMessages([]);
  setCustomerMessageDraft("");
};

const clearAdminState = () => {
  setIsAdminAuthenticated(false);
  setAdminInboxThreads([]);
  setSelectedInboxCustomerId(null);
  setSelectedInboxCustomer(null);
  setAdminInboxMessages([]);
  setAdminReplyDraft("");
};

const loadAppSessions = async () => {
  try {
    const [customerRes, adminRes] = await Promise.all([
      fetch("/api/customer/me", { credentials: "include", cache: "no-store" }),
      fetch("/api/admin/me", { credentials: "include", cache: "no-store" }),
    ]);

    const customerData = await customerRes.json();
    const adminData = await adminRes.json();

    const customerAuth =
      customerData.success && customerData.authenticated && customerData.customer;
    let adminAuth = adminData.success && adminData.authenticated;

    if (customerAuth && adminAuth) {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
      adminAuth = false;
    }

    clearCustomerState();
    clearAdminState();

    if (customerAuth) {
      setCustomerProfile(customerData.customer);
      setCheckoutName(customerData.customer.fullName);
      setCheckoutPhone(formatStoredPhoneForInput(customerData.customer.phoneNumber));
    }

    if (adminAuth) {
      setIsAdminAuthenticated(true);
    }
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

  if (isAdminAuthenticated) {
    showToast("Please sign out of the admin dashboard before creating a fan account.", "error");
    return;
  }

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
      clearAdminState();
      setCustomerProfile(data.customer);
      setCheckoutName(data.customer.fullName);
      setCheckoutPhone(formatStoredPhoneForInput(data.customer.phoneNumber));
      setRegisterPassword("");
      showToast("Account created successfully.");
      resumeCheckoutIfPending();
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

  if (isAdminAuthenticated) {
    showToast("Please sign out of the admin dashboard before signing in to your fan account.", "error");
    return;
  }

  try {
    const response = await fetch("/api/customer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: loginPhone,
        password: loginPassword,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      clearAdminState();
      setCustomerProfile(data.customer);
      setCheckoutName(data.customer.fullName);
      setCheckoutPhone(formatStoredPhoneForInput(data.customer.phoneNumber));
      setLoginPassword("");
      showToast("Welcome back!");
      resumeCheckoutIfPending();
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
    setAccountView("login");
    setPendingCheckoutAfterAuth(false);
    showToast("Signed out successfully. You can now sign in to another account.");
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
      setLoginPhone(resetPhone);
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
    showToast("Enter the authorized manager phone number.", "error");
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
      showToast("Reset code sent to the authorized manager phone.");
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
      showToast("Admin password updated. Sign in with your new password.");
    } else {
      showToast(data.error || "Unable to reset admin password.", "error");
    }
  } catch (error) {
    console.error("Admin reset failed:", error);
    showToast("Unable to reset admin password right now.", "error");
  } finally {
    setIsAdminResetPending(false);
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

const handleUpdateOrderStatus = (
  orderId: number,
  orderStatus: "processing" | "shipped" | "delivered" | "cancelled"
) => {
  startTransition(async () => {
    const result = await updateOrderStatus(orderId, orderStatus);

    if (result.success) {
      showToast(`Order #${orderId} updated to ${getOrderStatusLabel(orderStatus)}.`);
      await loadAdminOrders();
    } else {
      showToast(result.error || "Unable to update order status.", "error");
    }
  });
};

useEffect(() => {
  loadAppSessions();
}, []);

useEffect(() => {
  if (activeTab === "account" && customerProfile?.id) {
    loadCustomerOrders();
    loadCustomerMessages();
  }
}, [activeTab, customerProfile?.id]);

useEffect(() => {
  if (activeTab === "admin" && isAdminAuthenticated) {
    loadAdminOrders();
    loadAdminInboxThreads();
  }
}, [activeTab, isAdminAuthenticated]);

useEffect(() => {
  if (activeTab !== "admin") {
    setAdminPanelView("content");
  }
}, [activeTab]);

const handleSessionIdleLock = useCallback(async () => {
  if (customerProfile) {
    try {
      await fetch("/api/customer/logout", { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Customer idle lock logout failed:", error);
    }

    clearCustomerState();
    showToast(
      "Your session ended after inactivity. Please sign in again.",
      "error"
    );
    setAccountView("login");
    setActiveTab("account");
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (isAdminAuthenticated) {
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    } catch (error) {
      console.error("Admin idle lock logout failed:", error);
    }

    clearAdminState();
    showToast(
      "Your session ended after inactivity. Please sign in again.",
      "error"
    );
    setActiveTab("account");
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}, [customerProfile, isAdminAuthenticated]);

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
  enabled: Boolean(customerProfile || isAdminAuthenticated),
  onIdle: handleSessionIdleLock,
  onActivity: pingSession,
  timeoutMs: SESSION_IDLE_TIMEOUT_MS,
});

  const handleAdminLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  if (customerProfile) {
    showToast("Please sign out of your fan account before signing in to admin.", "error");
    return;
  }

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
  clearCustomerState();
  setIsAdminAuthenticated(true);
  setAdminPassword("");

  await loadAdminOrders();

  setActiveTab("admin");
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Successfully authenticated as Admin Manager.");
}
    else {
      showToast(result.error || "Incorrect password.", "error");
    }
  } catch (error) {
    console.error("Admin login failed:", error);
    showToast("Unable to connect to the authentication server.", "error");
  }
};

  // Admin Add Player
  const handleAdminAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPlayerName || !adminPlayerJersey) {
      showToast("Player name and jersey number are required", "error");
      return;
    }

    startTransition(async () => {
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

      if (res.success) {
        showToast("Player added directly to PostgreSQL database!");
        setAdminPlayerName("");
        setAdminPlayerJersey("");
        setAdminPlayerBio("");
        setAdminPlayerApps("0");
        setAdminPlayerGoals("0");
        setAdminPlayerAssists("0");
        setAdminPlayerFile(null);
      } else {
        showToast(res.error || "Error adding player", "error");
      }
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Error uploading player photo", "error");
      }
    });
  };

  // Admin Add Management Official
const handleAdminAddManagement = (e: React.FormEvent) => {
  e.preventDefault();

  if (!adminManagementName || !adminManagementPosition) {
    showToast("Name and position are required", "error");
    return;
  }

  startTransition(async () => {
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

      if (res.success) {
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
    }
  });
};

 // Admin Add Fixture
const handleAdminAddFixture = (e: React.FormEvent) => {
  e.preventDefault();

  if (!adminOpponent || !adminMatchDate) {
    showToast("Opponent name and date are required", "error");
    return;
  }

  const fixtureDate = combineFixtureDateTime(adminMatchDate, adminMatchTime);

  startTransition(async () => {
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
        homeScore:
          adminHomeScore !== "" ? parseInt(adminHomeScore) : undefined,
        awayScore:
          adminAwayScore !== "" ? parseInt(adminAwayScore) : undefined,
      });

      if (res.success) {
        showToast(
          "Fixture registered in system! The upcoming match has been updated."
        );

        setAdminOpponent("");
        setAdminMatchDate("");
        setAdminMatchTime("");
        setAdminHomeScore("");
        setAdminAwayScore("");
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
    }
  });
};


// Admin Update Fixture / Match Result
const handleAdminUpdateFixture = (e: React.FormEvent) => {
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

  startTransition(async () => {
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
        homeScore:
          adminHomeScore !== "" ? parseInt(adminHomeScore) : undefined,
        awayScore:
          adminAwayScore !== "" ? parseInt(adminAwayScore) : undefined,
      });

      if (res.success) {
        showToast("Match result updated successfully!");

        setEditingFixtureId(null);
        setAdminOpponent("");
        setAdminMatchDate("");
        setAdminMatchTime("");
        setAdminHomeScore("");
        setAdminAwayScore("");
        setAdminStatus("upcoming");
        setAdminMatchType("league");
        setAdminIsHome(true);
        setAdminVenue(HOME_GROUND.fullAddress);
        setAdminOpponentLogoFile(null);
        setAdminOpponentLogoUrl("");
      } else {
        showToast(
          res.error || "Error updating fixture",
          "error"
        );
      }
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Error updating fixture",
        "error"
      );
    }
  });
};
// Load an existing fixture into the admin form for editing
const handleEditFixture = (
  fixture: (typeof initialData.fixtures)[number]
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

  showToast(`Editing match vs ${fixture.opponent}. Open the Admin tab to update the logo or details.`);
  setActiveTab("admin");
  window.scrollTo({ top: 0, behavior: "smooth" });
};
  // Admin Add News
  const handleAdminAddNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNewsTitle || !adminNewsSummary || !adminNewsContent) {
      showToast("All news fields are required", "error");
      return;
    }

    startTransition(async () => {
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

      if (res.success) {
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
      }
    });
  };

  // Admin Add Gallery
  const handleAdminAddGallery = (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminGalleryFile) {
      showToast("Please choose a photo first.", "error");
      return;
    }

    if (!adminGalleryCaption.trim()) {
      showToast("Please enter a caption.", "error");
      return;
    }

    startTransition(async () => {
      try {
        const imageUrl = await uploadSelectedImage(adminGalleryFile, "gallery");
        const res = await addGalleryImage({
          imageUrl,
          caption: adminGalleryCaption.trim(),
          category: adminGalleryCategory,
        });

        if (res.success) {
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
      }
    });
  };

  const handleAdminEditManagement = (
  member: ManagementMember
) => {
  setEditingManagementId(member.id);

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

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
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

const handleAdminDeleteManagement = (managementId: number) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this management official?"
  );

  if (!confirmed) {
    return;
  }

  startTransition(async () => {
    try {
      const res = await deleteManagement(managementId);

      if (res.success) {
        showToast("Management official deleted successfully!");

        if (editingManagementId === managementId) {
          handleCancelManagementEdit();
        }
      } else {
        showToast(
          res.error || "Error deleting management official",
          "error"
        );
      }
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Error deleting management official",
        "error"
      );
    }
  });
};

const handleUpdateManagementRole = (
  managementId: number,
  category: string,
  position: string
) => {
  setUpdatingManagementRoleId(managementId);
  startTransition(async () => {
    try {
      const res = await updateManagementRole(managementId, { category, position });
      if (res.success) {
        showToast(res.message || "Management role updated.");
      } else {
        showToast(res.error || "Failed to update role.", "error");
      }
    } finally {
      setUpdatingManagementRoleId(null);
    }
  });
};

const handleAdminUpdateManagement = (e: React.FormEvent) => {
  e.preventDefault();

  if (!editingManagementId) {
    showToast("No management official selected", "error");
    return;
  }

  if (!adminManagementName || !adminManagementPosition) {
    showToast("Name and position are required", "error");
    return;
  }

  startTransition(async () => {
    try {
      const imageUrl = adminManagementFile
        ? await uploadSelectedImage(adminManagementFile, "management")
        : undefined;

      const currentMember = initialData.management.find(
        (member) => member.id === editingManagementId
      );

      const res = await updateManagement(
        editingManagementId,
        {
          name: adminManagementName,
          position: adminManagementPosition,
          category: adminManagementCategory,
          bio: adminManagementBio,
          responsibilities: adminManagementResponsibilities,
          displayOrder: parseInt(adminManagementOrder) || 0,
          imageUrl:
            imageUrl ||
            currentMember?.imageUrl ||
            "",
        }
      );

      if (res.success) {
        showToast("Management official updated successfully!");

        setEditingManagementId(null);
        setAdminManagementName("");
        setAdminManagementPosition("Chairman");
        setAdminManagementCategory("Club Leadership");
        setAdminManagementBio("");
        setAdminManagementResponsibilities("");
        setAdminManagementOrder("0");
        setAdminManagementFile(null);

        setActiveTab("management");

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } else {
        showToast(
          res.error || "Error updating management official",
          "error"
        );
      }
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Error updating management official",
        "error"
      );
    }
  });
};
  // ========== DELETE HANDLERS ==========
  const handleDeletePlayer = (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the squad?`)) return;
    startTransition(async () => {
      const res = await deletePlayer(id);
      if (res.success) showToast(res.message || "Player deleted.");
      else showToast(res.error || "Failed to delete.", "error");
    });
  };

  const handleUpdatePlayerPosition = (playerId: number, position: string) => {
    setUpdatingPlayerPositionId(playerId);
    startTransition(async () => {
      try {
        const res = await updatePlayerPosition(playerId, position);
        if (res.success) {
          showToast(res.message || "Player position updated.");
        } else {
          showToast(res.error || "Failed to update position.", "error");
        }
      } finally {
        setUpdatingPlayerPositionId(null);
      }
    });
  };

  const openSquadPlayerShop = () => {
    setActiveTab("shop");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteFixture = (id: number, opponent: string) => {
    if (!confirm(`Remove the fixture against "${opponent}"?`)) return;
    startTransition(async () => {
      const res = await deleteFixture(id);
      if (res.success) showToast(res.message || "Fixture deleted.");
      else showToast(res.error || "Failed to delete.", "error");
    });
  };

  const handleDeleteNews = (id: number, title: string) => {
    if (!confirm(`Delete the news article "${title}"?`)) return;
    startTransition(async () => {
      const res = await deleteNews(id);
      if (res.success) showToast(res.message || "News deleted.");
      else showToast(res.error || "Failed to delete.", "error");
    });
  };

  const handleDeleteGallery = (id: number) => {
    if (!confirm("Remove this photo from the gallery?")) return;
    startTransition(async () => {
      const res = await deleteGalleryImage(id);
      if (res.success) showToast(res.message || "Photo deleted.");
      else showToast(res.error || "Failed to delete.", "error");
    });
  };

  // ========== IMAGE REPLACE HANDLERS ==========
  const openReplaceImage = (id: number, type: "player" | "gallery" | "news" | "merch", currentUrl: string, currentCaption?: string) => {
    setReplaceImageId(id);
    setReplaceImageType(type);
    setReplaceImageFile(null);
    setReplaceImageNewCaption(currentCaption || "");
  };

  const handleReplaceImage = () => {
    if (!replaceImageFile || replaceImageId === null) {
      showToast("Please choose a new photo first.", "error");
      return;
    }

    startTransition(async () => {
      try {
        const folder = replaceImageType === "player"
          ? "players"
          : replaceImageType === "gallery"
          ? "gallery"
          : replaceImageType === "news"
          ? "news"
          : "merch";
        const imageUrl = await uploadSelectedImage(replaceImageFile, folder);
        let res;

        if (replaceImageType === "player") {
          res = await updatePlayerImage(replaceImageId, imageUrl);
        } else if (replaceImageType === "gallery") {
          res = await updateGalleryImage(replaceImageId, imageUrl, replaceImageNewCaption);
        } else if (replaceImageType === "merch") {
          res = await updateMerchandiseImage(replaceImageId, imageUrl);
        } else {
          res = await updateNewsImage(replaceImageId, imageUrl);
        }

        if (res?.success) {
          showToast(res.message || "Image replaced successfully!");
          setReplaceImageId(null);
          setReplaceImageFile(null);
          setReplaceImageNewCaption("");
        } else {
          showToast(res?.error || "Failed to replace image.", "error");
        }
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Image replacement failed", "error");
      }
    });
  };

  // ========== MERCHANDISE HANDLERS ==========
  const handleAddMerchandise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminMerchName || !adminMerchPrice) {
      showToast("Name and price are required", "error");
      return;
    }

    startTransition(async () => {
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
        });

      if (res.success) {
        showToast(res.message || "Merchandise added to shop!");
        setAdminMerchName("");
        setAdminMerchDesc("");
        setAdminMerchPrice("");
        setAdminMerchFile(null);
      } else {
        showToast(res.error || "Failed to add item.", "error");
      }
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Error uploading product photo", "error");
      }
    });
  };

  const handleDeleteMerchandise = (id: number, name: string) => {
    if (!confirm(`Remove "${name}" from the shop?`)) return;
    startTransition(async () => {
      const res = await deleteMerchandise(id);
      if (res.success) showToast(res.message || "Item removed.");
      else showToast(res.error || "Failed to delete.", "error");
    });
  };

  // Product photo display — shows real photo or a styled fallback
  const renderProductPhoto = (item: MerchandiseItem) => {
    // If imageUrl is a real path (starts with /), show the image
    if (item.imageUrl.startsWith("/") || item.imageUrl.startsWith("http")) {
      return (
        <div className="h-72 relative bg-slate-100 overflow-hidden group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-4">
            <span className="text-yellow-400 text-sm font-black">Ksh {item.price.toLocaleString()}</span>
          </div>
        </div>
      );
    }

    // Fallback CSS product card for items without real photos
    const kitColors: Record<string, { bg: string; border: string; accent: string; label: string }> = {
      home: { bg: "bg-slate-900", border: "border-yellow-500", accent: "text-yellow-500", label: "RESILIENCE BLACK" },
      "away-green": { bg: "bg-emerald-600", border: "border-white", accent: "text-white", label: "HOPE GREEN" },
      "away-white": { bg: "bg-white", border: "border-emerald-500", accent: "text-emerald-600", label: "PURE WHITE" },
      scarf: { bg: "bg-gradient-to-r from-slate-950 via-emerald-600 to-slate-950", border: "border-yellow-500", accent: "text-white", label: "SUPPORTER SCARF" },
      accessory: { bg: "bg-amber-500", border: "border-slate-950", accent: "text-slate-950", label: "ACCESSORY" },
    };

    const colors = kitColors[item.kitType] || kitColors.accessory;

    return (
      <div className={`h-72 ${colors.bg} ${colors.border} border-2 flex flex-col items-center justify-center relative`}>
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

  const categoryGallery =
    selectedGalleryCategory === "All"
      ? initialData.gallery
      : initialData.gallery.filter(
          (item) => item.category === selectedGalleryCategory
        );

  const filteredGallery = categoryGallery.filter(
    (item) => isAdminAuthenticated || isUploadedMediaUrl(item.imageUrl)
  );
    useEffect(() => {
  if (!selectedGalleryImage) return;

  const handleKeyDown = (event: KeyboardEvent) => {
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
}, [selectedGalleryImage, filteredGallery]);

  const goToTab = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAccountTab = (preferRegister = false) => {
    if (!customerProfile) {
      setAccountView(preferRegister ? "register" : "login");
    }
    goToTab("account");
  };

  const resumeCheckoutIfPending = () => {
    if (pendingCheckoutAfterAuth && cart.length > 0) {
      setPendingCheckoutAfterAuth(false);
      setIsCartOpen(true);
      showToast("Your account is ready. Complete payment in your cart.");
    }
  };

  const redirectToCheckoutAuth = (preferRegister: boolean) => {
    setPendingCheckoutAfterAuth(true);
    setIsCartOpen(false);
    openAccountTab(preferRegister);
    showToast(
      preferRegister
        ? "Create a free account to complete your purchase."
        : "Sign in to complete your purchase."
    );
  };

  const desktopNavLinkClass = (isActive: boolean) =>
    `relative px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
      isActive
        ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  const desktopNavTriggerClass = (isActive: boolean) =>
    `${desktopNavLinkClass(isActive)} flex items-center gap-1`;

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


      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]">

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
              className="flex items-center gap-3 sm:gap-4 min-w-0 cursor-pointer group shrink-0"
            >
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/logo.png"
                  alt="Kariobangi Legends FC badge"
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
            <nav className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-slate-50/80 border border-slate-200/70">

              <button
                type="button"
                onClick={() => goToTab("home")}
                className={desktopNavLinkClass(activeTab === "home")}
              >
                Home
              </button>

              <div className="relative group">
                <button
                  type="button"
                  className={desktopNavTriggerClass(["history", "management"].includes(activeTab))}
                >
                  Club
                  <ChevronDown className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180" />
                </button>

                <div className="absolute left-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
                  <div className="w-64 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-950/10 p-2">
                    <button
                      type="button"
                      onClick={() => goToTab("history")}
                      className="w-full text-left px-3 py-3 rounded-xl hover:bg-emerald-50 transition-all group/item flex items-start gap-3"
                    >
                      <span className="w-9 h-9 rounded-lg bg-slate-100 group-hover/item:bg-emerald-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-slate-600 group-hover/item:text-emerald-700" />
                      </span>
                      <span>
                        <span className="block text-xs font-bold text-slate-900 group-hover/item:text-emerald-800">
                          Our Story
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          Club history and journey
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => goToTab("management")}
                      className="w-full text-left px-3 py-3 rounded-xl hover:bg-emerald-50 transition-all group/item flex items-start gap-3"
                    >
                      <span className="w-9 h-9 rounded-lg bg-slate-100 group-hover/item:bg-emerald-100 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-slate-600 group-hover/item:text-emerald-700" />
                      </span>
                      <span>
                        <span className="block text-xs font-bold text-slate-900 group-hover/item:text-emerald-800">
                          Management
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          Leadership and technical team
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => goToTab("squad")}
                className={desktopNavLinkClass(activeTab === "squad")}
              >
                Squad
              </button>

              <div className="relative group">
                <button
                  type="button"
                  className={desktopNavTriggerClass(activeTab === "fixtures")}
                >
                  Matches
                  <ChevronDown className="w-3 h-3 transition-transform duration-300 group-hover:rotate-180" />
                </button>

                <div className="absolute left-0 top-full pt-2 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
                  <div className="w-64 bg-white/95 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-2xl shadow-slate-950/10 p-2">
                    <button
                      type="button"
                      onClick={() => goToTab("fixtures")}
                      className="w-full text-left px-3 py-3 rounded-xl hover:bg-emerald-50 transition-all group/item flex items-start gap-3"
                    >
                      <span className="w-9 h-9 rounded-lg bg-slate-100 group-hover/item:bg-emerald-100 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-4 h-4 text-slate-600 group-hover/item:text-emerald-700" />
                      </span>
                      <span>
                        <span className="block text-xs font-bold text-slate-900 group-hover/item:text-emerald-800">
                          Fixtures & Results
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          Upcoming and completed matches
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => goToTab("news")}
                className={desktopNavLinkClass(activeTab === "news")}
              >
                News
              </button>

              <button
                type="button"
                onClick={() => goToTab("gallery")}
                className={desktopNavLinkClass(activeTab === "gallery")}
              >
                Gallery
              </button>

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
                onClick={() => openAccountTab()}
                className={`flex items-center gap-2 border font-bold text-[10px] uppercase tracking-wider px-2.5 sm:px-3.5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 ${
                  activeTab === "account"
                    ? "border-emerald-300 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : customerProfile
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
                title={customerProfile ? "View your orders" : "Sign in to your account"}
              >
                <User className="w-4 h-4 shrink-0" />
                <span className="max-[380px]:sr-only">
                  {customerProfile ? "My Orders" : "Sign In"}
                </span>
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

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 px-1">
                      Main
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: "home", label: "Home", icon: Home },
                        { id: "account", label: customerProfile ? "My Orders" : "Sign In", icon: User },
                        { id: "news", label: "Club News", icon: Newspaper },
                        { id: "shop", label: "Merchandise Shop", icon: ShoppingBag },
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

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 px-1">
                      Club
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: "history", label: "Our Story", icon: BookOpen },
                        { id: "management", label: "Management", icon: Shield },
                        { id: "squad", label: "Squad", icon: Users },
                        { id: "fixtures", label: "Matches", icon: CalendarDays },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            type="button"
                            key={tab.id}
                            onClick={() => goToTab(tab.id)}
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

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 px-1">
                      Media
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: "gallery", label: "Photo Gallery", icon: Images },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            type="button"
                            key={tab.id}
                            onClick={() => goToTab(tab.id)}
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

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 px-1">
                      Fan Zone
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { id: "fanzone", label: "Supporter Board", icon: MessageCircle },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            type="button"
                            key={tab.id}
                            onClick={() => goToTab(tab.id)}
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

{/* Main body wrapper */}
<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full min-w-0">
        
        {/* ================= TAB: HOME ================= */}
        {activeTab === "home" && (
          <div className="space-y-12">
         {/* ================= HERO BANNER ================= */}
<div className="relative min-h-[500px] sm:min-h-[580px] rounded-3xl overflow-hidden bg-slate-950 text-white border border-slate-800 shadow-2xl">

  {/* Hero background image */}
  <div
    className="absolute inset-0 bg-cover bg-[center_40%] brightness-105"
    style={{ backgroundImage: "url('/assets/hero-team.jpg')" }}
  />

  {/* Overlays — darken only the left where text sits; keep the team photo clear on the right */}
  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/65 via-slate-950/20 to-transparent" />
  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />

  {/* Hero content */}
  <div className="relative z-10 min-h-[500px] sm:min-h-[580px] flex items-center">

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
            onClick={() => setActiveTab("players")}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logo.png"
                alt="Kariobangi Legends FC"
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
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={upcomingFixtures[0].opponentLogoUrl}
                  alt={`${upcomingFixtures[0].opponent} logo`}
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
                Date
              </p>
              <p className="text-sm font-bold text-white">
                {formatKickoff(upcomingFixtures[0].date)}
              </p>
            </div>
          </div>

          {/* Venue */}
          <div className="flex items-center justify-center gap-3 px-5 py-5">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-widest font-black text-slate-500">
                Venue
              </p>
              <p className="text-sm font-bold text-white truncate max-w-[180px]">
                {upcomingFixtures[0].venue}
              </p>
              {isClubHomeVenue(upcomingFixtures[0].venue) && (
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                  {HOME_GROUND.landmark}, {HOME_GROUND.constituency}
                </p>
              )}
            </div>
          </div>

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
                {getMatchStatusMeta(upcomingFixtures[0].status).label}
              </p>
            </div>
          </div>

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
        <span className="w-2 h-2 rounded-full bg-yellow-400" />

        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
          Club Media
        </span>
      </div>

      <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2">
        <Camera className="w-6 h-6 text-emerald-600" />
        Life at Kariobangi Legends
      </h3>

      <p className="text-sm text-slate-500 mt-2">
        Moments, memories and stories from our football community.
      </p>
    </div>

    <button
      onClick={() => setActiveTab("gallery")}
      className="hidden sm:flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
    >
      View All Photos
      <ArrowRight className="w-4 h-4" />
    </button>

  </div>


  {/* ================= AUTO CAROUSEL ================= */}
  {carouselGallery.length > 0 ? (

    <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-xl shadow-slate-950/10 bg-white">

      {/* Image — container shrinks to photo, no crop or distortion */}
      <div className="relative w-full flex justify-center bg-white">

        {carouselGallery.map((item, index) => (

          <div
            key={item.id}
            className={`transition-opacity duration-700 ease-out ${
              index === safeGalleryCarouselIndex
                ? "opacity-100 relative z-10"
                : "opacity-0 absolute inset-x-0 top-0 flex justify-center pointer-events-none z-0"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.caption || "Kariobangi Legends FC"}
              className="block max-w-full w-auto h-auto max-h-[min(70vh,560px)] object-contain"
              draggable={false}
            />
          </div>

        ))}

      </div>


      {/* Caption bar */}
      <div className="relative border-t border-slate-100 bg-slate-50 px-5 sm:px-8 py-4 sm:py-5">

        {carouselGallery.map((item, index) => (

          <div
            key={`caption-${item.id}`}
            className={`transition-all duration-500 ${
              index === safeGalleryCarouselIndex
                ? "opacity-100 relative z-10 translate-y-0"
                : "opacity-0 absolute inset-0 px-5 sm:px-8 py-4 sm:py-5 pointer-events-none translate-y-1"
            }`}
          >

            <div className="flex flex-wrap items-center gap-2 mb-2">

              {item.category && (
                <span className="inline-flex items-center bg-emerald-600 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                  {item.category}
                </span>
              )}

              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>

            </div>

            <p className="text-base sm:text-xl font-black text-slate-950 leading-snug max-w-3xl">
              {item.caption || "Kariobangi Legends FC"}
            </p>

          </div>

        ))}

      </div>

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
    {initialData.news.length > 0 ? (

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {initialData.news.slice(0, 2).map((item, index) => (

          <article
            key={item.id}
            className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
          >

            {/* News image */}
            <div className="h-56 relative bg-slate-100 overflow-hidden">

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />

              {/* Dark image overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-70" />

              {/* Category */}
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-slate-950/90 text-yellow-400 text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-full backdrop-blur-sm">
                <Activity className="w-3 h-3" />
                Official Update
              </span>

              {/* News number */}
              <span className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white/90 text-slate-950 flex items-center justify-center text-xs font-black shadow-lg">
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


              <div className="mt-auto pt-5">

                <button
                  onClick={() => {
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

          {initialData.fanMessages.length > 0 ? (

            initialData.fanMessages.slice(0, 3).map((msg) => (

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
      <div className="bg-white flex flex-col">

        <div className="flex items-center justify-center p-4 sm:p-6 min-h-[420px] lg:min-h-[520px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/founder-atanga.jpg"
            alt="Mr. Erick Otieno Atanga - Founder and Patron of Kariobangi Legends FC"
            className="max-w-full max-h-[520px] w-auto h-auto object-contain"
          />
        </div>

        {/* Founder label */}
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-white">
          <span className="inline-flex items-center bg-yellow-400 text-slate-950 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
            Founder & Patron
          </span>

          <h3 className="text-xl font-black text-slate-950">
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
              {isAdminAuthenticated && (
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
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.imageUrl}
                          alt={item.caption}
                          className="max-w-full max-h-72 w-auto h-auto object-contain group-hover:scale-[1.02] transition-transform duration-500 ease-out"
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
                      {isAdminAuthenticated && (
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
                {isAdminAuthenticated && (
                  <p className="text-xs text-slate-400 mt-1">Go to the Admin Panel to post pictures of this event.</p>
                )}
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedGalleryImage.imageUrl}
                    alt={selectedGalleryImage.caption}
                    className="max-w-full max-h-[calc(90vh-8rem)] object-contain rounded-lg animate-in zoom-in-95 duration-300"
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

    {managementGrouped.map((section) => (
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
            <div key={roleGroup.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center min-w-9 h-8 px-2 rounded-lg bg-emerald-50 text-emerald-700 text-[9px] font-black tracking-wider border border-emerald-100">
                  {roleGroup.badge}
                </span>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {roleGroup.heading}
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {roleGroup.members.map((member) => (
                  <ManagementMemberCard
                    key={member.id}
                    member={member}
                    featured={isFeaturedManagementRole(member.position)}
                    isAdminAuthenticated={isAdminAuthenticated}
                    isUpdatingRole={updatingManagementRoleId === member.id}
                    onEdit={handleAdminEditManagement}
                    onDelete={handleAdminDeleteManagement}
                    onRoleChange={handleUpdateManagementRole}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {section.otherMembers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center min-w-9 h-8 px-2 rounded-lg bg-slate-100 text-slate-600 text-[9px] font-black">
                ?
              </span>
              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Other Roles
              </h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {section.otherMembers.map((member) => (
                <ManagementMemberCard
                  key={member.id}
                  member={member}
                  isAdminAuthenticated={isAdminAuthenticated}
                  isUpdatingRole={updatingManagementRoleId === member.id}
                  onEdit={handleAdminEditManagement}
                  onDelete={handleAdminDeleteManagement}
                  onRoleChange={handleUpdateManagementRole}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    ))}

    {initialData.management.length === 0 && (
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

            {initialData.players.length > 0 ? (
            <div className="space-y-10">
              {SQUAD_POSITION_GROUPS.map((group) => {
                const groupPlayers = squadByPosition.get(group.id) ?? [];
                if (groupPlayers.length === 0) return null;

                return (
                  <section key={group.id} className="space-y-4">
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

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {groupPlayers.map((player) => (
                        <SquadPlayerCard
                          key={player.id}
                          player={player}
                          isAdminAuthenticated={isAdminAuthenticated}
                          isUpdatingPosition={updatingPlayerPositionId === player.id}
                          onReplaceImage={(id, imageUrl) =>
                            openReplaceImage(id, "player", imageUrl)
                          }
                          onDelete={handleDeletePlayer}
                          onPositionChange={handleUpdatePlayerPosition}
                          onShopClick={openSquadPlayerShop}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}

              {(squadByPosition.get("other") ?? []).length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                    <span className="inline-flex items-center justify-center min-w-10 h-10 px-2 rounded-xl bg-slate-200 text-slate-700 text-[10px] font-black">
                      ?
                    </span>
                    <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">
                      Other Roles
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {(squadByPosition.get("other") ?? []).map((player) => (
                      <SquadPlayerCard
                        key={player.id}
                        player={player}
                        isAdminAuthenticated={isAdminAuthenticated}
                        isUpdatingPosition={updatingPlayerPositionId === player.id}
                        onReplaceImage={(id, imageUrl) =>
                          openReplaceImage(id, "player", imageUrl)
                        }
                        onDelete={handleDeletePlayer}
                        onPositionChange={handleUpdatePlayerPosition}
                        onShopClick={openSquadPlayerShop}
                      />
                    ))}
                  </div>
                </section>
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
              <section className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl">
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
                    <MatchStatusPill status={fixtureGroups.nextMatch.status} />
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
                      isAdminAuthenticated={isAdminAuthenticated}
                      onEdit={handleEditFixture}
                      onDelete={handleDeleteFixture}
                    />
                  ))}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="space-y-4">
                <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Upcoming Fixtures
                </h3>
                {fixtureGroups.upcomingRest.length > 0 ? (
                  <div className="space-y-3">
                    {fixtureGroups.upcomingRest.map((fixture) => (
                      <MatchFixtureCard
                        key={fixture.id}
                        fixture={fixture}
                        mode="upcoming"
                        isAdminAuthenticated={isAdminAuthenticated}
                        onEdit={handleEditFixture}
                        onDelete={handleDeleteFixture}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                    <p className="text-sm font-bold text-slate-700">
                      No further fixtures scheduled
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
                {recentFixtures.length > 0 ? (
                  <div className="space-y-3">
                    {recentFixtures.map((fixture) => (
                      <MatchFixtureCard
                        key={fixture.id}
                        fixture={fixture}
                        mode="result"
                        isAdminAuthenticated={isAdminAuthenticated}
                        onEdit={handleEditFixture}
                        onDelete={handleDeleteFixture}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                    <p className="text-sm font-bold text-slate-700">No results yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Completed matches and full-time scores will show here.
                    </p>
                  </div>
                )}
              </section>
            </div>

            {initialData.fixtures.length === 0 && (
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
              {initialData.news.map((item, idx) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 ${
                    idx % 2 === 1 ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  <div className="lg:col-span-5 relative h-64 lg:h-full min-h-[220px] rounded-2xl overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-contain"
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

                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">Authorized: Mr. Erick Otieno Atanga (Patron)</span>
                      <div className="flex items-center gap-2">
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
                    </div>
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
                      : "Sign in to see all your orders, or track one purchase with your order number and M-PESA phone."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAccountTab()}
                  className="shrink-0 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  {customerProfile ? "My Orders" : "Sign In / Register"}
                </button>
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

            {/* Shop banner */}
            <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-yellow-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5">
                <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider">
                  Support the Slums, Wear the Brand
                </p>
                <h3 className="text-xl sm:text-2xl font-black">
                  Resilience Black & Hope Green Kits Available Now!
                </h3>
                <p className="text-xs text-slate-300">
                  Shipped within Nairobi County or pickup at Kariobangi North Ground. International shipping available.
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl text-center">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">
                  Kit Price
                </span>
                <span className="text-yellow-400 text-xl font-black block">Ksh 1,800</span>
                <span className="text-slate-400 text-[9px] block">approx. $14 USD</span>
              </div>
            </div>

            {/* Items Grid — Real Product Photos with Admin Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {initialData.merchandise.map((item) => {
                const sizesArray = item.sizes.split(",").map((s) => s.trim());
                

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    {/* Product Photo — real photo or styled fallback */}
                    <div className="relative">
                      {renderProductPhoto(item)}
                      {/* Admin controls overlay */}
                      <div className="absolute top-3 right-3 flex gap-1.5">
                        <button
                          onClick={() => openReplaceImage(item.id, "merch", item.imageUrl)}
                          className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg text-blue-600 hover:bg-white shadow cursor-pointer"
                          title="Replace product photo"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMerchandise(item.id, item.name)}
                          className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg text-rose-500 hover:bg-white shadow cursor-pointer"
                          title="Remove item from shop"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-extrabold text-slate-950 text-base leading-snug flex-1">
                            {item.name}
                          </h3>
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap">
                            Ksh {item.price.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                      </div>
<div className="space-y-1.5">
  <p className="text-[10px] text-slate-400 font-bold uppercase">
    Select Size
  </p>

  <div className="flex gap-2 flex-wrap">
    {sizesArray.map((size) => (
      <button
        key={size}
        onClick={() =>
          setSelectedSizes((prev) => ({
            ...prev,
            [item.id]: size,
          }))
        }
        className={`px-2.5 py-1 text-[11px] rounded-lg font-bold transition cursor-pointer ${
          (selectedSizes[item.id] || sizesArray[0]) === size
            ? "bg-slate-950 text-yellow-400"
            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
        }`}
      >
        {size}
      </button>
    ))}
                        </div>
                      </div>

                      <button
  onClick={() => addToCart(item, selectedSizes[item.id] || sizesArray[0])}
  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
>
  <ShoppingBag className="w-4 h-4" /> Add to Cart · M-Pesa Ready
</button>
                    </div>
                  </div>
                );
              })}
            </div>
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
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-950">Make a donation</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Choose your currency, complete payment, then submit your details so we can
                    acknowledge your gift.
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

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider py-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    {isPending ? "Submitting..." : "Submit Donation"}
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
                    {initialData.donations.length > 0 ? (
                      initialData.donations.map((d) => (
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

                <form onSubmit={handleFanSubmit} className="space-y-3">
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
                  <MessageSquare className="w-5 h-5 text-emerald-600" /> Live Supporter Messages ({initialData.fanMessages.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {initialData.fanMessages.map((msg) => (
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
                        Fan & Club <span className="text-yellow-400">Admin</span> Sign In
                      </>
                    )}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {customerProfile
                      ? "Track your orders, message the club admin, and read replies here in your account."
                      : pendingCheckoutAfterAuth
                        ? "Create a free fan account or sign in to pay for the items in your cart. Club officials can sign in on the right."
                        : "Fans register to shop official kits, pay with M-Pesa, and track orders. Club officials sign in on the right to manage content and orders."}
                  </p>
                </div>
              </div>
            </div>

            {customerProfile ? (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Signed in as
                      </p>
                      <p className="text-xl font-black text-slate-950">{customerProfile.fullName}</p>
                      <p className="text-sm text-slate-600">
                        {formatPhoneDisplay(formatStoredPhoneForInput(customerProfile.phoneNumber))}
                        {customerProfile.email && (
                          <> • {customerProfile.email}</>
                        )}
                      </p>
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
              <div className="space-y-6">
                {pendingCheckoutAfterAuth && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <strong>Checkout waiting:</strong> create an account or sign in to pay for the items in your cart.
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                  <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
                  <div className="space-y-1 pb-1 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
                      <User className="w-5 h-5 text-emerald-600" />
                      Fan Account
                    </h3>
                    <p className="text-sm text-slate-600">
                      Register to shop official kits, pay with M-Pesa, and track orders.
                    </p>
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
                    <form onSubmit={handleCustomerLogin} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          M-PESA Phone
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. 0712345678"
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value)}
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
                    <form onSubmit={handleCustomerRegister} className="space-y-4">
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
                    className="w-full text-[10px] font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-800 cursor-pointer pt-1"
                  >
                    {showFanPasswordReset ? "Hide password reset" : "Forgot your password?"}
                  </button>
                </div>

                {showFanPasswordReset && (
                  <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6 sm:p-8 space-y-5">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        Reset Fan Password
                      </h3>
                      <p className="text-sm text-slate-600">
                        Enter your M-PESA phone number to receive a 6-digit SMS code.
                      </p>
                    </div>

                    {resetStep === "request" ? (
                      <form onSubmit={handleCustomerRequestReset} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            M-PESA Phone
                          </label>
                          <input
                            type="tel"
                            placeholder="e.g. 0712345678"
                            value={resetPhone}
                            onChange={(e) => setResetPhone(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            type="submit"
                            disabled={isFanResetPending}
                            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
                          >
                            {isFanResetPending ? "Sending..." : "Send Reset Code"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form onSubmit={handleCustomerCompleteReset} className="space-y-4">
                        <p className="text-xs text-slate-500">
                          Check SMS on {resetPhone || "your phone"} and choose a new password.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Reset Code
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="6-digit code"
                              value={resetCode}
                              onChange={(e) => setResetCode(e.target.value)}
                              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              New Password
                            </label>
                            <PasswordInput
                              value={resetNewPassword}
                              onChange={setResetNewPassword}
                              placeholder="At least 6 characters"
                              required
                              minLength={6}
                              autoComplete="new-password"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Confirm Password
                            </label>
                            <PasswordInput
                              value={resetConfirmPassword}
                              onChange={setResetConfirmPassword}
                              placeholder="Confirm new password"
                              required
                              minLength={6}
                              autoComplete="new-password"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            disabled={isFanResetPending}
                            className="bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
                          >
                            {isFanResetPending ? "Updating..." : "Reset Password"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCustomerRequestReset()}
                            disabled={isFanResetPending}
                            className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-800 cursor-pointer px-2 py-3 disabled:opacity-50"
                          >
                            {isFanResetPending ? "Sending..." : "Resend Code"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
                      <Package className="w-5 h-5 text-emerald-600" />
                      Track Without Signing In
                    </h3>
                    <p className="text-sm text-slate-600">
                      Use your order number and the M-PESA phone used at checkout.
                    </p>
                  </div>

                  <form onSubmit={handleTrackOrder} className="space-y-4">
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
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      {isPending ? "Checking..." : "Track Order"}
                    </button>
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

                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
                      <div className="space-y-1 pb-1 border-b border-slate-100">
                        <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
                          <Settings className="w-5 h-5 text-yellow-600" />
                          Club Admin
                        </h3>
                        <p className="text-sm text-slate-600">
                          Officials sign in to manage squad, gallery, news, merchandise, and fan orders.
                        </p>
                      </div>

                      <form onSubmit={handleAdminLogin} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Manager Password
                          </label>
                          <PasswordInput
                            value={adminPassword}
                            onChange={setAdminPassword}
                            placeholder="Enter admin password"
                            required
                            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 pr-11"
                            autoComplete="current-password"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
                        >
                          Sign In as Admin
                        </button>
                      </form>

                      <button
                        type="button"
                        aria-expanded={showAdminPasswordReset}
                        onClick={() => {
                          setShowAdminPasswordReset((open) => {
                            if (open) setAdminResetStep("request");
                            return !open;
                          });
                        }}
                        className="w-full text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 cursor-pointer pt-1"
                      >
                        {showAdminPasswordReset ? "Hide admin password reset" : "Reset admin password"}
                      </button>
                    </div>

                    {showAdminPasswordReset && (
                      <div className="bg-white rounded-3xl border border-yellow-200 shadow-sm p-6 sm:p-8 space-y-5">
                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-yellow-600" />
                            Reset Manager Password
                          </h3>
                          <p className="text-sm text-slate-600">
                            Use an authorized manager phone number to receive a reset code by SMS.
                          </p>
                        </div>

                        {adminResetStep === "request" ? (
                          <form onSubmit={handleAdminRequestReset} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Authorized Manager Phone
                              </label>
                              <input
                                type="tel"
                                placeholder="e.g. 0712345678"
                                value={adminResetPhone}
                                onChange={(e) => setAdminResetPhone(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                                required
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                type="submit"
                                disabled={isAdminResetPending}
                                className="w-full md:w-auto bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
                              >
                                {isAdminResetPending ? "Sending..." : "Send Reset Code"}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <form onSubmit={handleAdminCompleteReset} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Reset Code
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="6-digit code"
                                  value={adminResetCode}
                                  onChange={(e) => setAdminResetCode(e.target.value)}
                                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                                  required
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  New Password
                                </label>
                                <PasswordInput
                                  value={adminResetNewPassword}
                                  onChange={setAdminResetNewPassword}
                                  placeholder="New password"
                                  required
                                  minLength={6}
                                  autoComplete="new-password"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Confirm Password
                                </label>
                                <PasswordInput
                                  value={adminResetConfirmPassword}
                                  onChange={setAdminResetConfirmPassword}
                                  placeholder="Confirm password"
                                  required
                                  minLength={6}
                                  autoComplete="new-password"
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              disabled={isAdminResetPending}
                              className="bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
                            >
                              {isAdminResetPending ? "Updating..." : "Reset Password"}
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
          <div className="space-y-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black text-slate-950 tracking-tight">Manager Administration Panel</h2>
            </div>

            {!isAdminAuthenticated ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 text-yellow-400 flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8" />
                </div>
                <h4 className="font-black text-slate-800 text-lg">
                  Admin Sign In Required
                </h4>
                <p className="text-sm text-slate-500 mt-2">
                  Club officials sign in from the Sign In page using the admin panel on the right.
                </p>
                <button
                  type="button"
                  onClick={() => goToTab("account")}
                  className="mt-6 bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer"
                >
                  Go to Admin Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Admin Status Header */}
                <div className="bg-emerald-600 text-white p-4 rounded-2xl flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 text-xs">
                  <span className="font-bold">✓ Authenticated as Kariobangi Legends Manager</span>
                  <button
  onClick={async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      clearAdminState();
      showToast("Admin signed out. You can now sign in to your fan account.");
    }
  }}
  className="bg-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-800 font-bold transition"
>
  Logout Admin
</button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPanelView("content");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                      adminPanelView === "content"
                        ? "bg-slate-950 text-yellow-400 shadow-md"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Content
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPanelView("inbox");
                      loadAdminInboxThreads();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                      adminPanelView === "inbox"
                        ? "bg-slate-950 text-yellow-400 shadow-md"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Fan Inbox
                    {adminInboxThreads.some((thread) => thread.unreadCount > 0) && (
                      <span className="min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                        {adminInboxThreads.reduce((sum, thread) => sum + thread.unreadCount, 0)}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPanelView("orders");
                      loadAdminOrders();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                      adminPanelView === "orders"
                        ? "bg-slate-950 text-yellow-400 shadow-md"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Orders
                    {adminOrderStats.totalOrders > 0 && (
                      <span className="min-w-5 h-5 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                        {adminOrderStats.totalOrders}
                      </span>
                    )}
                  </button>
                </div>

                {adminPanelView === "content" && (
                  <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Action 1: Add Player */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-950 flex items-center gap-1.5">
                      <UserPlus className="w-5 h-5 text-emerald-600" /> Add Player to Squad
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Add unlimited players. Upload from your device. Full photo shown with no cropping (max {MEDIA_UPLOAD_RULES.maxFileSizeLabel} each).
                    </p>
                    <form onSubmit={handleAdminAddPlayer} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Name</label>
                          <input
                            type="text"
                            placeholder="e.g. John 'Ocha' Alolo"
                            value={adminPlayerName}
                            onChange={(e) => setAdminPlayerName(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Jersey Number</label>
                          <input
                            type="number"
                            placeholder="e.g. 14"
                            value={adminPlayerJersey}
                            onChange={(e) => setAdminPlayerJersey(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500">Playing Position</label>
                        <select
                          value={adminPlayerPos}
                          onChange={(e) => setAdminPlayerPos(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                        >
                          {SQUAD_POSITION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-500">
                          Players appear under the same squad section as others in this role.
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Apps</label>
                          <input
                            type="number"
                            value={adminPlayerApps}
                            onChange={(e) => setAdminPlayerApps(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Goals</label>
                          <input
                            type="number"
                            value={adminPlayerGoals}
                            onChange={(e) => setAdminPlayerGoals(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Assists</label>
                          <input
                            type="number"
                            value={adminPlayerAssists}
                            onChange={(e) => setAdminPlayerAssists(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500">Player Photo (optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAdminPlayerFile(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-950 file:text-yellow-400 hover:file:bg-slate-800 cursor-pointer"
                        />
                        {adminPlayerFile && <p className="text-[10px] text-emerald-600 font-semibold">Selected: {adminPlayerFile.name}</p>}
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500">Biographical / Scout Notes</label>
                        <textarea
                          rows={2}
                          placeholder="Short description of the player's skills, community involvement, or background..."
                          value={adminPlayerBio}
                          onChange={(e) => setAdminPlayerBio(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-slate-950 text-yellow-400 font-bold py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer"
                      >
                        {isPending ? "Adding Player..." : "Insert Player into PostgreSQL"}
                      </button>
                    </form>

                    {squadPlayersSorted.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <h4 className="font-bold text-sm text-slate-950">
                          Update Player Positions
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Move players between squad sections. Changes appear on the public Squad page immediately.
                        </p>
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                          {squadPlayersSorted.map((player) => {
                            const positionInOptions = SQUAD_POSITION_OPTIONS.some(
                              (option) => option.value === player.position
                            );

                            return (
                              <div
                                key={player.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-900 text-xs truncate">
                                    #{player.jerseyNumber} {player.name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-semibold">
                                    Currently: {getSquadPositionBadge(player.position)}
                                    {!positionInOptions && ` · ${player.position}`}
                                  </p>
                                </div>
                                <select
                                  value={player.position}
                                  onChange={(e) =>
                                    handleUpdatePlayerPosition(player.id, e.target.value)
                                  }
                                  disabled={updatingPlayerPositionId === player.id}
                                  className="w-full sm:w-44 p-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 disabled:opacity-50"
                                >
                                  {!positionInOptions && (
                                    <option value={player.position}>
                                      {player.position} (assign)
                                    </option>
                                  )}
                                  {SQUAD_POSITION_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.groupHeading}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action 2: Add Fixture (Dynamically updates upcoming games) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-950 flex items-center gap-1.5">
                      <Calendar className="w-5 h-5 text-yellow-500" /> Log / Update Match Game
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Instantly updates the upcoming match banner on the Home page and the Match Center. Upload opponent logos directly from your device.
                    </p>
                    <form
  onSubmit={
    editingFixtureId
      ? handleAdminUpdateFixture
      : handleAdminAddFixture
  }
  className="space-y-3 text-xs"
>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Opponent Team</label>
                          <input
                            type="text"
                            placeholder="e.g. Ligi Ndogo SC"
                            value={adminOpponent}
                            onChange={(e) => setAdminOpponent(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Match Date</label>
                            <input
                              type="date"
                              value={adminMatchDate}
                              onChange={(e) => setAdminMatchDate(e.target.value)}
                              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-emerald-500"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Kick-off Time (optional)</label>
                            <input
                              type="time"
                              value={adminMatchTime}
                              onChange={(e) => setAdminMatchTime(e.target.value)}
                              className="w-full p-2.5 rounded-lg border border-slate-200 bg-white focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      {adminMatchDate && (
                        <p className="text-[10px] text-slate-500">
                          Scheduled for{" "}
                          <span className="font-bold text-slate-700">
                            {formatKickoff(combineFixtureDateTime(adminMatchDate, adminMatchTime))}
                            {adminMatchTime ? ` at ${adminMatchTime}` : ""}
                          </span>
                        </p>
                      )}

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500">
                          Opponent Team Logo (optional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setAdminOpponentLogoFile(e.target.files?.[0] || null)
                          }
                          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-950 file:text-yellow-400 hover:file:bg-slate-800 cursor-pointer"
                        />
                        <p className="text-[10px] text-slate-500">
                          Upload directly from your computer or phone gallery. No image link required.
                        </p>
                        {adminOpponentLogoFile && (
                          <p className="text-[10px] text-emerald-600 font-semibold">
                            Selected: {adminOpponentLogoFile.name}
                          </p>
                        )}
                        {(adminOpponentLogoUrl || adminOpponentLogoFile) && (
                          <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0">
                              {adminOpponentLogoFile ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={URL.createObjectURL(adminOpponentLogoFile)}
                                  alt="Opponent logo preview"
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={adminOpponentLogoUrl}
                                  alt="Current opponent logo"
                                  className="w-full h-full object-contain p-1"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                                Logo preview
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {adminOpponentLogoFile
                                  ? "New upload ready to save"
                                  : "Current saved logo"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setAdminOpponentLogoFile(null);
                                setAdminOpponentLogoUrl("");
                              }}
                              className="text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:text-rose-700 cursor-pointer px-2 py-1"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Venue</label>
                          <input
                            type="text"
                            value={adminVenue}
                            onChange={(e) => setAdminVenue(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Match Type</label>
                          <select
                            value={adminMatchType}
                            onChange={(e) => setAdminMatchType(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                          >
                            {MATCH_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-slate-500">
                            Only league matches count toward season stats.
                          </p>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Match Status</label>
                          <select
                            value={adminStatus}
                            onChange={(e) => setAdminStatus(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                          >
                            {MATCH_STATUSES.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label} ({status.badge})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Home/Away</label>
                          <select
                            value={adminIsHome ? "home" : "away"}
                            onChange={(e) => setAdminIsHome(e.target.value === "home")}
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                          >
                            <option value="home">Home (Legends host)</option>
                            <option value="away">Away Match</option>
                          </select>
                        </div>
                      </div>

                      {(adminStatus === "completed" || adminStatus === "live") && (
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded-lg">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Home Score</label>
                            <input
                              type="number"
                              value={adminHomeScore}
                              onChange={(e) => setAdminHomeScore(e.target.value)}
                              className="w-full p-2 rounded border border-slate-200 bg-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-bold text-slate-500">Away Score</label>
                            <input
                              type="number"
                              value={adminAwayScore}
                              onChange={(e) => setAdminAwayScore(e.target.value)}
                              className="w-full p-2 rounded border border-slate-200 bg-white"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-slate-950 text-yellow-400 font-bold py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer"
                      >
                       {isPending
  ? editingFixtureId
    ? "Updating Match..."
    : "Adding Fixture..."
  : editingFixtureId
    ? "Update Match Result"
    : "Save Match Fixture"}
                      </button>
                    </form>
                  </div>

                  {/* Action 3: Add Management Official */}
<div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">

  <h3 className="font-bold text-base text-slate-950 flex items-center gap-1.5">
    <UserPlus className="w-5 h-5 text-emerald-600" />
    {editingManagementId
      ? "Edit Club Management Official"
      : "Add Club Management Official"}
  </h3>

  <p className="text-[11px] text-slate-500">
    Add unlimited officials: Chairman, CEO, coaches, and more. Upload photos from your device; full image shown with no cropping (max {MEDIA_UPLOAD_RULES.maxFileSizeLabel} each).
  </p>

 <form
  onSubmit={
    editingManagementId
      ? handleAdminUpdateManagement
      : handleAdminAddManagement
  }
  className="space-y-3 text-xs"
>
  {/* ================= FULL NAME ================= */}
  <div className="space-y-1">
    <label className="font-bold text-slate-500">
      Full Name
    </label>

    <input
      type="text"
      placeholder="e.g. John Kamau"
      value={adminManagementName}
      onChange={(e) =>
        setAdminManagementName(e.target.value)
      }
      className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
      required
    />
  </div>


  {/* ================= MANAGEMENT SECTION ================= */}
  <div className="space-y-1">
    <label className="font-bold text-slate-500">
      Management Section
    </label>

    <select
      value={adminManagementCategory}
      onChange={(e) => {
        const category = e.target.value;
        setAdminManagementCategory(category);
        setAdminManagementPosition(getDefaultManagementPosition(category));
      }}
      className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
    >
      {MANAGEMENT_CATEGORIES.map((category) => (
        <option key={category.id} value={category.dbValue}>
          {category.heading}
        </option>
      ))}
    </select>
    <p className="text-[10px] text-slate-500">
      Officials are grouped on the public page by department and modern role type.
    </p>
  </div>


  {/* ================= POSITION ================= */}
  <div className="space-y-1">
    <label className="font-bold text-slate-500">
      Position
    </label>

    <select
      value={adminManagementPosition}
      onChange={(e) =>
        setAdminManagementPosition(e.target.value)
      }
      className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
    >
      {getManagementPositionOptions(adminManagementCategory).map((option) => (
        <option key={option.value} value={option.value}>
          {option.groupHeading} · {option.label}
        </option>
      ))}
    </select>
  </div>


  {/* ================= RESPONSIBILITIES ================= */}
  <div className="space-y-1">
    <label className="font-bold text-slate-500">
      Responsibilities
    </label>

    <textarea
      placeholder="Describe the official's responsibilities..."
      value={adminManagementResponsibilities}
      onChange={(e) =>
        setAdminManagementResponsibilities(e.target.value)
      }
      rows={3}
      className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
    />
  </div>


  {/* ================= BIOGRAPHY ================= */}
  <div className="space-y-1">
    <label className="font-bold text-slate-500">
      Short Biography
    </label>

    <textarea
      placeholder="Enter a short biography..."
      value={adminManagementBio}
      onChange={(e) =>
        setAdminManagementBio(e.target.value)
      }
      rows={3}
      className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
    />
  </div>


  {/* ================= DISPLAY ORDER ================= */}
  <div className="space-y-1">
    <label className="font-bold text-slate-500">
      Display Order
    </label>

    <input
      type="number"
      min="0"
      value={adminManagementOrder}
      onChange={(e) =>
        setAdminManagementOrder(e.target.value)
      }
      className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
    />

    <p className="text-[10px] text-slate-400">
      Lower numbers appear first.
    </p>
  </div>


  {/* ================= MANAGEMENT PHOTO ================= */}
  <div className="space-y-1">
    <label className="font-bold text-slate-500">
      Official&apos;s Photo
    </label>

    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        const file = e.target.files?.[0] || null;
        setAdminManagementFile(file);
      }}
      className="block w-full text-sm text-slate-600
        file:mr-4 file:py-2.5 file:px-4
        file:rounded-xl file:border-0
        file:text-xs file:font-bold
        file:bg-emerald-50 file:text-emerald-700
        hover:file:bg-emerald-100"
    />

    {adminManagementFile && (
      <p className="text-[10px] text-emerald-600 font-semibold">
        Selected: {adminManagementFile.name}
      </p>
    )}
  </div>


  {/* ================= SUBMIT ================= */}
  <button
    type="submit"
    disabled={isPending}
    className="w-full bg-slate-950 text-yellow-400 font-bold py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer disabled:opacity-50"
  >
    {isPending
      ? editingManagementId
        ? "Updating Official..."
        : "Adding Official..."
      : editingManagementId
        ? "Update Management Official"
        : "Add Management Official"}
  </button>


  {/* ================= CANCEL EDIT ================= */}
  {editingManagementId && (
    <button
      type="button"
      onClick={handleCancelManagementEdit}
      className="w-full border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-50 transition cursor-pointer"
    >
      Cancel Edit
    </button>
  )}

</form>

{managementMembersSorted.length > 0 && (
  <div className="pt-4 border-t border-slate-100 space-y-3">
    <h4 className="font-bold text-sm text-slate-950">
      Quick Role Updates
    </h4>
    <p className="text-[11px] text-slate-500 leading-relaxed">
      Move officials between departments and roles without opening the full edit form.
    </p>
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {managementMembersSorted.map((member) => {
        const positionOptions = getManagementPositionOptions(member.category);
        const positionInOptions = positionOptions.some(
          (option) => option.value === member.position
        );

        return (
          <div
            key={member.id}
            className="flex flex-col gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70"
          >
            <p className="font-bold text-slate-900 text-xs truncate">
              {member.name}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={member.category}
                onChange={(e) =>
                  handleUpdateManagementRole(
                    member.id,
                    e.target.value,
                    getDefaultManagementPosition(e.target.value)
                  )
                }
                disabled={updatingManagementRoleId === member.id}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 disabled:opacity-50"
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
                  handleUpdateManagementRole(
                    member.id,
                    member.category,
                    e.target.value
                  )
                }
                disabled={updatingManagementRoleId === member.id}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 disabled:opacity-50"
              >
                {!positionInOptions && (
                  <option value={member.position}>
                    {member.position} (assign)
                  </option>
                )}
                {positionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.groupHeading} · {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
</div>

{/* Action 3: Add Gallery Image */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5 overflow-hidden">

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-base text-slate-950 flex items-center gap-1.5">
                          <Camera className="w-5 h-5 text-emerald-600" /> Post Photo to Team Gallery
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Upload matchday, training, and community photos. Images are shown in full with no cropping.
                        </p>
                      </div>
                      <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider">
                        Full Image
                      </span>
                    </div>

                    <form onSubmit={handleAdminAddGallery} className="space-y-4 text-xs">

                      {/* Upload zone with live preview */}
                      <div className="space-y-2">
                        <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          Gallery Photo
                        </label>

                        <label
                          htmlFor="admin-gallery-upload"
                          className={`relative block rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
                            adminGalleryPreview
                              ? "border-emerald-300 bg-white"
                              : "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 hover:border-emerald-300 hover:bg-emerald-50/30"
                          }`}
                        >
                          {adminGalleryPreview ? (
                            <div className="relative min-h-[220px] sm:min-h-[280px] flex items-center justify-center p-4 bg-white">

                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={adminGalleryPreview}
                                alt="Gallery upload preview"
                                className="relative z-10 max-w-full max-h-[240px] sm:max-h-[300px] w-auto h-auto object-contain rounded-xl"
                              />

                              <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider">
                                Preview
                              </div>
                            </div>
                          ) : (
                            <div className="py-10 px-6 text-center">
                              <div className="w-14 h-14 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <ImageIcon className="w-7 h-7 text-emerald-500" />
                              </div>
                              <p className="font-black text-slate-800 text-sm">
                                Click to choose a photo
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1">
                                JPG, PNG, or WEBP. Original proportions kept
                              </p>
                            </div>
                          )}

                          <input
                            id="admin-gallery-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              if (adminGalleryPreview) {
                                URL.revokeObjectURL(adminGalleryPreview);
                              }
                              setAdminGalleryFile(file);
                              setAdminGalleryPreview(file ? URL.createObjectURL(file) : null);
                            }}
                            className="sr-only"
                            required
                          />
                        </label>

                        {adminGalleryFile && (
                          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
                            <p className="text-xs text-emerald-800 font-semibold truncate">
                              {adminGalleryFile.name}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                if (adminGalleryPreview) {
                                  URL.revokeObjectURL(adminGalleryPreview);
                                }
                                setAdminGalleryFile(null);
                                setAdminGalleryPreview(null);
                              }}
                              className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:text-rose-700 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Caption and Category */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                            Caption / Description
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Celebrating our winning goal in Githurai."
                            value={adminGalleryCaption}
                            onChange={(e) => setAdminGalleryCaption(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                            Event Category
                          </label>
                          <select
                            value={adminGalleryCategory}
                            onChange={(e) => setAdminGalleryCategory(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          >
                            <option value="Match">Matchday Action</option>
                            <option value="Training">Pitch Training</option>
                            <option value="Community">Slum Community Event</option>
                            <option value="Academy">U-15 Youth Academy</option>
                            <option value="Wazee">Wazee</option>
                          </select>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
                        Unlimited gallery uploads from your device. Photos appear on the homepage carousel and gallery page exactly as uploaded with no cropping applied (max {MEDIA_UPLOAD_RULES.maxFileSizeLabel} each).
                      </div>

                      {/* Publish Button */}
                      <button
                        type="submit"
                        disabled={isPending || !adminGalleryFile}
                        className="w-full bg-slate-950 text-yellow-400 font-bold py-3 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-950/10"
                      >
                        {isPending ? "Uploading Image..." : "Publish to Gallery"}
                      </button>
                    </form>
                  </div>

                  {/* Action 5: Add Merchandise to Shop */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-950 flex items-center gap-1.5">
                      <ShoppingBag className="w-5 h-5 text-yellow-500" /> Add Jersey / Merch to Shop
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Upload a product photo URL so fans can see and buy the jersey via M-Pesa checkout.
                    </p>
                    <form onSubmit={handleAddMerchandise} className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500">Product Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Official KLFC Training Tracksuit"
                          value={adminMerchName}
                          onChange={(e) => setAdminMerchName(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500">Product Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAdminMerchFile(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-950 file:text-yellow-400 hover:file:bg-slate-800 cursor-pointer"
                        />
                        {adminMerchFile && <p className="text-[10px] text-emerald-600 font-semibold">Selected: {adminMerchFile.name}</p>}
                        <p className="text-[9px] text-slate-400">Choose the product photo directly from your computer. Leave blank to use the default image.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500">Description</label>
                        <textarea
                          rows={2}
                          placeholder="Describe the product, its material, colors, and meaning..."
                          value={adminMerchDesc}
                          onChange={(e) => setAdminMerchDesc(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Price (Ksh)</label>
                          <input
                            type="number"
                            placeholder="e.g. 1800"
                            value={adminMerchPrice}
                            onChange={(e) => setAdminMerchPrice(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Available Sizes</label>
                          <input
                            type="text"
                            placeholder="S, M, L, XL"
                            value={adminMerchSizes}
                            onChange={(e) => setAdminMerchSizes(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Kit Type</label>
                          <select
                            value={adminMerchType}
                            onChange={(e) => setAdminMerchType(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                          >
                            <option value="home">Home Jersey (Black)</option>
                            <option value="away-green">Away Jersey (Green)</option>
                            <option value="away-white">Away Jersey (White)</option>
                            <option value="jersey">Other Jersey</option>
                            <option value="accessory">Accessory</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-slate-950 text-yellow-400 font-bold py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer"
                      >
                        {isPending ? "Adding Item..." : "Add to Fan Shop"}
                      </button>
                    </form>
                  </div>

                  {/* Action 4: Publish News */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-950 flex items-center gap-1.5">
                      <BookOpen className="w-5 h-5 text-emerald-600" /> Publish Official Club News
                    </h3>
                    <form onSubmit={handleAdminAddNews} className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 block">News Headline / Title</label>
                        <input
                          type="text"
                          placeholder="e.g. Community Support Fuels Promotion Dream"
                          value={adminNewsTitle}
                          onChange={(e) => setAdminNewsTitle(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500 text-sm font-semibold"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 block">Brief Summary (One-liner)</label>
                        <input
                          type="text"
                          placeholder="e.g. A brief summary of Mr. Erick Otieno Atanga's meeting with stakeholders."
                          value={adminNewsSummary}
                          onChange={(e) => setAdminNewsSummary(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 block">Article Body / Content</label>
                        <textarea
                          rows={3}
                          placeholder="Full article body..."
                          value={adminNewsContent}
                          onChange={(e) => setAdminNewsContent(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 block">Article Photo (optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAdminNewsFile(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-950 file:text-yellow-400 hover:file:bg-slate-800 cursor-pointer"
                        />
                        {adminNewsFile && <p className="text-[10px] text-emerald-600 font-semibold">Selected: {adminNewsFile.name}</p>}
                      </div>

                      <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-slate-950 text-yellow-400 font-bold py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer"
                      >
                        {isPending ? "Publishing..." : "Publish Article to News Feed"}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-black text-lg text-slate-950 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-emerald-600" />
                      Customer Merchandise Orders
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {adminOrderStats.totalOrders} total orders · Ksh{" "}
                      {adminOrderStats.totalSales.toLocaleString()} in paid sales
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                        {adminOrderStats.paidCount} paid
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700">
                        {adminOrderStats.pendingCount} pending
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">
                        {adminOrderStats.failedCount} failed
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPanelView("orders");
                      loadAdminOrders();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="shrink-0 bg-slate-950 text-yellow-400 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer flex items-center gap-2"
                  >
                    View All Orders
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                  </>
                )}

                {adminPanelView === "inbox" && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminPanelView("content");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to Content
                    </button>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-base font-black text-slate-950 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-emerald-600" />
                            Fan Account Inbox
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Reply to registered fan accounts.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            loadAdminInboxThreads();
                            if (selectedInboxCustomerId) {
                              loadAdminInboxThread(selectedInboxCustomerId);
                            }
                          }}
                          disabled={isLoadingAdminInbox}
                          className="text-[10px] font-black uppercase tracking-wider text-emerald-700 hover:text-emerald-800 disabled:opacity-50 cursor-pointer shrink-0"
                        >
                          {isLoadingAdminInbox ? "Refreshing..." : "Refresh"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[minmax(180px,220px)_1fr] gap-3">
                        <div className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50/60">
                          <div className="px-3 py-2 border-b border-slate-100 bg-white">
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                              Conversations
                            </p>
                          </div>
                          <div className="max-h-44 overflow-y-auto divide-y divide-slate-100">
                            {isLoadingAdminInbox && adminInboxThreads.length === 0 ? (
                              <p className="text-xs text-slate-500 p-3">Loading...</p>
                            ) : adminInboxThreads.length === 0 ? (
                              <p className="text-xs text-slate-500 p-3">
                                No fan messages yet.
                              </p>
                            ) : (
                              adminInboxThreads.map((thread) => {
                                const isSelected = selectedInboxCustomerId === thread.customerId;

                                return (
                                  <button
                                    type="button"
                                    key={thread.customerId}
                                    onClick={() => loadAdminInboxThread(thread.customerId)}
                                    className={`w-full text-left px-3 py-2 transition cursor-pointer ${
                                      isSelected
                                        ? "bg-emerald-50 border-l-4 border-emerald-500"
                                        : "hover:bg-white"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-1.5">
                                      <div className="min-w-0">
                                        <p className="font-bold text-xs text-slate-900 truncate">
                                          {thread.fullName}
                                        </p>
                                        <p className="text-[9px] text-slate-500 truncate">
                                          {formatPhoneDisplay(formatStoredPhoneForInput(thread.phoneNumber))}
                                        </p>
                                      </div>
                                      {thread.unreadCount > 0 && (
                                        <span className="shrink-0 min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                          {thread.unreadCount}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-600 mt-1 line-clamp-1">
                                      {thread.lastMessage}
                                    </p>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>

                        <div className="border border-slate-100 rounded-xl overflow-hidden flex flex-col bg-white min-h-[220px] max-h-[320px]">
                          {!selectedInboxCustomerId ? (
                            <div className="flex-1 flex items-center justify-center p-4 text-center">
                              <div className="space-y-1">
                                <MessageCircle className="w-7 h-7 text-slate-300 mx-auto" />
                                <p className="font-semibold text-xs text-slate-700">Select a conversation</p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/80">
                                <p className="font-bold text-sm text-slate-900 truncate">
                                  {selectedInboxCustomer?.fullName || "Fan account"}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  {selectedInboxCustomer
                                    ? formatPhoneDisplay(
                                        formatStoredPhoneForInput(selectedInboxCustomer.phoneNumber)
                                      )
                                    : ""}
                                  {selectedInboxCustomer?.email
                                    ? ` • ${selectedInboxCustomer.email}`
                                    : ""}
                                </p>
                              </div>

                              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/40">
                                {isLoadingAdminInbox && adminInboxMessages.length === 0 ? (
                                  <p className="text-xs text-slate-500 text-center py-4">
                                    Loading...
                                  </p>
                                ) : adminInboxMessages.length === 0 ? (
                                  <p className="text-xs text-slate-500 text-center py-4">
                                    No messages yet.
                                  </p>
                                ) : (
                                  adminInboxMessages.map((entry) => {
                                    const isAdmin = entry.senderType === "admin";

                                    return (
                                      <div
                                        key={entry.id}
                                        className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                                      >
                                        <div
                                          className={`max-w-[90%] rounded-xl px-3 py-2 shadow-sm ${
                                            isAdmin
                                              ? "bg-slate-950 text-yellow-400"
                                              : "bg-white border border-slate-200 text-slate-800"
                                          }`}
                                        >
                                          <p className="text-[9px] font-black uppercase tracking-wider opacity-80 mb-0.5">
                                            {isAdmin ? "Admin" : "Fan"}
                                          </p>
                                          <p className="text-xs leading-relaxed whitespace-pre-wrap">
                                            {entry.message}
                                          </p>
                                          <p className="text-[9px] mt-1 opacity-70">
                                            {new Date(entry.createdAt).toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              <form
                                onSubmit={handleAdminReply}
                                className="border-t border-slate-100 p-3 space-y-2 bg-white"
                              >
                                <textarea
                                  rows={2}
                                  placeholder="Type your reply..."
                                  value={adminReplyDraft}
                                  onChange={(e) => setAdminReplyDraft(e.target.value)}
                                  maxLength={2000}
                                  className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none text-xs"
                                  required
                                />
                                <button
                                  type="submit"
                                  disabled={isSendingAdminReply}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isSendingAdminReply ? "Sending..." : "Send Reply"}
                                </button>
                              </form>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {adminPanelView === "orders" && (
                  <div className="space-y-6">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminPanelView("content");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-emerald-700 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to Admin Panel
                    </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Total Orders
        </p>
        <p className="text-3xl font-black text-slate-950 mt-2">
          {adminOrderStats.totalOrders}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          All merchandise orders
        </p>
      </div>
      <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
          Paid Orders
        </p>
        <p className="text-3xl font-black text-emerald-700 mt-2">
          {adminOrderStats.paidCount}
        </p>
        <p className="text-xs text-emerald-600 mt-1">
          Successfully paid
        </p>
      </div>
      <div className="bg-yellow-50 rounded-2xl border border-yellow-100 shadow-sm p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-yellow-600">
          Pending
        </p>
        <p className="text-3xl font-black text-yellow-700 mt-2">
          {adminOrderStats.pendingCount}
        </p>
        <p className="text-xs text-yellow-600 mt-1">
          Awaiting payment
        </p>
      </div>
      <div className="bg-rose-50 rounded-2xl border border-rose-100 shadow-sm p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-rose-600">
          Failed
        </p>
        <p className="text-3xl font-black text-rose-700 mt-2">
          {adminOrderStats.failedCount}
        </p>
        <p className="text-xs text-rose-600 mt-1">
          Unsuccessful payments
        </p>
      </div>
      <div className="bg-slate-950 rounded-2xl shadow-sm p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Total Sales
        </p>
        <p className="text-2xl font-black text-yellow-400 mt-2">
          Ksh {adminOrderStats.totalSales.toLocaleString()}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Paid orders only
        </p>
      </div>
    </div>

<div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
  <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h3 className="font-black text-lg text-slate-950 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-emerald-600" />
        Customer Merchandise Orders
      </h3>

      <p className="text-[11px] text-slate-500 mt-1">
        View merchandise purchases and M-PESA payment confirmations.
      </p>

      {notificationConfig && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-600 leading-relaxed">
          <span className="font-black uppercase tracking-wider text-slate-500">
            Buyer notifications:
          </span>{" "}
          SMS {notificationConfig.sms ? "ready" : "not configured"} • WhatsApp{" "}
          {notificationConfig.whatsapp ? "ready" : "not configured"}
          {notificationConfig.trackingUrlConfigured
            ? " • Tracking links enabled"
            : " • Add NEXT_PUBLIC_SITE_URL for tracking links"}
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
  <input
    type="text"
    value={orderSearch}
    onChange={(e) => setOrderSearch(e.target.value)}
    placeholder="Search customer, phone or order #..."
    className="w-full sm:w-72 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
  />

  <select
    value={orderFilter}
    onChange={(e) =>
      setOrderFilter(
        e.target.value as "all" | "paid" | "pending" | "failed"
      )
    }
    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
  >
    <option value="all">All Orders</option>
    <option value="paid">Paid</option>
    <option value="pending">Pending</option>
    <option value="failed">Failed</option>
  </select>
</div>
    </div>

    <button
      type="button"
      onClick={loadAdminOrders}
      disabled={isLoadingOrders}
      className="bg-slate-950 text-yellow-400 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer disabled:opacity-50"
    >
      {isLoadingOrders ? "Refreshing..." : "Refresh Orders"}
    </button>
  </div>

  {isLoadingOrders ? (
    <div className="p-10 text-center">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />

      <p className="text-sm font-semibold text-slate-500">
        Loading customer orders...
      </p>
    </div>
  ) : adminOrders.length === 0 ? (
    <div className="p-10 text-center">
      <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />

      <h4 className="font-bold text-slate-600">
        No customer orders yet
      </h4>

      <p className="text-xs text-slate-400 mt-1">
        Completed or pending merchandise orders will appear here.
      </p>
    </div>
  ) : (
    <div className="overflow-x-auto -mx-1 px-1">
    <div className="divide-y divide-slate-100 min-w-0">
      {adminOrders
  .filter((order) => {
    const status = String(
      order.paymentStatus || "pending"
    ).toLowerCase();

    const matchesFilter =
      orderFilter === "all" || status === orderFilter;

    const search = orderSearch.trim().toLowerCase();

    const matchesSearch =
      !search ||
      String(order.id).includes(search) ||
      String(order.customerName || "")
        .toLowerCase()
        .includes(search) ||
      String(order.phoneNumber || "")
        .toLowerCase()
        .includes(search);

    return matchesFilter && matchesSearch;
  })
  .map((order) => {
        const status =
          String(order.paymentStatus || "pending").toLowerCase();

        const statusClasses =
          status === "paid"
            ? "bg-emerald-100 text-emerald-700"
            : status === "failed"
              ? "bg-rose-100 text-rose-700"
              : "bg-yellow-100 text-yellow-700";

        return (
          <div
            key={order.id}
            className="p-6 hover:bg-slate-50/70 transition"
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

              {/* ORDER INFORMATION */}
              <div className="space-y-3 flex-1">

                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-slate-950">
                    Order #{order.id}
                  </span>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusClasses}`}
                  >
                    {status}
                  </span>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                    {getOrderStatusLabel(order.orderStatus || "processing")}
                  </span>
                </div>

                {/* CUSTOMER DETAILS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">

                  <div>
                    <span className="text-slate-400 block">
                      Customer
                    </span>

                    <span className="font-bold text-slate-800">
                      {order.customerName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">
                      M-PESA Phone
                    </span>

                    <span className="font-bold text-slate-800">
                      {order.phoneNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">
                      Payment Method
                    </span>

                    <span className="font-bold text-slate-800 uppercase">
                      {order.paymentMethod || "M-PESA"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">
                      Order Date
                    </span>

                    <span className="font-bold text-slate-800">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleString()
                        : "—"}
                    </span>
                  </div>

                </div>

                {/* ITEMS ORDERED */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2">

                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Items Ordered
                  </p>

                  {Array.isArray(order.items) &&
                  order.items.length > 0 ? (
                    <div className="space-y-2">

                      {order.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">
                              {item.productName}
                            </span>

                            <span className="text-slate-500">
                              {" "}
                              • Size: {item.size} • Qty: {item.quantity}
                            </span>
                          </div>

                          <span className="font-bold text-slate-900">
                            Ksh{" "}
                            {(
                              Number(item.unitPrice || 0) *
                              Number(item.quantity || 0)
                            ).toLocaleString()}
                          </span>
                        </div>
                      ))}

                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      No item details available.
                    </p>
                  )}

                </div>
              </div>
              

              {/* PAYMENT SUMMARY */}
              <div className="lg:w-64 bg-slate-950 rounded-2xl p-5 text-white space-y-4">

                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                    Order Total
                  </p>

                  <p className="text-2xl font-black text-yellow-400 mt-1">
                    Ksh{" "}
                    {Number(order.totalAmount || 0).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2 text-xs">

                  <div>
                    <p className="text-slate-400">
                      M-PESA Receipt
                    </p>

                    <p className="font-bold text-white break-all">
                      {order.mpesaReceiptNumber ||
                        "Not yet available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Transaction Date
                    </p>

                    <p className="font-bold text-white">
                      {order.transactionDate ||
                        "Not yet available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Checkout Request ID
                    </p>

                    <p className="font-mono text-[9px] text-slate-300 break-all">
                      {order.checkoutRequestId ||
                        "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400">
                      Delivery Progress
                    </p>

                    <select
                      value={order.orderStatus || "processing"}
                      onChange={(e) =>
                        handleUpdateOrderStatus(
                          order.id,
                          e.target.value as
                            | "processing"
                            | "shipped"
                            | "delivered"
                            | "cancelled"
                        )
                      }
                      disabled={isPending || status !== "paid"}
                      className="mt-1 w-full bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg px-2 py-2 cursor-pointer disabled:opacity-50"
                    >
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    {status !== "paid" && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Update delivery after payment is confirmed.
                      </p>
                    )}
                  </div>

                </div>
              </div>

            </div>
          </div>
        );
      })}
    </div>
    </div>
  )}
</div>
                  </div>
                )}

              </div>
              
            )}
          </div>
          
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
                            <span className="text-[10px] text-yellow-400 font-bold uppercase">
                              {item.kitType === "home" ? "Home" : "Away"}
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
                              Ksh {(item.price * item.quantity).toLocaleString()}
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
                    <div className="space-y-4 bg-amber-50 p-5 rounded-2xl border border-amber-200">
                      <div>
                        <p className="font-black text-sm text-slate-950">
                          Account required to checkout
                        </p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Register free to pay with M-Pesa and track your order in My Orders.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => redirectToCheckoutAuth(true)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
                      >
                        Create Account & Checkout
                      </button>
                      <button
                        type="button"
                        onClick={() => redirectToCheckoutAuth(false)}
                        className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
                      >
                        I Already Have an Account
                      </button>
                    </div>
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

  {/* Payment Method */}
  <div className="space-y-2">

    <label className="text-[9px] text-slate-400 font-bold uppercase block">
      Payment Method
    </label>

    <button
      type="button"
      onClick={() => setCheckoutMethod("mpesa")}
      className="w-full p-3 rounded-xl bg-emerald-600 text-white border-2 border-emerald-600 font-black text-xs flex items-center justify-between shadow-sm"
    >
      <span className="flex items-center gap-2">
        <Phone className="w-4 h-4" />
        M-PESA
      </span>

      <span className="text-[9px] bg-white/15 px-2 py-1 rounded-md">
        Recommended
      </span>
    </button>

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

  {/* Order Amount */}
  <div className="flex items-center justify-between px-1 pt-1">

    <span className="text-xs font-bold text-slate-600">
      Amount to Pay
    </span>

    <span className="text-lg font-black text-emerald-600">
      Ksh {cartTotal.toLocaleString()}
    </span>

  </div>

  {/* Confirm Payment */}
  <button
    type="submit"
    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2"
  >
    <Check className="w-4 h-4" />
    Confirm M-Pesa Payment
  </button>

  <p className="text-[8px] text-center text-slate-400 leading-relaxed">
    Your order will be recorded after checkout. Keep your M-Pesa confirmation
    message for reference.
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

            <div className="flex gap-3">
              <button
                onClick={() => setReplaceImageId(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReplaceImage}
                disabled={isPending || !replaceImageFile}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Replacing..." : "Confirm Replace"}
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

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logo.png"
            alt="Kariobangi Legends FC badge"
            className="w-full h-full object-contain"
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
          { label: "Fan Zone", tab: "fanzone" },
          { label: "Merchandise Shop", tab: "shop" },
          { label: "My Account", tab: "account" },
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
        © {new Date().getFullYear()} Kariobangi Legends FC. Made with love for Nairobi youth.
      </p>

    </div>

  </div>

</footer>
    </div>
  );
}


