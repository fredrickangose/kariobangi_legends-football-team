"use client";

import Image from "next/image";
import { type AdminMembershipStatus, MEMBERSHIP_PLANS, type MembershipPlanId, formatMembershipExpiry } from "@/lib/membership";
import { ArrowRight, Award, Banknote, BookOpen, Calendar, Camera, ChevronLeft, Clock, Film, ImageIcon, LogOut, MessageCircle, MessageSquare, Newspaper, Package, Play, Shield, ShoppingBag, Trash2, User, UserPlus, Users } from "lucide-react";
import { MANAGEMENT_CATEGORIES, getDefaultManagementPosition, getManagementPositionOptions } from "@/lib/management-roles";
import { MATCH_STATUSES, MATCH_TYPES, SQUAD_TEAMS, combineFixtureDateTime, formatKickoff, hasKickoffTime, isFixtureFinished, normalizeSquadTeam } from "@/lib/match-fixtures";
import { MEDIA_UPLOAD_RULES, VIDEO_UPLOAD_RULES, isUploadedMediaUrl, isVideoMediaUrl } from "@/lib/uploaded-media";
import { MERCHANDISE_CATEGORIES, normalizeMerchandiseCategory } from "@/lib/merchandise-categories";
import { MERCHANDISE_STOCK_STATUSES, normalizeMerchandiseStockStatus } from "@/lib/merchandise-stock";
import { OrderProgressTimeline } from "@/components/OrderProgressTimeline";
import { PasswordInput } from "@/components/PasswordInput";
import { SQUAD_POSITION_OPTIONS, getSquadPositionBadge } from "@/lib/squad-positions";
import { getOrderStatusLabel } from "@/lib/order-tracking";
import {
  AdminCollapsibleSection,
  HIGHLIGHT_CATEGORIES,
  MerchandiseAdminThumbnail,
  formatPhoneDisplay,
  formatStoredPhoneForInput,
  preventAdminListScrollChaining,
  type Player,
  type Fixture,
  type NewsItem,
  type MerchandiseItem,
  type Donation,
  type FanMessage,
  type GalleryItem,
  type TeamHighlight,
  type ManagementMember,
} from "./ClubWebsite";

interface AdminPanelProps {
  activeTab: string;
  adminArchivedOrders: any[];
  adminAwayScore: string;
  adminBusy: "player" | "management" | "fixture" | "news" | "gallery" | "highlights" | "merch" | "merch-clear" | "merch-price" | "merch-stock" | "merch-category" | "merch-details" | "replace-image" | "remove-image" | "bulk-photos" | null;
  adminGalleryCaption: string;
  adminGalleryCategory: string;
  adminGalleryFile: File | null;
  adminGalleryPreview: string | null;
  adminHighlightCategory: string;
  adminHighlightDescription: string;
  adminHighlightThumbPreview: string | null;
  adminHighlightTitle: string;
  adminHighlightVideoFile: File | null;
  adminHighlightVideoPreview: string | null;
  adminHomeScore: string;
  adminInboxMessages: { id: number; senderType: string; message: string; createdAt: string; }[];
  adminInboxThreads: { customerId: number; fullName: string; phoneNumber: string; email: string | null; lastMessage: string; lastMessageAt: string; unreadCount: number; }[];
  adminIsHome: boolean;
  adminManagementBio: string;
  adminManagementCategory: string;
  adminManagementFile: File | null;
  adminManagementName: string;
  adminManagementOrder: string;
  adminManagementPosition: string;
  adminManagementResponsibilities: string;
  adminMatchDate: string;
  adminMatchTime: string;
  adminMatchType: string;
  adminMemberName: string;
  adminMemberPhone: string;
  adminMemberPlanId: "youth" | "official";
  adminMembershipStats: { total: number; activeCount: number; expiredCount: number; pendingCount: number; revokedCount: number; activeRevenue: number; };
  adminMerchDesc: string;
  adminMerchFile: File | null;
  adminMerchName: string;
  adminMerchPrice: string;
  adminMerchSizes: string;
  adminMerchStockStatus: string;
  adminMerchType: string;
  adminNewsContent: string;
  adminNewsFile: File | null;
  adminNewsSummary: string;
  adminNewsTitle: string;
  adminOpponent: string;
  adminOpponentLogoFile: File | null;
  adminOpponentLogoUrl: string;
  adminOrderStats: { totalOrders: number; paidCount: number; pendingCount: number; failedCount: number; totalSales: any; };
  adminOrders: any[];
  adminPanelView: "content" | "inbox" | "orders" | "members";
  adminPassword: string;
  adminPlayerApps: string;
  adminPlayerAssists: string;
  adminPlayerBio: string;
  adminPlayerFile: File | null;
  adminPlayerGoals: string;
  adminPlayerJersey: string;
  adminPlayerName: string;
  adminPlayerPos: string;
  adminReplyDraft: string;
  adminResetCode: string;
  adminResetConfirmPassword: string;
  adminResetNewPassword: string;
  adminResetPhone: string;
  adminResetStep: "request" | "confirm";
  adminRole: "admin" | "news_editor" | null;
  adminSquadTeam: string;
  adminStatus: string;
  adminUnseenOrderCount: number;
  adminVenue: string;
  bulkPhotosOpen: boolean;
  clubData: { players: Player[]; fixtures: Fixture[]; news: NewsItem[]; merchandise: MerchandiseItem[]; donations: Donation[]; fanMessages: FanMessage[]; gallery: GalleryItem[]; highlights: TeamHighlight[]; management: ManagementMember[]; };
  editingFixtureId: number | null;
  editingManagementId: number | null;
  editingPlayerId: number | null;
  fixtureGroups: { live: import("@/lib/match-fixtures").FixtureLike[]; upcoming: import("@/lib/match-fixtures").FixtureLike[]; upcomingRest: import("@/lib/match-fixtures").FixtureLike[]; recent: import("@/lib/match-fixtures").FixtureLike[]; nextMatch: import("@/lib/match-fixtures").FixtureLike; };
  handleAddAdminMembership: (e: React.FormEvent) => Promise<void>;
  handleAddMerchandise: (e: React.FormEvent) => Promise<void>;
  handleAdminAddFixture: (e: React.FormEvent) => Promise<void>;
  handleAdminAddGallery: (e: React.FormEvent) => Promise<void>;
  handleAdminAddHighlight: (e: React.FormEvent) => Promise<void>;
  handleAdminAddManagement: (e: React.FormEvent) => Promise<void>;
  handleAdminAddPlayer: (e: React.FormEvent) => Promise<void>;
  handleAdminCompleteReset: (e: React.FormEvent) => Promise<void>;
  handleAdminEditPlayer: (player: Player) => void;
  handleAdminLogin: (e: React.FormEvent) => Promise<void>;
  handleAdminReply: (e: React.FormEvent) => Promise<void>;
  handleAdminRequestReset: (e?: React.FormEvent) => Promise<void>;
  handleAdminUpdateFixture: (e: React.FormEvent) => Promise<void>;
  handleAdminUpdateManagement: (e: React.FormEvent) => Promise<void>;
  handleAdminUpdatePlayer: (e: React.FormEvent) => Promise<void>;
  handleArchiveOrder: (orderId: number) => Promise<void>;
  handleBulkPassportUploads: (kind: "player" | "management") => Promise<void>;
  handleCancelManagementEdit: () => void;
  handleClearAllMerchandise: () => Promise<void>;
  handleDeleteHighlight: (id: number, title: string) => Promise<void>;
  handleDeleteMerchandise: (id: number, name: string) => Promise<void>;
  handleEditFixture: (fixture: Fixture) => void;
  handleMarkOrderCashPaid: (orderId: number) => Promise<void>;
  handleNewspaperLogin: (e: React.FormEvent) => Promise<void>;
  handleNewspaperPasswordReset: (e: React.FormEvent) => Promise<void>;
  handleRestoreOrder: (orderId: number) => Promise<void>;
  handleRevokeMembership: (membership: { id: number; fullName: string; planName: string; }) => Promise<void>;
  handleUpdateManagementName: (managementId: number, name: string) => Promise<void>;
  handleUpdateManagementRole: (managementId: number, category: string, position: string) => Promise<void>;
  handleUpdateMerchandiseCategory: (id: number, kitType: string) => Promise<void>;
  handleUpdateMerchandisePrice: (id: number, priceValue: string) => Promise<void>;
  handleUpdateMerchandiseStockStatus: (id: number, stockStatus: string) => Promise<void>;
  handleUpdateOrderStatus: (orderId: number, orderStatus: "processing" | "shipped" | "delivered" | "cancelled") => Promise<void>;
  handleUpdatePlayerJersey: (playerId: number, jerseyNumber: number) => Promise<void>;
  handleUpdatePlayerName: (playerId: number, name: string) => Promise<void>;
  handleUpdatePlayerPosition: (playerId: number, position: string) => Promise<void>;
  hasRealPassportPhoto: (imageUrl?: string | null) => boolean;
  isAdminAuthenticated: boolean;
  isAdminResetPending: boolean;
  isLoadingAdminInbox: boolean;
  isLoadingMemberships: boolean;
  isLoadingOrders: boolean;
  isNewspaperResetPending: boolean;
  isPending: boolean;
  isSendingAdminReply: boolean;
  listedShopItemsOpen: boolean;
  loadAdminInboxThread: (customerId: number) => Promise<void>;
  loadAdminInboxThreads: (silent?: boolean) => Promise<void>;
  loadAdminMemberships: () => Promise<void>;
  loadAdminOrders: () => Promise<void>;
  logoutAdminSession: () => Promise<void>;
  managementMembersSorted: ManagementMember[];
  managementPanelOpen: boolean;
  managementUpdatesOpen: boolean;
  membershipFilter: AdminMembershipStatus | "all";
  membershipSearch: string;
  merchAdminPriceDrafts: { [x: number]: string; };
  newspaperLoginPassword: string;
  newspaperResetAdminPassword: string;
  newspaperResetConfirmPassword: string;
  newspaperResetNewPassword: string;
  notificationConfig: { channels: string[]; sms: boolean; smsLive: boolean; whatsapp: boolean; whatsappLive: boolean; whatsappPhone?: string; whatsappProvider?: "meta" | "africas_talking" | "log" | null; whatsappProviderPreference?: "meta" | "africas_talking" | "auto"; metaTemplateConfigured?: boolean; whatsappLogMode?: boolean; trackingUrlConfigured: boolean; buyerNotificationsLive: boolean; adminAlertPhones: number; adminAlertsLive: boolean; } | null;
  orderFilter: "pending" | "failed" | "all" | "paid";
  orderSearch: string;
  playerPanelOpen: boolean;
  publishedHighlightsOpen: boolean;
  resetAdminPlayerForm: () => void;
  returnToSignIn: () => void;
  revokingMembershipId: number | null;
  selectedInboxCustomer: { id: number; fullName: string; phoneNumber: string; email: string | null; } | null;
  selectedInboxCustomerId: number | null;
  setActiveHighlight: (value: React.SetStateAction<TeamHighlight | null>) => void;
  setAdminAwayScore: (value: React.SetStateAction<string>) => void;
  setAdminGalleryCaption: (value: React.SetStateAction<string>) => void;
  setAdminGalleryCategory: (value: React.SetStateAction<string>) => void;
  setAdminGalleryFile: (value: React.SetStateAction<File | null>) => void;
  setAdminGalleryPreview: (value: React.SetStateAction<string | null>) => void;
  setAdminHighlightCategory: (value: React.SetStateAction<string>) => void;
  setAdminHighlightDescription: (value: React.SetStateAction<string>) => void;
  setAdminHighlightThumbFile: (value: React.SetStateAction<File | null>) => void;
  setAdminHighlightThumbPreview: (value: React.SetStateAction<string | null>) => void;
  setAdminHighlightTitle: (value: React.SetStateAction<string>) => void;
  setAdminHighlightVideoFile: (value: React.SetStateAction<File | null>) => void;
  setAdminHighlightVideoPreview: (value: React.SetStateAction<string | null>) => void;
  setAdminHomeScore: (value: React.SetStateAction<string>) => void;
  setAdminIsHome: (value: React.SetStateAction<boolean>) => void;
  setAdminManagementBio: (value: React.SetStateAction<string>) => void;
  setAdminManagementCategory: (value: React.SetStateAction<string>) => void;
  setAdminManagementFile: (value: React.SetStateAction<File | null>) => void;
  setAdminManagementName: (value: React.SetStateAction<string>) => void;
  setAdminManagementOrder: (value: React.SetStateAction<string>) => void;
  setAdminManagementPosition: (value: React.SetStateAction<string>) => void;
  setAdminManagementResponsibilities: (value: React.SetStateAction<string>) => void;
  setAdminMatchDate: (value: React.SetStateAction<string>) => void;
  setAdminMatchTime: (value: React.SetStateAction<string>) => void;
  setAdminMatchType: (value: React.SetStateAction<string>) => void;
  setAdminMemberName: (value: React.SetStateAction<string>) => void;
  setAdminMemberPhone: (value: React.SetStateAction<string>) => void;
  setAdminMemberPlanId: (value: React.SetStateAction<"youth" | "official">) => void;
  setAdminMerchDesc: (value: React.SetStateAction<string>) => void;
  setAdminMerchFile: (value: React.SetStateAction<File | null>) => void;
  setAdminMerchName: (value: React.SetStateAction<string>) => void;
  setAdminMerchPrice: (value: React.SetStateAction<string>) => void;
  setAdminMerchSizes: (value: React.SetStateAction<string>) => void;
  setAdminMerchStockStatus: (value: React.SetStateAction<string>) => void;
  setAdminMerchType: (value: React.SetStateAction<string>) => void;
  setAdminNewsContent: (value: React.SetStateAction<string>) => void;
  setAdminNewsFile: (value: React.SetStateAction<File | null>) => void;
  setAdminNewsSummary: (value: React.SetStateAction<string>) => void;
  setAdminNewsTitle: (value: React.SetStateAction<string>) => void;
  setAdminOpponent: (value: React.SetStateAction<string>) => void;
  setAdminOpponentLogoFile: (value: React.SetStateAction<File | null>) => void;
  setAdminOpponentLogoUrl: (value: React.SetStateAction<string>) => void;
  setAdminPanelView: (value: React.SetStateAction<"content" | "inbox" | "orders" | "members">) => void;
  setAdminPassword: (value: React.SetStateAction<string>) => void;
  setAdminPlayerApps: (value: React.SetStateAction<string>) => void;
  setAdminPlayerAssists: (value: React.SetStateAction<string>) => void;
  setAdminPlayerBio: (value: React.SetStateAction<string>) => void;
  setAdminPlayerFile: (value: React.SetStateAction<File | null>) => void;
  setAdminPlayerGoals: (value: React.SetStateAction<string>) => void;
  setAdminPlayerJersey: (value: React.SetStateAction<string>) => void;
  setAdminPlayerName: (value: React.SetStateAction<string>) => void;
  setAdminPlayerPos: (value: React.SetStateAction<string>) => void;
  setAdminReplyDraft: (value: React.SetStateAction<string>) => void;
  setAdminResetCode: (value: React.SetStateAction<string>) => void;
  setAdminResetConfirmPassword: (value: React.SetStateAction<string>) => void;
  setAdminResetNewPassword: (value: React.SetStateAction<string>) => void;
  setAdminResetPhone: (value: React.SetStateAction<string>) => void;
  setAdminResetStep: (value: React.SetStateAction<"request" | "confirm">) => void;
  setAdminSquadTeam: (value: React.SetStateAction<string>) => void;
  setAdminStatus: (value: React.SetStateAction<string>) => void;
  setAdminVenue: (value: React.SetStateAction<string>) => void;
  setBulkPhotoFiles: (value: React.SetStateAction<Record<string, File>>) => void;
  setBulkPhotosOpen: (value: React.SetStateAction<boolean>) => void;
  setEditingFixtureId: (value: React.SetStateAction<number | null>) => void;
  setListedShopItemsOpen: (value: React.SetStateAction<boolean>) => void;
  setManagementPanelOpen: (value: React.SetStateAction<boolean>) => void;
  setManagementUpdatesOpen: (value: React.SetStateAction<boolean>) => void;
  setMembershipFilter: (value: React.SetStateAction<AdminMembershipStatus | "all">) => void;
  setMembershipSearch: (value: React.SetStateAction<string>) => void;
  setMerchAdminPriceDrafts: (value: React.SetStateAction<Record<number, string>>) => void;
  setNewsPreviewOpen: (value: React.SetStateAction<boolean>) => void;
  setNewspaperLoginPassword: (value: React.SetStateAction<string>) => void;
  setNewspaperResetAdminPassword: (value: React.SetStateAction<string>) => void;
  setNewspaperResetConfirmPassword: (value: React.SetStateAction<string>) => void;
  setNewspaperResetNewPassword: (value: React.SetStateAction<string>) => void;
  setOrderFilter: (value: React.SetStateAction<"pending" | "failed" | "all" | "paid">) => void;
  setOrderSearch: (value: React.SetStateAction<string>) => void;
  setPlayerPanelOpen: (value: React.SetStateAction<boolean>) => void;
  setPublishedHighlightsOpen: (value: React.SetStateAction<boolean>) => void;
  setShowAdminPasswordReset: (value: React.SetStateAction<boolean>) => void;
  setShowArchivedOrders: (value: React.SetStateAction<boolean>) => void;
  setShowNewspaperPasswordReset: (value: React.SetStateAction<boolean>) => void;
  setSquadUpdatesOpen: (value: React.SetStateAction<boolean>) => void;
  setStaffLoginMode: (value: React.SetStateAction<"admin" | "press">) => void;
  showAdminPasswordReset: boolean;
  showArchivedOrders: boolean;
  showNewspaperPasswordReset: boolean;
  showToast: (text: string, type?: "success" | "error") => void;
  squadPlayersSorted: Player[];
  squadUpdatesOpen: boolean;
  staffLoginMode: "admin" | "press";
  updatingManagementNameId: number | null;
  updatingManagementRoleId: number | null;
  updatingOrderId: number | null;
  updatingPlayerJerseyId: number | null;
  updatingPlayerNameId: number | null;
  updatingPlayerPositionId: number | null;
  visibleAdminMemberships: { id: number; customerId: number; fullName: string; phoneNumber: string; planId: string; planName: string; amount: number; paymentMethod: string; paymentStatus: string; status: AdminMembershipStatus; mpesaReceiptNumber: string | null; expiresAt: string; createdAt: string; }[];
}

export default function AdminPanel(props: AdminPanelProps) {
  const {
    activeTab,
    adminArchivedOrders,
    adminAwayScore,
    adminBusy,
    adminGalleryCaption,
    adminGalleryCategory,
    adminGalleryFile,
    adminGalleryPreview,
    adminHighlightCategory,
    adminHighlightDescription,
    adminHighlightThumbPreview,
    adminHighlightTitle,
    adminHighlightVideoFile,
    adminHighlightVideoPreview,
    adminHomeScore,
    adminInboxMessages,
    adminInboxThreads,
    adminIsHome,
    adminManagementBio,
    adminManagementCategory,
    adminManagementFile,
    adminManagementName,
    adminManagementOrder,
    adminManagementPosition,
    adminManagementResponsibilities,
    adminMatchDate,
    adminMatchTime,
    adminMatchType,
    adminMemberName,
    adminMemberPhone,
    adminMemberPlanId,
    adminMembershipStats,
    adminMerchDesc,
    adminMerchFile,
    adminMerchName,
    adminMerchPrice,
    adminMerchSizes,
    adminMerchStockStatus,
    adminMerchType,
    adminNewsContent,
    adminNewsFile,
    adminNewsSummary,
    adminNewsTitle,
    adminOpponent,
    adminOpponentLogoFile,
    adminOpponentLogoUrl,
    adminOrderStats,
    adminOrders,
    adminPanelView,
    adminPassword,
    adminPlayerApps,
    adminPlayerAssists,
    adminPlayerBio,
    adminPlayerFile,
    adminPlayerGoals,
    adminPlayerJersey,
    adminPlayerName,
    adminPlayerPos,
    adminReplyDraft,
    adminResetCode,
    adminResetConfirmPassword,
    adminResetNewPassword,
    adminResetPhone,
    adminResetStep,
    adminRole,
    adminSquadTeam,
    adminStatus,
    adminUnseenOrderCount,
    adminVenue,
    bulkPhotosOpen,
    clubData,
    editingFixtureId,
    editingManagementId,
    editingPlayerId,
    fixtureGroups,
    handleAddAdminMembership,
    handleAddMerchandise,
    handleAdminAddFixture,
    handleAdminAddGallery,
    handleAdminAddHighlight,
    handleAdminAddManagement,
    handleAdminAddPlayer,
    handleAdminCompleteReset,
    handleAdminEditPlayer,
    handleAdminLogin,
    handleAdminReply,
    handleAdminRequestReset,
    handleAdminUpdateFixture,
    handleAdminUpdateManagement,
    handleAdminUpdatePlayer,
    handleArchiveOrder,
    handleBulkPassportUploads,
    handleCancelManagementEdit,
    handleClearAllMerchandise,
    handleDeleteHighlight,
    handleDeleteMerchandise,
    handleEditFixture,
    handleMarkOrderCashPaid,
    handleNewspaperLogin,
    handleNewspaperPasswordReset,
    handleRestoreOrder,
    handleRevokeMembership,
    handleUpdateManagementName,
    handleUpdateManagementRole,
    handleUpdateMerchandiseCategory,
    handleUpdateMerchandisePrice,
    handleUpdateMerchandiseStockStatus,
    handleUpdateOrderStatus,
    handleUpdatePlayerJersey,
    handleUpdatePlayerName,
    handleUpdatePlayerPosition,
    hasRealPassportPhoto,
    isAdminAuthenticated,
    isAdminResetPending,
    isLoadingAdminInbox,
    isLoadingMemberships,
    isLoadingOrders,
    isNewspaperResetPending,
    isPending,
    isSendingAdminReply,
    listedShopItemsOpen,
    loadAdminInboxThread,
    loadAdminInboxThreads,
    loadAdminMemberships,
    loadAdminOrders,
    logoutAdminSession,
    managementMembersSorted,
    managementPanelOpen,
    managementUpdatesOpen,
    membershipFilter,
    membershipSearch,
    merchAdminPriceDrafts,
    newspaperLoginPassword,
    newspaperResetAdminPassword,
    newspaperResetConfirmPassword,
    newspaperResetNewPassword,
    notificationConfig,
    orderFilter,
    orderSearch,
    playerPanelOpen,
    publishedHighlightsOpen,
    resetAdminPlayerForm,
    returnToSignIn,
    revokingMembershipId,
    selectedInboxCustomer,
    selectedInboxCustomerId,
    setActiveHighlight,
    setAdminAwayScore,
    setAdminGalleryCaption,
    setAdminGalleryCategory,
    setAdminGalleryFile,
    setAdminGalleryPreview,
    setAdminHighlightCategory,
    setAdminHighlightDescription,
    setAdminHighlightThumbFile,
    setAdminHighlightThumbPreview,
    setAdminHighlightTitle,
    setAdminHighlightVideoFile,
    setAdminHighlightVideoPreview,
    setAdminHomeScore,
    setAdminIsHome,
    setAdminManagementBio,
    setAdminManagementCategory,
    setAdminManagementFile,
    setAdminManagementName,
    setAdminManagementOrder,
    setAdminManagementPosition,
    setAdminManagementResponsibilities,
    setAdminMatchDate,
    setAdminMatchTime,
    setAdminMatchType,
    setAdminMemberName,
    setAdminMemberPhone,
    setAdminMemberPlanId,
    setAdminMerchDesc,
    setAdminMerchFile,
    setAdminMerchName,
    setAdminMerchPrice,
    setAdminMerchSizes,
    setAdminMerchStockStatus,
    setAdminMerchType,
    setAdminNewsContent,
    setAdminNewsFile,
    setAdminNewsSummary,
    setAdminNewsTitle,
    setAdminOpponent,
    setAdminOpponentLogoFile,
    setAdminOpponentLogoUrl,
    setAdminPanelView,
    setAdminPassword,
    setAdminPlayerApps,
    setAdminPlayerAssists,
    setAdminPlayerBio,
    setAdminPlayerFile,
    setAdminPlayerGoals,
    setAdminPlayerJersey,
    setAdminPlayerName,
    setAdminPlayerPos,
    setAdminReplyDraft,
    setAdminResetCode,
    setAdminResetConfirmPassword,
    setAdminResetNewPassword,
    setAdminResetPhone,
    setAdminResetStep,
    setAdminSquadTeam,
    setAdminStatus,
    setAdminVenue,
    setBulkPhotoFiles,
    setBulkPhotosOpen,
    setEditingFixtureId,
    setListedShopItemsOpen,
    setManagementPanelOpen,
    setManagementUpdatesOpen,
    setMembershipFilter,
    setMembershipSearch,
    setMerchAdminPriceDrafts,
    setNewsPreviewOpen,
    setNewspaperLoginPassword,
    setNewspaperResetAdminPassword,
    setNewspaperResetConfirmPassword,
    setNewspaperResetNewPassword,
    setOrderFilter,
    setOrderSearch,
    setPlayerPanelOpen,
    setPublishedHighlightsOpen,
    setShowAdminPasswordReset,
    setShowArchivedOrders,
    setShowNewspaperPasswordReset,
    setSquadUpdatesOpen,
    setStaffLoginMode,
    showAdminPasswordReset,
    showArchivedOrders,
    showNewspaperPasswordReset,
    showToast,
    squadPlayersSorted,
    squadUpdatesOpen,
    staffLoginMode,
    updatingManagementNameId,
    updatingManagementRoleId,
    updatingOrderId,
    updatingPlayerJerseyId,
    updatingPlayerNameId,
    updatingPlayerPositionId,
    visibleAdminMemberships,
  } = props;

  return (
    <>
        {activeTab === "admin" && (
          <div className="space-y-8" data-admin-panel>

            {!isAdminAuthenticated ? (
              <div className="max-w-xl mx-auto space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-5">
                  <div className="space-y-1 pb-1 border-b border-slate-100">
                    <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
                      <User className="w-5 h-5 text-emerald-600" />
                      Staff Sign In
                    </h3>
                    <p className="text-sm text-slate-600">
                      Admin and press accounts only. Enter your password to continue.
                    </p>
                  </div>

                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setStaffLoginMode("admin")}
                      className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                        staffLoginMode === "admin"
                          ? "bg-white text-slate-950 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffLoginMode("press")}
                      className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                        staffLoginMode === "press"
                          ? "bg-white text-slate-950 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Press
                    </button>
                  </div>

                  {staffLoginMode === "admin" ? (
                    <form onSubmit={handleAdminLogin} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Password
                        </label>
                        <PasswordInput
                          value={adminPassword}
                          onChange={setAdminPassword}
                          placeholder="Enter your password"
                          required
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 pr-11"
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
                    <form onSubmit={handleNewspaperLogin} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Press Account Password
                        </label>
                        <PasswordInput
                          value={newspaperLoginPassword}
                          onChange={setNewspaperLoginPassword}
                          placeholder="Enter the press account password"
                          required
                          className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 pr-11"
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
                  )}

                  {staffLoginMode === "admin" && (
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
                      {showAdminPasswordReset ? "Hide password reset" : "Forgot your password?"}
                    </button>
                  )}
                </div>

                {staffLoginMode === "admin" && showAdminPasswordReset && (
                  <div className="bg-white rounded-3xl border border-yellow-200 shadow-sm p-6 sm:p-8 space-y-5">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-slate-950 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        Reset Password
                      </h3>
                      <p className="text-sm text-slate-600">
                        Enter your phone number to receive a reset code by SMS.
                      </p>
                    </div>

                    {adminResetStep === "request" ? (
                      <form onSubmit={handleAdminRequestReset} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Phone Number
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
            ) : (
              <div className="space-y-8">
                {/* Admin Status Header */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-yellow-400/10" />
                  <div className="absolute -top-24 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
                  <div className="relative z-10 p-6 sm:p-10 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-600/90 text-white text-[9px] font-black uppercase tracking-widest">
                        <Shield className="w-3.5 h-3.5" />
                        {adminRole === "news_editor" ? "Press Partner" : "Club Administrator"}
                      </span>
                      <button
                        onClick={async () => {
                          const wasPressAccount = adminRole === "news_editor";
                          await logoutAdminSession();
                          returnToSignIn();
                          showToast(
                            wasPressAccount
                              ? "Press account signed out."
                              : "Admin signed out."
                          );
                        }}
                        className="inline-flex items-center gap-2 border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {adminRole === "news_editor" ? "Sign Out" : "Sign Out"}
                      </button>
                    </div>

                    <div className="space-y-2 max-w-2xl">
                      <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                        {adminRole === "news_editor" ? (
                          <>
                            Press <span className="text-yellow-400">News Portal</span>
                          </>
                        ) : (
                          <>
                            Manager <span className="text-yellow-400">Dashboard</span>
                          </>
                        )}
                      </h2>
                      <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                        {adminRole === "news_editor"
                          ? "Publish official team news and match reports for Kariobangi Legends FC."
                          : "Manage the squad, fixtures, shop, news, and fan activity from one place."}
                      </p>
                    </div>

                    {adminRole !== "news_editor" && (
                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/10">
                        <div>
                          <p className="text-2xl font-black text-white">{adminUnseenOrderCount}</p>
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
                            New Orders
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-white">
                            {adminInboxThreads.reduce((sum, thread) => sum + thread.unreadCount, 0)}
                          </p>
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
                            Unread Messages
                          </p>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-white">{adminMembershipStats.activeCount}</p>
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
                            Active Members
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Auto sign-out after 5 minutes with no mouse, keyboard, or scroll activity.
                    </div>
                  </div>
                </div>

                {adminRole !== "news_editor" && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPanelView("content");
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
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                      adminPanelView === "orders"
                        ? "bg-slate-950 text-yellow-400 shadow-md"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Orders
                    {adminUnseenOrderCount > 0 && (
                      <span className="min-w-5 h-5 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                        {adminUnseenOrderCount}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPanelView("members");
                      loadAdminMemberships();
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 ${
                      adminPanelView === "members"
                        ? "bg-slate-950 text-yellow-400 shadow-md"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    Members
                    {adminMembershipStats.activeCount > 0 && (
                      <span className="min-w-5 h-5 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                        {adminMembershipStats.activeCount}
                      </span>
                    )}
                  </button>
                </div>
                )}

                {adminPanelView === "content" && (
                  <>
                <div className={`grid grid-cols-1 ${adminRole === "news_editor" ? "max-w-2xl" : "lg:grid-cols-2"} gap-8 items-start`}>
                  {adminRole !== "news_editor" ? (
                  <>
                  <div className="space-y-8 min-w-0">
                  {/* Action 1: Squad Players */}
                  <AdminCollapsibleSection
                    variant="panel"
                    title={editingPlayerId ? "Edit Squad Player" : "Squad Players"}
                    description={`Add new players and update the squad. Photos up to ${MEDIA_UPLOAD_RULES.maxFileSizeLabel} each.`}
                    closedDescription="Open this panel to add players or update names, jersey numbers, and squad sections."
                    isOpen={playerPanelOpen}
                    onToggle={() => setPlayerPanelOpen((open) => !open)}
                    icon={UserPlus}
                    badge={
                      squadPlayersSorted.length > 0 ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                          {squadPlayersSorted.length} in squad
                        </span>
                      ) : undefined
                    }
                  >
                    <form
                      onSubmit={
                        editingPlayerId ? handleAdminUpdatePlayer : handleAdminAddPlayer
                      }
                      className="space-y-3 text-xs"
                    >
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
                        <label className="font-bold text-slate-500">Passport Photo (optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAdminPlayerFile(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-950 file:text-yellow-400 hover:file:bg-slate-800 cursor-pointer"
                        />
                        <p className="text-[9px] text-slate-400">Portrait headshot works best — cards crop to a professional passport frame.</p>
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
                        disabled={adminBusy === "player"}
                        className="w-full bg-slate-950 text-yellow-400 font-bold py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer disabled:opacity-50"
                      >
                        {adminBusy === "player"
                          ? editingPlayerId
                            ? "Updating Player..."
                            : "Adding Player..."
                          : editingPlayerId
                            ? "Update Player"
                            : "Insert Player into PostgreSQL"}
                      </button>

                      {editingPlayerId && (
                        <button
                          type="button"
                          onClick={resetAdminPlayerForm}
                          className="w-full border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-50 transition cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </form>

                    {squadPlayersSorted.length > 0 && (
                      <AdminCollapsibleSection
                        title="Update Squad Players"
                        description="Edit player names, jersey numbers, and squad sections."
                        closedDescription="Open this panel to update names, jersey numbers, and squad sections for existing players."
                        isOpen={squadUpdatesOpen}
                        onToggle={() => setSquadUpdatesOpen((open) => !open)}
                        icon={Users}
                        badge={
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {squadPlayersSorted.length} player
                            {squadPlayersSorted.length !== 1 ? "s" : ""}
                          </span>
                        }
                      >
                        <div
                          className="space-y-2 max-h-72 overflow-y-auto pr-1"
                          onKeyDown={preventAdminListScrollChaining}
                        >
                          {squadPlayersSorted.map((player) => {
                            const positionInOptions = SQUAD_POSITION_OPTIONS.some(
                              (option) => option.value === player.position
                            );

                            return (
                              <div
                                key={player.id}
                                className="flex flex-col gap-2 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70"
                              >
                                <input
                                  type="text"
                                  defaultValue={player.name}
                                  key={`admin-name-${player.id}-${player.name}`}
                                  disabled={updatingPlayerNameId === player.id}
                                  onBlur={(e) => {
                                    const next = e.target.value.trim();
                                    if (next && next !== player.name) {
                                      void handleUpdatePlayerName(player.id, next);
                                    }
                                  }}
                                  className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-900 disabled:opacity-50"
                                  aria-label={`Name for player #${player.jerseyNumber}`}
                                />
                                <p className="text-[10px] text-slate-500 font-semibold">
                                  Currently: {getSquadPositionBadge(player.position)}
                                  {!positionInOptions && ` · ${player.position}`}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    defaultValue={player.jerseyNumber}
                                    key={`admin-jersey-${player.id}-${player.jerseyNumber}`}
                                    disabled={updatingPlayerJerseyId === player.id}
                                    onBlur={(e) => {
                                      const next = parseInt(e.target.value, 10);
                                      if (
                                        Number.isInteger(next) &&
                                        next > 0 &&
                                        next !== player.jerseyNumber
                                      ) {
                                        void handleUpdatePlayerJersey(player.id, next);
                                      }
                                    }}
                                    className="w-full sm:w-20 p-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 disabled:opacity-50"
                                    aria-label={`Jersey number for ${player.name}`}
                                  />
                                  <select
                                    value={player.position}
                                    onChange={(e) =>
                                      handleUpdatePlayerPosition(player.id, e.target.value)
                                    }
                                    disabled={updatingPlayerPositionId === player.id}
                                    className="w-full sm:flex-1 p-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 disabled:opacity-50"
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
                                  <button
                                    type="button"
                                    onClick={() => handleAdminEditPlayer(player)}
                                    className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 bg-white text-[10px] font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 cursor-pointer"
                                  >
                                    Full Edit
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AdminCollapsibleSection>
                    )}
                  </AdminCollapsibleSection>

                  <AdminCollapsibleSection
                    variant="panel"
                    title="Missing Passport Photos"
                    description="Assign a photo to each player or official who still has an empty card, then upload them together."
                    closedDescription="Open to upload missing squad and management photos in one place."
                    isOpen={bulkPhotosOpen}
                    onToggle={() => setBulkPhotosOpen((open) => !open)}
                    icon={Camera}
                    badge={
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">
                        {clubData.players.filter((player) => !hasRealPassportPhoto(player.imageUrl)).length +
                          clubData.management.filter((member) => !hasRealPassportPhoto(member.imageUrl)).length}{" "}
                        missing
                      </span>
                    }
                  >
                    <div className="space-y-6 text-xs">
                      <div className="space-y-3">
                        <p className="font-black uppercase tracking-wider text-slate-500">Squad without photos</p>
                        {clubData.players.filter((player) => !hasRealPassportPhoto(player.imageUrl)).length === 0 ? (
                          <p className="text-slate-500">Every player has a passport photo.</p>
                        ) : (
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {clubData.players
                              .filter((player) => !hasRealPassportPhoto(player.imageUrl))
                              .map((player) => (
                                <label
                                  key={player.id}
                                  className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5"
                                >
                                  <span className="min-w-0 flex-1 font-semibold text-slate-800">
                                    #{player.jerseyNumber} {player.name}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      setBulkPhotoFiles((prev) => {
                                        const next = { ...prev };
                                        if (file) next[`player-${player.id}`] = file;
                                        else delete next[`player-${player.id}`];
                                        return next;
                                      });
                                    }}
                                    className="text-[11px] file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-1.5 file:text-[10px] file:font-bold file:text-yellow-400"
                                  />
                                </label>
                              ))}
                          </div>
                        )}
                        <button
                          type="button"
                          disabled={adminBusy === "bulk-photos"}
                          onClick={() => handleBulkPassportUploads("player")}
                          className="w-full rounded-xl bg-slate-950 py-2.5 font-bold uppercase tracking-wider text-yellow-400 disabled:opacity-50"
                        >
                          {adminBusy === "bulk-photos" ? "Uploading..." : "Upload squad photos"}
                        </button>
                      </div>

                      <div className="space-y-3">
                        <p className="font-black uppercase tracking-wider text-slate-500">Management without photos</p>
                        {clubData.management.filter((member) => !hasRealPassportPhoto(member.imageUrl)).length === 0 ? (
                          <p className="text-slate-500">Every official has a passport photo.</p>
                        ) : (
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {clubData.management
                              .filter((member) => !hasRealPassportPhoto(member.imageUrl))
                              .map((member) => (
                                <label
                                  key={member.id}
                                  className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5"
                                >
                                  <span className="min-w-0 flex-1 font-semibold text-slate-800">
                                    {member.name} · {member.position}
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      setBulkPhotoFiles((prev) => {
                                        const next = { ...prev };
                                        if (file) next[`management-${member.id}`] = file;
                                        else delete next[`management-${member.id}`];
                                        return next;
                                      });
                                    }}
                                    className="text-[11px] file:mr-3 file:rounded-lg file:border-0 file:bg-slate-950 file:px-3 file:py-1.5 file:text-[10px] file:font-bold file:text-yellow-400"
                                  />
                                </label>
                              ))}
                          </div>
                        )}
                        <button
                          type="button"
                          disabled={adminBusy === "bulk-photos"}
                          onClick={() => handleBulkPassportUploads("management")}
                          className="w-full rounded-xl bg-slate-950 py-2.5 font-bold uppercase tracking-wider text-yellow-400 disabled:opacity-50"
                        >
                          {adminBusy === "bulk-photos" ? "Uploading..." : "Upload management photos"}
                        </button>
                      </div>
                    </div>
                  </AdminCollapsibleSection>

                  {/* Action 3: Club Management */}
                  <AdminCollapsibleSection
                    variant="panel"
                    title={
                      editingManagementId
                        ? "Edit Management Official"
                        : "Club Management"
                    }
                    description={`Add or edit officials — chairman, coaches, and more. Photos up to ${MEDIA_UPLOAD_RULES.maxFileSizeLabel} each.`}
                    closedDescription="Open this panel to add officials or update management roles and departments."
                    isOpen={managementPanelOpen}
                    onToggle={() => setManagementPanelOpen((open) => !open)}
                    icon={Shield}
                    badge={
                      managementMembersSorted.length > 0 ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                          {managementMembersSorted.length} official
                          {managementMembersSorted.length !== 1 ? "s" : ""}
                        </span>
                      ) : undefined
                    }
                  >
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
      Passport Photo
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
    <p className="text-[9px] text-slate-400">Upload a clear portrait headshot for the official passport-style card.</p>

    {adminManagementFile && (
      <p className="text-[10px] text-emerald-600 font-semibold">
        Selected: {adminManagementFile.name}
      </p>
    )}
  </div>


  {/* ================= SUBMIT ================= */}
  <button
    type="submit"
    disabled={adminBusy === "management"}
    className="w-full bg-slate-950 text-yellow-400 font-bold py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer disabled:opacity-50"
  >
    {adminBusy === "management"
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
  <AdminCollapsibleSection
    title="Quick Role Updates"
    description="Edit official names and move them between departments and roles."
    closedDescription="Open this panel to quickly edit names, roles, and departments."
    isOpen={managementUpdatesOpen}
    onToggle={() => setManagementUpdatesOpen((open) => !open)}
    icon={Shield}
    badge={
      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
        {managementMembersSorted.length} official
        {managementMembersSorted.length !== 1 ? "s" : ""}
      </span>
    }
  >
    <div
      className="space-y-2 max-h-72 overflow-y-auto pr-1"
      onKeyDown={preventAdminListScrollChaining}
    >
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
            <input
              type="text"
              defaultValue={member.name}
              key={`mgmt-name-${member.id}-${member.name}`}
              disabled={updatingManagementNameId === member.id}
              onBlur={(e) => {
                const next = e.target.value.trim();
                if (next && next !== member.name) {
                  void handleUpdateManagementName(member.id, next);
                }
              }}
              className="w-full p-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-900 disabled:opacity-50"
              aria-label={`Name for ${member.position}`}
            />
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
  </AdminCollapsibleSection>
)}
                  </AdminCollapsibleSection>


                  </div>
                  <div className="space-y-8 min-w-0">
                  {/* Action 2: Add Fixture (Dynamically updates upcoming games) */}
                  <div
                    id="admin-fixture-form"
                    className={`bg-white p-6 rounded-3xl border shadow-sm space-y-4 scroll-mt-28 ${
                      editingFixtureId
                        ? "border-yellow-400 ring-2 ring-yellow-400/30"
                        : "border-slate-100"
                    }`}
                  >
                    <h3 className="font-bold text-base text-slate-950 flex items-center gap-1.5">
                      <Calendar className="w-5 h-5 text-yellow-500" /> Log / Update Match Game
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Instantly updates the upcoming match banner on the Home page and the Match Center. Set kick-off time here so fans see the clock.
                    </p>
                    {editingFixtureId ? (
                      <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-3 py-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-bold text-slate-800">
                          Editing existing match{adminOpponent ? `: ${adminOpponent}` : ""}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFixtureId(null);
                            setAdminOpponent("");
                            setAdminMatchDate("");
                            setAdminMatchTime("");
                            setAdminHomeScore("");
                            setAdminAwayScore("");
                            setAdminOpponentLogoFile(null);
                            setAdminOpponentLogoUrl("");
                            setAdminStatus("upcoming");
                            setAdminMatchType("league");
                          }}
                          className="text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-rose-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : null}
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

                        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-3 space-y-2">
                          <label className="font-black text-slate-800 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            Kick-off time
                          </label>
                          <p className="text-[10px] text-slate-600">
                            Fans see this on Home and Match Centre, and the countdown uses it.
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={adminMatchTime ? adminMatchTime.split(":")[0] || "" : ""}
                              onChange={(e) => {
                                const hour = e.target.value;
                                if (!hour) {
                                  setAdminMatchTime("");
                                  return;
                                }
                                const minute = adminMatchTime.split(":")[1] || "00";
                                setAdminMatchTime(`${hour}:${minute}`);
                              }}
                              className="w-full p-2.5 rounded-lg border border-yellow-300 bg-white text-sm font-bold"
                              aria-label="Kick-off hour"
                            >
                              <option value="">Hour</option>
                              {Array.from({ length: 13 }, (_, index) => {
                                const hour = String(index + 8).padStart(2, "0");
                                return (
                                  <option key={hour} value={hour}>
                                    {hour}
                                  </option>
                                );
                              })}
                            </select>
                            <select
                              value={adminMatchTime ? adminMatchTime.split(":")[1] || "" : ""}
                              onChange={(e) => {
                                const minute = e.target.value;
                                if (!minute) {
                                  setAdminMatchTime("");
                                  return;
                                }
                                const hour = adminMatchTime.split(":")[0] || "15";
                                setAdminMatchTime(`${hour}:${minute}`);
                              }}
                              className="w-full p-2.5 rounded-lg border border-yellow-300 bg-white text-sm font-bold"
                              aria-label="Kick-off minute"
                            >
                              <option value="">Minute</option>
                              {(() => {
                                const currentMinute = adminMatchTime.split(":")[1] || "";
                                const minutes = ["00", "15", "30", "45"];
                                if (currentMinute && !minutes.includes(currentMinute)) {
                                  minutes.unshift(currentMinute);
                                }
                                return minutes.map((minute) => (
                                  <option key={minute} value={minute}>
                                    {minute}
                                  </option>
                                ));
                              })()}
                            </select>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {["14:00", "15:00", "15:30", "16:00"].map((time) => (
                              <button
                                key={time}
                                type="button"
                                onClick={() => setAdminMatchTime(time)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                                  adminMatchTime === time
                                    ? "bg-slate-950 text-yellow-400"
                                    : "bg-white border border-yellow-300 text-slate-700 hover:bg-yellow-100"
                                }`}
                              >
                                {time}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setAdminMatchTime("")}
                              className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-500 hover:text-rose-600 cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>

                      {adminMatchDate && (
                        <p className="text-[10px] text-slate-500">
                          Scheduled for{" "}
                          <span className="font-bold text-slate-700">
                            {formatKickoff(combineFixtureDateTime(adminMatchDate, adminMatchTime))}
                            {!adminMatchTime ? " · time TBC" : ""}
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
                                <Image
                                  src={adminOpponentLogoUrl}
                                  alt="Current opponent logo"
                                  width={48}
                                  height={48}
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
                          <label className="font-bold text-slate-500">Squad Team</label>
                          <select
                            value={adminSquadTeam}
                            onChange={(e) => setAdminSquadTeam(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                          >
                            {SQUAD_TEAMS.map((team) => (
                              <option key={team.value} value={team.value}>
                                {team.label}
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-slate-500">
                            Wazee Legends fixtures show in their own section, separate from the first team.
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
                          <p className="text-[10px] text-slate-500">
                            Leave as Upcoming — the site auto-switches it to Live at kick-off, then
                            Full Time 120 minutes later. Only change this manually for Postponed/Cancelled,
                            or to confirm the final score early.
                          </p>
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
                        disabled={adminBusy === "fixture"}
                        className="w-full bg-slate-950 text-yellow-400 font-bold py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer disabled:opacity-50"
                      >
                       {adminBusy === "fixture"
  ? editingFixtureId
    ? "Updating Match..."
    : "Adding Fixture..."
  : editingFixtureId
    ? "Update Match Result"
    : "Save Match Fixture"}
                      </button>
                    </form>

                    {clubData.fixtures.length > 0 && (
                      <div className="space-y-3 border-t border-slate-100 pt-4">
                        <div>
                          <h4 className="font-black text-sm text-slate-950">Existing matches</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Pick a match to set or change kick-off time. The next match is at the top.
                          </p>
                        </div>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {[...clubData.fixtures]
                            .sort((a, b) => {
                              const aUpcoming = !isFixtureFinished(a);
                              const bUpcoming = !isFixtureFinished(b);
                              if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
                              return aUpcoming
                                ? a.date.localeCompare(b.date)
                                : b.date.localeCompare(a.date);
                            })
                            .map((fixture) => {
                              const isEditing = editingFixtureId === fixture.id;
                              const timeSet = hasKickoffTime(fixture.date);
                              return (
                                <div
                                  key={fixture.id}
                                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border px-3 py-2.5 ${
                                    isEditing
                                      ? "border-yellow-400 bg-yellow-50"
                                      : "border-slate-100 bg-slate-50"
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-950 truncate flex items-center gap-1.5">
                                      {fixture.opponent}
                                      {normalizeSquadTeam(fixture.squadTeam) === "wazee" && (
                                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[8px] font-black uppercase tracking-wider">
                                          Wazee
                                        </span>
                                      )}
                                      {fixtureGroups.nextMatch?.id === fixture.id
                                        ? " · Next match"
                                        : ""}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                      {formatKickoff(fixture.date)}
                                      {!timeSet ? " · time TBC" : ""}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleEditFixture(fixture)}
                                    className="shrink-0 inline-flex items-center justify-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-yellow-400 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                    {timeSet ? "Edit time" : "Set time"}
                                  </button>
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
                        disabled={adminBusy === "gallery" || !adminGalleryFile}
                        className="w-full bg-slate-950 text-yellow-400 font-bold py-3 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-950/10"
                      >
                        {adminBusy === "gallery" ? "Uploading Image..." : "Publish to Gallery"}
                      </button>
                    </form>
                  </div>

                  {/* Action 4: Upload Team Highlight Video */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5 overflow-hidden">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-base text-slate-950 flex items-center gap-1.5">
                          <Film className="w-5 h-5 text-yellow-500" /> Upload Team Highlight Video
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Upload match clips, goals, and skills directly from your PC or phone. No YouTube links needed.
                        </p>
                      </div>
                      <span className="shrink-0 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 text-[9px] font-black uppercase tracking-wider">
                        Video
                      </span>
                    </div>

                    <form onSubmit={handleAdminAddHighlight} className="space-y-4 text-xs">
                      <div className="space-y-2">
                        <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          Highlight Video
                        </label>
                        <label
                          htmlFor="admin-highlight-video-upload"
                          className={`relative block rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
                            adminHighlightVideoPreview
                              ? "border-yellow-300 bg-slate-950"
                              : "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-yellow-50/40 hover:border-yellow-300"
                          }`}
                        >
                          {adminHighlightVideoPreview ? (
                            <div className="relative aspect-video">
                              <video
                                src={adminHighlightVideoPreview}
                                controls
                                playsInline
                                className="w-full h-full object-contain bg-black"
                              />
                            </div>
                          ) : (
                            <div className="py-10 px-6 text-center">
                              <div className="w-14 h-14 rounded-2xl bg-white border border-yellow-100 flex items-center justify-center mx-auto mb-3 shadow-sm">
                                <Film className="w-7 h-7 text-yellow-600" />
                              </div>
                              <p className="font-black text-slate-800 text-sm">
                                Tap to choose a video
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1">
                                MP4, MOV, or WEBM from phone or PC (max {VIDEO_UPLOAD_RULES.maxFileSizeLabel})
                              </p>
                            </div>
                          )}
                          <input
                            id="admin-highlight-video-upload"
                            type="file"
                            accept={VIDEO_UPLOAD_RULES.acceptedTypes}
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              if (adminHighlightVideoPreview) {
                                URL.revokeObjectURL(adminHighlightVideoPreview);
                              }
                              setAdminHighlightVideoFile(file);
                              setAdminHighlightVideoPreview(file ? URL.createObjectURL(file) : null);
                            }}
                            className="sr-only"
                            required
                          />
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          Cover Photo (optional)
                        </label>
                        <label
                          htmlFor="admin-highlight-thumb-upload"
                          className="block rounded-xl border border-dashed border-slate-200 p-4 cursor-pointer hover:border-emerald-300 transition"
                        >
                          {adminHighlightThumbPreview ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={adminHighlightThumbPreview}
                              alt="Highlight cover preview"
                              className="max-h-32 mx-auto rounded-lg object-contain"
                            />
                          ) : (
                            <p className="text-center text-[11px] text-slate-500">
                              Optional thumbnail shown before play
                            </p>
                          )}
                          <input
                            id="admin-highlight-thumb-upload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              if (adminHighlightThumbPreview) {
                                URL.revokeObjectURL(adminHighlightThumbPreview);
                              }
                              setAdminHighlightThumbFile(file);
                              setAdminHighlightThumbPreview(file ? URL.createObjectURL(file) : null);
                            }}
                            className="sr-only"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                            Title
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Winning goal vs City Stars"
                            value={adminHighlightTitle}
                            onChange={(e) => setAdminHighlightTitle(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                            Category
                          </label>
                          <select
                            value={adminHighlightCategory}
                            onChange={(e) => setAdminHighlightCategory(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          >
                            {HIGHLIGHT_CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          Short Description
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Brief match or training context..."
                          value={adminHighlightDescription}
                          onChange={(e) => setAdminHighlightDescription(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={adminBusy === "highlights" || !adminHighlightVideoFile}
                        className="w-full bg-slate-950 text-yellow-400 font-bold py-3 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-950/10"
                      >
                        {adminBusy === "highlights" ? "Uploading Video..." : "Publish Highlight Video"}
                      </button>
                    </form>

                    {(clubData.highlights ?? []).length > 0 && (
                      <AdminCollapsibleSection
                        title="Published Highlights"
                        description="Review, preview, or remove highlight videos already live on the Media → Highlights page."
                        closedDescription="Open this panel to manage highlight videos already published on the site."
                        isOpen={publishedHighlightsOpen}
                        onToggle={() => setPublishedHighlightsOpen((open) => !open)}
                        icon={Film}
                        badge={
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {(clubData.highlights ?? []).length} video
                            {(clubData.highlights ?? []).length !== 1 ? "s" : ""}
                          </span>
                        }
                      >
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                          {(clubData.highlights ?? []).map((highlight) => (
                            <div
                              key={highlight.id}
                              className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/70"
                            >
                              <div className="relative w-full sm:w-28 aspect-video rounded-lg overflow-hidden bg-slate-950 shrink-0">
                                {isUploadedMediaUrl(highlight.thumbnailUrl) ? (
                                  <Image
                                    src={highlight.thumbnailUrl as string}
                                    alt={highlight.title}
                                    fill
                                    sizes="112px"
                                    className="object-cover"
                                  />
                                ) : isVideoMediaUrl(highlight.videoUrl) ? (
                                  <video
                                    src={highlight.videoUrl}
                                    muted
                                    playsInline
                                    preload="metadata"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Film className="w-5 h-5 text-yellow-400" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-bold text-xs text-slate-900 truncate">
                                    {highlight.title}
                                  </p>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-800 text-[9px] font-black uppercase tracking-wider">
                                    {highlight.category}
                                  </span>
                                </div>
                                {highlight.description && (
                                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                                    {highlight.description}
                                  </p>
                                )}
                                <p className="text-[10px] text-slate-400 font-semibold">
                                  {new Date(highlight.createdAt).toLocaleDateString("en-KE", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>

                              <div className="flex sm:flex-col gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setActiveHighlight(highlight)}
                                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-slate-950 text-yellow-400 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-900 cursor-pointer"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  Preview
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteHighlight(highlight.id, highlight.title)
                                  }
                                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-rose-600 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AdminCollapsibleSection>
                    )}
                  </div>

                  {/* Action 5: Add Merchandise to Shop */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-slate-950 flex items-center gap-1.5">
                          <ShoppingBag className="w-5 h-5 text-yellow-500" /> Add Jersey / Merch to Shop
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Upload product photos so fans can browse and buy via M-Pesa checkout.
                          {clubData.merchandise.length > 0
                            ? ` ${clubData.merchandise.length} item(s) currently listed.`
                            : " The shop is empty — add your first item below."}
                        </p>
                      </div>
                      {clubData.merchandise.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllMerchandise}
                          disabled={adminBusy === "merch-clear"}
                          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-100 transition cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {adminBusy === "merch-clear" ? "Clearing..." : "Clear All Shop Items"}
                        </button>
                      )}
                    </div>

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

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                          <label className="font-bold text-slate-500">Category</label>
                          <select
                            value={adminMerchType}
                            onChange={(e) => setAdminMerchType(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                          >
                            {MERCHANDISE_CATEGORIES.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Stock Status</label>
                          <select
                            value={adminMerchStockStatus}
                            onChange={(e) => setAdminMerchStockStatus(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                          >
                            {MERCHANDISE_STOCK_STATUSES.map((status) => (
                              <option key={status.id} value={status.id}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={adminBusy === "merch"}
                        className="w-full bg-slate-950 text-yellow-400 font-bold py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer disabled:opacity-50"
                      >
                        {adminBusy === "merch" ? "Adding Item..." : "Add to Fan Shop"}
                      </button>
                    </form>

                  </div>

                  {/* Action 4: Publish News */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-950 flex items-center gap-1.5">
                      <BookOpen className="w-5 h-5 text-emerald-600" /> Publish Official Club News
                    </h3>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!adminNewsTitle || !adminNewsSummary || !adminNewsContent) {
                          showToast("Fill the headline, summary, and article first.", "error");
                          return;
                        }
                        setNewsPreviewOpen(true);
                      }}
                      className="space-y-3 text-xs"
                    >
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
                        disabled={adminBusy === "news"}
                        className="w-full bg-slate-950 text-yellow-400 font-bold py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer disabled:opacity-50"
                      >
                        Preview & publish
                      </button>
                      <p className="text-[10px] text-slate-500 text-center">
                        Review the article before it goes live on the news feed.
                      </p>
                    </form>
                  </div>

                  </div>
                  </>
                  ) : (
                  <div className="space-y-8 min-w-0">
                  {/* Action 4: Publish News */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-950 flex items-center gap-1.5">
                      <BookOpen className="w-5 h-5 text-emerald-600" /> Publish Official Club News
                    </h3>
                    {adminRole === "news_editor" && (
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Submit match reports, press releases, and community updates. Other site sections remain locked for press accounts.
                      </p>
                    )}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!adminNewsTitle || !adminNewsSummary || !adminNewsContent) {
                          showToast("Fill the headline, summary, and article first.", "error");
                          return;
                        }
                        setNewsPreviewOpen(true);
                      }}
                      className="space-y-3 text-xs"
                    >
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
                        disabled={adminBusy === "news"}
                        className="w-full bg-slate-950 text-yellow-400 font-bold py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer disabled:opacity-50"
                      >
                        Preview & publish
                      </button>
                      <p className="text-[10px] text-slate-500 text-center">
                        Review the article before it goes live on the news feed.
                      </p>
                    </form>
                  </div>

                  </div>
                  )}

                </div>

                {adminRole !== "news_editor" && clubData.merchandise.length > 0 && (
                  <AdminCollapsibleSection
                    variant="panel"
                    title="Listed Shop Items"
                    description="Update category, stock status, and price for each product below."
                    closedDescription="Open this panel to move items between categories or edit stock and prices."
                    isOpen={listedShopItemsOpen}
                    onToggle={() => setListedShopItemsOpen((open) => !open)}
                    icon={ShoppingBag}
                    badge={
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                        {clubData.merchandise.length} item
                        {clubData.merchandise.length !== 1 ? "s" : ""}
                      </span>
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {clubData.merchandise.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col"
                        >
                          <MerchandiseAdminThumbnail item={item} />

                          <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col">
                            <div className="space-y-1">
                              <p className="text-base font-black text-slate-950 leading-snug">{item.name}</p>
                              <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                              <p className="text-sm font-bold text-emerald-700 pt-1">
                                Ksh {item.price.toLocaleString()}
                              </p>
                            </div>

                            <div className="space-y-3 mt-auto">
                              <div className="space-y-1.5">
                                <label
                                  htmlFor={`merch-category-${item.id}`}
                                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                                >
                                  Category
                                </label>
                                <select
                                  id={`merch-category-${item.id}`}
                                  value={normalizeMerchandiseCategory(item.kitType)}
                                  onChange={(e) =>
                                    handleUpdateMerchandiseCategory(item.id, e.target.value)
                                  }
                                  disabled={adminBusy === "merch-category"}
                                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                >
                                  {MERCHANDISE_CATEGORIES.map((category) => (
                                    <option key={category.id} value={category.id}>
                                      {category.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label
                                  htmlFor={`merch-stock-${item.id}`}
                                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                                >
                                  Stock Status
                                </label>
                                <select
                                  id={`merch-stock-${item.id}`}
                                  value={normalizeMerchandiseStockStatus(item.stockStatus)}
                                  onChange={(e) =>
                                    handleUpdateMerchandiseStockStatus(item.id, e.target.value)
                                  }
                                  disabled={adminBusy === "merch-stock"}
                                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                >
                                  {MERCHANDISE_STOCK_STATUSES.map((status) => (
                                    <option key={status.id} value={status.id}>
                                      {status.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label
                                  htmlFor={`merch-price-${item.id}`}
                                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-500"
                                >
                                  Price (Ksh)
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    id={`merch-price-${item.id}`}
                                    type="number"
                                    min={1}
                                    value={merchAdminPriceDrafts[item.id] ?? String(item.price)}
                                    onChange={(e) =>
                                      setMerchAdminPriceDrafts((prev) => ({
                                        ...prev,
                                        [item.id]: e.target.value,
                                      }))
                                    }
                                    className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateMerchandisePrice(
                                        item.id,
                                        merchAdminPriceDrafts[item.id] ?? String(item.price)
                                      )
                                    }
                                    disabled={adminBusy === "merch-price"}
                                    className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                                  >
                                    Update
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteMerchandise(item.id, item.name)}
                                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-100 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete Item
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AdminCollapsibleSection>
                )}

                {adminRole === "admin" && (
                  <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-6 sm:p-8 space-y-5 max-w-2xl">
                    <div className="space-y-1">
                      <h3 className="font-black text-lg text-slate-950 flex items-center gap-2">
                        <Newspaper className="w-5 h-5 text-emerald-600" />
                        Reset Newspaper Password
                      </h3>
                      <p className="text-sm text-slate-600">
                        Only club admins can change the press account password. Share the new password with authorized newspaper partners.
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-expanded={showNewspaperPasswordReset}
                      onClick={() => setShowNewspaperPasswordReset((open) => !open)}
                      className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 hover:text-emerald-800 cursor-pointer"
                    >
                      {showNewspaperPasswordReset
                        ? "Hide newspaper password reset"
                        : "Reset newspaper / press password"}
                    </button>

                    {showNewspaperPasswordReset && (
                      <form onSubmit={handleNewspaperPasswordReset} className="space-y-4 border-t border-slate-100 pt-5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Your Admin Password
                          </label>
                          <PasswordInput
                            value={newspaperResetAdminPassword}
                            onChange={setNewspaperResetAdminPassword}
                            placeholder="Confirm you are the club admin"
                            required
                            autoComplete="current-password"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              New Press Password
                            </label>
                            <PasswordInput
                              value={newspaperResetNewPassword}
                              onChange={setNewspaperResetNewPassword}
                              placeholder="At least 6 characters"
                              required
                              minLength={6}
                              autoComplete="new-password"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Confirm Press Password
                            </label>
                            <PasswordInput
                              value={newspaperResetConfirmPassword}
                              onChange={setNewspaperResetConfirmPassword}
                              placeholder="Confirm new press password"
                              required
                              minLength={6}
                              autoComplete="new-password"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={isNewspaperResetPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
                        >
                          {isNewspaperResetPending ? "Updating..." : "Update Press Password"}
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {adminRole !== "news_editor" && (
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
                    }}
                    className="shrink-0 bg-slate-950 text-yellow-400 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer flex items-center gap-2"
                  >
                    View All Orders
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                )}
                  </>
                )}

                {adminPanelView === "inbox" && adminRole !== "news_editor" && (
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

                {adminPanelView === "orders" && adminRole !== "news_editor" && (
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
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-600 leading-relaxed space-y-1">
          <p>
            <span className="font-black uppercase tracking-wider text-slate-500">
              Buyer notifications:
            </span>{" "}
            {notificationConfig.buyerNotificationsLive ? (
              <span className="font-bold text-emerald-700">Live</span>
            ) : (
              <span className="font-bold text-amber-700">Development / not live</span>
            )}
            {" • "}
            SMS{" "}
            {notificationConfig.smsLive
              ? "live"
              : notificationConfig.sms
                ? "configured"
                : "not configured"}{" "}
            • WhatsApp{" "}
            {notificationConfig.whatsappLive
              ? `live from ${notificationConfig.whatsappPhone || "0796230743"}${
                  notificationConfig.whatsappProvider === "africas_talking"
                    ? " (Africa's Talking)"
                    : notificationConfig.whatsappProvider === "meta"
                      ? " (Meta Cloud)"
                      : ""
                }`
              : notificationConfig.whatsappProvider === "meta" ||
                  notificationConfig.whatsappProviderPreference === "meta"
                ? notificationConfig.metaTemplateConfigured
                  ? `Meta configured — set WHATSAPP_NOTIFY_MODE=live and verify token/phone ID`
                  : `Meta token set — add approved WHATSAPP_TEMPLATE_NAME for order updates`
                : notificationConfig.whatsapp
                  ? `log mode from ${notificationConfig.whatsappPhone || "0796230743"} — add Meta Cloud API keys`
                  : "not configured"}
          </p>
          <p>
            <span className="font-black uppercase tracking-wider text-slate-500">
              Admin cash alerts:
            </span>{" "}
            {notificationConfig.adminAlertsLive ? (
              <span className="font-bold text-emerald-700">
                Live to {notificationConfig.adminAlertPhones} phone
                {notificationConfig.adminAlertPhones === 1 ? "" : "s"}
              </span>
            ) : notificationConfig.adminAlertPhones > 0 ? (
              <span className="font-bold text-amber-700">
                {notificationConfig.adminAlertPhones} phone
                {notificationConfig.adminAlertPhones === 1 ? "" : "s"} set — enable SMS/WhatsApp keys
              </span>
            ) : (
              <span className="font-bold text-amber-700">
                Add ORDER_ADMIN_PHONES in .env
              </span>
            )}
            {notificationConfig.trackingUrlConfigured
              ? " • Tracking links enabled"
              : " • Add NEXT_PUBLIC_SITE_URL for tracking links"}
          </p>
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

                  {order.deliveryAddress && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block">
                        Delivery Address
                      </span>

                      <span className="font-bold text-slate-800 whitespace-pre-wrap">
                        {order.deliveryAddress}
                      </span>
                    </div>
                  )}

                  {order.orderNote && (
                    <div className="sm:col-span-2 rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-2">
                      <span className="text-amber-700 block text-[10px] font-black uppercase tracking-wider">
                        Fan Note
                      </span>

                      <span className="font-semibold text-amber-900 whitespace-pre-wrap">
                        {order.orderNote}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block">
                      Payment Method
                    </span>

                    <span className="font-bold text-slate-800 uppercase">
                      {String(order.paymentMethod || "mpesa").toLowerCase() === "cash"
                        ? "Cash on Delivery"
                        : order.paymentMethod || "M-PESA"}
                    </span>
                  </div>

                  {String(order.paymentMethod || "").toLowerCase() === "cash" &&
                    String(order.paymentStatus || "").toLowerCase() !== "paid" && (
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={() => void handleMarkOrderCashPaid(order.id)}
                          disabled={updatingOrderId === order.id}
                          className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-[10px] uppercase tracking-wider px-4 py-2.5 transition disabled:opacity-50"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          {updatingOrderId === order.id
                            ? "Updating..."
                            : "Mark Cash Received"}
                        </button>
                      </div>
                    )}

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
                            {item.itemCustomization && (
                              <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                                {item.itemCustomization}
                              </p>
                            )}
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

                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
                    Delivery Progress
                  </p>
                  <OrderProgressTimeline
                    orderStatus={order.orderStatus}
                    paymentStatus={order.paymentStatus}
                    mpesaReceiptNumber={order.mpesaReceiptNumber}
                    items={order.items}
                    totalAmount={order.totalAmount}
                    createdAt={order.createdAt}
                    compact
                    interactive
                    disabled={updatingOrderId === order.id}
                    onStatusChange={(nextStatus) =>
                      handleUpdateOrderStatus(order.id, nextStatus)
                    }
                  />
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
                      Quick Status
                    </p>

                    <select
                      value={order.orderStatus || "processing"}
                      onChange={(e) =>
                        void handleUpdateOrderStatus(
                          order.id,
                          e.target.value as
                            | "processing"
                            | "shipped"
                            | "delivered"
                            | "cancelled"
                        )
                      }
                      disabled={updatingOrderId === order.id}
                      className="mt-1 w-full bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg px-2 py-2 cursor-pointer disabled:opacity-50"
                    >
                      <option value="processing" disabled={status !== "paid"}>
                        Processing
                      </option>
                      <option value="shipped" disabled={status !== "paid"}>
                        Shipped
                      </option>
                      <option value="delivered" disabled={status !== "paid"}>
                        Delivered
                      </option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    {status !== "paid" && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Fulfillment unlocks after payment. Cancel is always available.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleArchiveOrder(order.id)}
                    disabled={updatingOrderId === order.id}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-black uppercase tracking-wider rounded-lg px-2 py-2 transition cursor-pointer disabled:opacity-50"
                  >
                    Remove from List
                  </button>

                </div>
              </div>

            </div>
          </div>
        );
      })}
    </div>
    </div>
  )}

  {adminArchivedOrders.length > 0 && (
    <div className="px-6 pb-6">
      <AdminCollapsibleSection
        title="Order History"
        description="Review archived orders kept for reference. Restore any order back to the active list if needed."
        closedDescription="Open this panel to browse archived orders or restore them to the active list."
        isOpen={showArchivedOrders}
        onToggle={() => setShowArchivedOrders((open) => !open)}
        icon={Package}
        badge={
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {adminArchivedOrders.length} archived
          </span>
        }
      >
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/40 overflow-hidden">
          {adminArchivedOrders.map((order) => {
            const status =
              String(order.paymentStatus || "pending").toLowerCase();

            return (
              <div
                key={order.id}
                className="p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-black text-slate-800">
                      Order #{order.id}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-700">
                      Archived
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                      {getOrderStatusLabel(order.orderStatus || "processing")}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-slate-600 border border-slate-200">
                      {status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {order.customerName} • {order.phoneNumber} • Ksh{" "}
                    {Number(order.totalAmount || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Placed{" "}
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : "—"}
                    {order.archivedAt && (
                      <>
                        {" "}
                        • Archived{" "}
                        {new Date(order.archivedAt).toLocaleString()}
                      </>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRestoreOrder(order.id)}
                  disabled={updatingOrderId === order.id}
                  className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl px-4 py-2.5 transition cursor-pointer disabled:opacity-50"
                >
                  {updatingOrderId === order.id ? "Restoring..." : "Restore to List"}
                </button>
              </div>
            );
          })}
        </div>
      </AdminCollapsibleSection>
    </div>
  )}
</div>
                  </div>
                )}

                {adminPanelView === "members" && adminRole !== "news_editor" && (
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
                          All records
                        </p>
                        <p className="text-3xl font-black text-slate-950 mt-2">
                          {adminMembershipStats.total}
                        </p>
                      </div>
                      <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm p-5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                          Active
                        </p>
                        <p className="text-3xl font-black text-emerald-700 mt-2">
                          {adminMembershipStats.activeCount}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl border border-slate-100 shadow-sm p-5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Expired
                        </p>
                        <p className="text-3xl font-black text-slate-800 mt-2">
                          {adminMembershipStats.expiredCount}
                        </p>
                      </div>
                      <div className="bg-rose-50 rounded-2xl border border-rose-100 shadow-sm p-5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-rose-600">
                          Revoked
                        </p>
                        <p className="text-3xl font-black text-rose-700 mt-2">
                          {adminMembershipStats.revokedCount}
                        </p>
                      </div>
                      <div className="bg-slate-950 rounded-2xl shadow-sm p-5">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Active value
                        </p>
                        <p className="text-2xl font-black text-yellow-400 mt-2">
                          Ksh {adminMembershipStats.activeRevenue.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={handleAddAdminMembership}
                      className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-4"
                    >
                      <div>
                        <h3 className="font-black text-lg text-slate-950 flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-emerald-600" />
                          Add a member
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                          Grant a one-year card for cash or complimentary membership. If they have no
                          fan account, one is created on this phone.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Full name"
                          value={adminMemberName}
                          onChange={(e) => setAdminMemberName(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="0712345678"
                          value={adminMemberPhone}
                          onChange={(e) => setAdminMemberPhone(e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <select
                          value={adminMemberPlanId}
                          onChange={(e) =>
                            setAdminMemberPlanId(e.target.value as MembershipPlanId)
                          }
                          className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {MEMBERSHIP_PLANS.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} · Ksh {plan.price.toLocaleString()}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          disabled={isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl cursor-pointer disabled:opacity-50"
                        >
                          {isPending ? "Adding..." : "Add member"}
                        </button>
                      </div>
                    </form>

                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-3">
                          <h3 className="font-black text-lg text-slate-950 flex items-center gap-2">
                            <Award className="w-5 h-5 text-emerald-600" />
                            Membership roll
                          </h3>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <input
                              type="text"
                              value={membershipSearch}
                              onChange={(e) => setMembershipSearch(e.target.value)}
                              placeholder="Search name, phone, or plan..."
                              className="w-full sm:w-72 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <select
                              value={membershipFilter}
                              onChange={(e) =>
                                setMembershipFilter(
                                  e.target.value as "all" | AdminMembershipStatus
                                )
                              }
                              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="all">All</option>
                              <option value="active">Active</option>
                              <option value="expired">Expired</option>
                              <option value="pending">Pending</option>
                              <option value="failed">Failed</option>
                              <option value="revoked">Revoked</option>
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => loadAdminMemberships()}
                          disabled={isLoadingMemberships}
                          className="bg-slate-950 text-yellow-400 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-900 cursor-pointer disabled:opacity-50"
                        >
                          {isLoadingMemberships ? "Refreshing..." : "Refresh"}
                        </button>
                      </div>

                      {isLoadingMemberships ? (
                        <div className="p-10 text-center text-sm text-slate-500">
                          Loading memberships...
                        </div>
                      ) : visibleAdminMemberships.length === 0 ? (
                        <div className="p-10 text-center text-sm text-slate-500">
                          No memberships match this view yet.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {visibleAdminMemberships.map((row) => {
                            const statusClass =
                              row.status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : row.status === "revoked"
                                  ? "bg-rose-50 text-rose-700"
                                  : row.status === "pending"
                                    ? "bg-yellow-50 text-yellow-700"
                                    : "bg-slate-100 text-slate-600";

                            return (
                              <div
                                key={row.id}
                                className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                              >
                                <div className="space-y-1">
                                  <p className="font-black text-slate-950">{row.fullName}</p>
                                  <p className="text-sm text-slate-600">
                                    {formatPhoneDisplay(row.phoneNumber)} · {row.planName} · Ksh{" "}
                                    {row.amount.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {row.status === "active" ? "Valid until" : "Ended"}{" "}
                                    {formatMembershipExpiry(row.expiresAt)}
                                    {row.mpesaReceiptNumber
                                      ? ` · ${row.paymentMethod === "admin" ? "Added by admin" : `Receipt ${row.mpesaReceiptNumber}`}`
                                      : ""}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusClass}`}
                                  >
                                    {row.status}
                                  </span>
                                  {row.status === "active" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleRevokeMembership({
                                          id: row.id,
                                          fullName: row.fullName,
                                          planName: row.planName,
                                        })
                                      }
                                      disabled={revokingMembershipId === row.id}
                                      className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer disabled:opacity-50"
                                    >
                                      {revokingMembershipId === row.id
                                        ? "Revoking..."
                                        : "Revoke"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
              
            )}
          </div>
          
        )}

    </>
  );
}
