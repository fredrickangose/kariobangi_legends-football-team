"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  Shield,
  Activity,
  Heart,
  ShoppingBag,
  Award,
  History,
  Calendar,
Trophy,
  Users,
  BookOpen,
  HeartHandshake,
  Menu,
  X,
  Plus,
  Check,
  ChevronLeft,
  MapPin,
  TrendingUp,
  Coins,
  MessageSquare,
  Settings,
  UserPlus,
  AlertCircle,
  Phone,
  Trash2,
  ChevronRight,
  Sparkles,
  Image as ImageIcon,
  Camera,
  Layers,
  ArrowRight
} from "lucide-react";
import {
  submitDonation,
  submitFanMessage,
  addPlayer,
  addNews,
  addGalleryImage,
  deletePlayer,
  deleteNews,
  deleteGalleryImage,
  updatePlayerImage,
  updateNewsImage,
  updateGalleryImage,
  addMerchandise,
  updateMerchandiseImage,
  deleteMerchandise,
  addManagement,
  updateManagement,
  deleteManagement,
  addFixture,
  updateFixture,
  deleteFixture,
  getOrders,
} from "./actions";
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
  date: string;
  isHome: boolean;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  venue: string;
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

interface CartItem {
  merchId: number;
  name: string;
  price: number;
  size: string;
  quantity: number;
  kitType: string;
}

export default function ClubWebsite({ initialData }: ClubWebsiteProps) {
  const [selectedSizes, setSelectedSizes] = useState<Record<number, string>>({});
  const [activeTab, setActiveTab] = useState<string>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [galleryCarouselIndex, setGalleryCarouselIndex] = useState(0);

  // Automatically rotate homepage gallery every 4 seconds
useEffect(() => {
  if (initialData.gallery.length <= 1) return;

  const interval = setInterval(() => {
    setGalleryCarouselIndex((current) =>
      current === initialData.gallery.length - 1
        ? 0
        : current + 1
    );
  }, 4000);

  return () => clearInterval(interval);
}, [initialData.gallery.length]);

  // Gallery filter state
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string>("All");
  const [selectedGalleryImage, setSelectedGalleryImage] =
  useState<GalleryItem | null>(null);
 

  // Form states
  const [donationAmount, setDonationAmount] = useState<number>(1500);
  const [customDonation, setCustomDonation] = useState<string>("");
  const [donorName, setDonorName] = useState<string>("");
  const [donationMessage, setDonationMessage] = useState<string>("");
  const [donationPurpose, setDonationPurpose] = useState<string>("Boots & Equipment");

  const [fanName, setFanName] = useState<string>("");
  const [fanText, setFanText] = useState<string>("");

  // Checkout states
  const [checkoutName, setCheckoutName] = useState<string>("");
  const [checkoutPhone, setCheckoutPhone] = useState<string>("");
  const [checkoutMethod, setCheckoutMethod] = useState<"mpesa" | "card">("mpesa");
  const [checkoutSuccess, setCheckoutSuccess] = useState<boolean>(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string>("");

  // Admin states
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
const [orderFilter, setOrderFilter] = useState<
  "all" | "paid" | "pending" | "failed"
>("all");

const [orderSearch, setOrderSearch] = useState<string>("");
  
  const [adminPlayerName, setAdminPlayerName] = useState<string>("");
  const [adminPlayerPos, setAdminPlayerPos] = useState<string>("Midfielder");
  const [adminPlayerJersey, setAdminPlayerJersey] = useState<string>("");
  const [adminPlayerBio, setAdminPlayerBio] = useState<string>("");
  const [adminPlayerApps, setAdminPlayerApps] = useState<string>("0");
  const [adminPlayerGoals, setAdminPlayerGoals] = useState<string>("0");
  const [adminPlayerAssists, setAdminPlayerAssists] = useState<string>("0");
  const [adminPlayerFile, setAdminPlayerFile] = useState<File | null>(null);

  const [adminOpponent, setAdminOpponent] = useState<string>("");
  const [adminDate, setAdminDate] = useState<string>("");
  const [adminIsHome, setAdminIsHome] = useState<boolean>(true);
  const [adminVenue, setAdminVenue] = useState<string>("Kariobangi North Ground, Nairobi");
  const [adminHomeScore, setAdminHomeScore] = useState<string>("");
  const [adminAwayScore, setAdminAwayScore] = useState<string>("");
  const [adminStatus, setAdminStatus] = useState<string>("upcoming");
  const [editingFixtureId, setEditingFixtureId] = useState<number | null>(null);

  const [adminNewsTitle, setAdminNewsTitle] = useState<string>("");
  const [adminNewsSummary, setAdminNewsSummary] = useState<string>("");
  const [adminNewsContent, setAdminNewsContent] = useState<string>("");
  const [adminNewsFile, setAdminNewsFile] = useState<File | null>(null);

  const [adminGalleryFile, setAdminGalleryFile] = useState<File | null>(null);
  const [adminGalleryCaption, setAdminGalleryCaption] = useState<string>("");
  const [adminGalleryCategory, setAdminGalleryCategory] =
    useState<string>("Training");

    // Management admin states
const [adminManagementName, setAdminManagementName] = useState<string>("");
const [adminManagementPosition, setAdminManagementPosition] = useState<string>("Chairman");
const [adminManagementCategory, setAdminManagementCategory] = useState<string>("Club Leadership");
const [adminManagementBio, setAdminManagementBio] = useState<string>("");
const [adminManagementResponsibilities, setAdminManagementResponsibilities] = useState<string>("");
const [adminManagementOrder, setAdminManagementOrder] = useState<string>("0");
const [adminManagementFile, setAdminManagementFile] = useState<File | null>(null);
const [editingManagementId, setEditingManagementId] = useState<number | null>(null);
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
  const uploadSelectedImage = async (file: File, folder: "gallery" | "news" | "merch" | "players" | "management") => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Please select an image file.");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Image is too large. Please choose an image under 10 MB.");
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
    const finalAmount = customDonation ? parseInt(customDonation) : donationAmount;
    if (!donorName) {
      showToast("Please enter your name", "error");
      return;
    }
    if (isNaN(finalAmount) || finalAmount <= 0) {
      showToast("Please enter a valid amount", "error");
      return;
    }

    startTransition(async () => {
      const res = await submitDonation({
        donorName,
        amount: finalAmount,
        message: donationMessage,
        purpose: donationPurpose,
      });

      if (res.success) {
        showToast(res.message || "Thank you! Your donation was recorded.");
        setDonorName("");
        setDonationMessage("");
        setCustomDonation("");
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
                  `Payment successful! Your M-PESA receipt number is ${statusData.mpesaReceiptNumber || "confirmed"}. Your Kariobangi Legends merchandise order has been received and will be processed shortly.`
                );

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
    const result = await getOrders();

    if (result.success) {
      setAdminOrders(result.orders || []);
    } else {
      console.error("Unable to load admin orders:", result.error);
      showToast(result.error || "Unable to load orders.", "error");
    }
  } catch (error) {
    console.error("Load admin orders failed:", error);
    showToast("Unable to retrieve customer orders.", "error");
  } finally {
    setIsLoadingOrders(false);
  }
};
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
  setIsAdminAuthenticated(true);
  setAdminPassword("");

  await loadAdminOrders();

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

  if (!adminOpponent || !adminDate) {
    showToast("Opponent name and date are required", "error");
    return;
  }

  startTransition(async () => {
    const res = await addFixture({
      opponent: adminOpponent,
      date: adminDate,
      isHome: adminIsHome,
      status: adminStatus,
      venue: adminVenue,
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
      setAdminDate("");
      setAdminHomeScore("");
      setAdminAwayScore("");
    } else {
      showToast(res.error || "Error adding fixture", "error");
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

  if (!adminOpponent || !adminDate) {
    showToast("Opponent name and date are required", "error");
    return;
  }

  startTransition(async () => {
    try {
      const res = await updateFixture(editingFixtureId, {
        opponent: adminOpponent,
        date: adminDate,
        isHome: adminIsHome,
        status: adminStatus,
        venue: adminVenue,
        homeScore:
          adminHomeScore !== "" ? parseInt(adminHomeScore) : undefined,
        awayScore:
          adminAwayScore !== "" ? parseInt(adminAwayScore) : undefined,
      });

      if (res.success) {
        showToast("Match result updated successfully!");

        setEditingFixtureId(null);
        setAdminOpponent("");
        setAdminDate("");
        setAdminHomeScore("");
        setAdminAwayScore("");
        setAdminStatus("upcoming");
        setAdminIsHome(true);
        setAdminVenue("Kariobangi North Ground, Nairobi");
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
  setAdminDate(fixture.date);
  setAdminIsHome(fixture.isHome);
  setAdminVenue(fixture.venue);
  setAdminStatus(fixture.status);

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

  showToast(`Editing match vs ${fixture.opponent}`);
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
            "/images/management-placeholder.jpg",
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

  const filteredGallery = selectedGalleryCategory === "All"
    ? initialData.gallery
    : initialData.gallery.filter(item => item.category === selectedGalleryCategory);
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

  // ================= AUTOMATIC MATCH DATE SORTING =================
const today = new Date();

const todayString = `${today.getFullYear()}-${String(
  today.getMonth() + 1
).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

// Upcoming = future matches only.
// A match marked Completed (FT) is removed from Upcoming immediately,
// even if it was played today.
// Upcoming = today's and future matches that are not completed
const upcomingFixtures = initialData.fixtures
  .filter(
    (fixture) =>
      fixture.date >= todayString &&
      fixture.status !== "completed"
  )
  .sort((a, b) => a.date.localeCompare(b.date));

// Recent Results = completed matches, including matches completed today,
// plus any older matches whose date has already passed.
const recentFixtures = initialData.fixtures
  .filter(
    (fixture) =>
      fixture.status === "completed" ||
      fixture.date < todayString
  )
  .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-600 selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-xl p-4 shadow-xl border animate-bounce flex items-start gap-3 bg-white text-slate-900 border-emerald-500">
          <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Notification Info</p>
            <p className="text-xs text-slate-600 mt-1">{toastMessage.text}</p>
          </div>
        </div>
      )}

      {/* Top Banner with slogan */}
      <div className="bg-slate-950 text-white text-center py-2 px-4 text-xs font-medium border-b border-yellow-500/20 flex justify-between items-center max-w-7xl mx-auto rounded-b-lg">
        <span className="flex items-center gap-1.5 text-yellow-400">
          <Shield className="w-3.5 h-3.5 fill-yellow-400" /> Est. 2018 | Nairobi County, Kenya
        </span>
        <span className="hidden md:inline italic text-slate-400 text-[11px]">
          "From Kariobangi North slums to the World - Molding Football Legends"
        </span>
        <button
          onClick={() => {
            setActiveTab("admin");
            setMobileMenuOpen(false);
          }}
          className="hover:text-yellow-400 transition text-[11px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1 cursor-pointer font-bold"
        >
          <Settings className="w-3 h-3" /> Add Game & Photos (Admin)
        </button>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("home")}>
           <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-slate-950 border-2 border-yellow-400 shadow-lg flex items-center justify-center overflow-hidden group">

  {/* Subtle club-color glow */}
  <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-yellow-400/10" />

  {/* Club badge */}
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img
    src="/assets/logo.jpeg"
    alt="Kariobangi Legends FC badge"
    className="relative z-10 w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-300"
  />

</div>
            <div>
              <h1 className="font-black italic text-lg sm:text-xl md:text-2xl tracking-[-0.04em] text-slate-950 leading-none uppercase">
  KARIOBANGI
  <span className="text-emerald-600 ml-1">
    LEGENDS
  </span>
</h1>
<p className="mt-1 text-[9px] sm:text-[10px] font-black text-slate-500 tracking-[0.16em] uppercase">
  Football Club
  <span className="text-yellow-500 mx-1">•</span>
  Division One
</p>
              <p className="text-[10px] font-semibold text-emerald-600 tracking-wider uppercase">
                Football Club • Division One
              </p>
            </div>
          </div>

          {/* ================= DESKTOP NAVIGATION ================= */}
<nav className="hidden xl:flex items-center gap-1 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">

  {[
    { id: "home", label: "Home" },
    { id: "history", label: "Our Story" },
    { id: "squad", label: "Squad" },
    { id: "management", label: "Management" },
    { id: "fixtures", label: "Matches" },
    { id: "news", label: "Club News" },
    { id: "gallery", label: "Photo Gallery" },
    { id: "shop", label: "Merchandise Shop" },
    { id: "donors", label: "Support & Donors" },
    { id: "fanzone", label: "Fan Zone" },
  ].map((tab) => (

    <button
      key={tab.id}
      onClick={() => {
        setActiveTab(tab.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className={`relative px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all duration-300 whitespace-nowrap cursor-pointer ${
        activeTab === tab.id
          ? "bg-slate-950 text-yellow-400 shadow-md"
          : "text-slate-600 hover:bg-white hover:text-emerald-700 hover:shadow-sm"
      }`}
    >

      {/* Active indicator */}
      {activeTab === tab.id && (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-yellow-400" />
      )}

      {tab.label}

    </button>

  ))}

</nav>

          {/* Action buttons (Cart, Donate) */}
          <div className="flex items-center gap-2">
            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all border border-slate-200"
              title="Open Shopping Cart"
            >
              <ShoppingBag className="w-5.5 h-5.5" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Support Quick CTA */}
            <button
              onClick={() => {
                setActiveTab("donors");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4 text-emerald-100" /> Support
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2.5 text-slate-700 hover:text-slate-950 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white border-t border-slate-100 py-3 px-4 shadow-inner space-y-1">
            {[
              { id: "home", label: "Home Base" },
              { id: "history", label: "Club History & Mr. Erick Otieno Atanga" },
              { id: "squad", label: "Senior Squad List" },
              { id: "fixtures", label: "Fixtures & Matches" },
              { id: "news", label: "Club Blogs & News" },
              { id: "gallery", label: "Team Photo Gallery" },
              { id: "shop", label: "Merchandise Store" },
              { id: "donors", label: "Donation Portal" },
              { id: "fanzone", label: "Fan Guestbook" },
              { id: "admin", label: "Admin: Add Games & Photos" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition ${
                  activeTab === tab.id
                    ? "bg-slate-950 text-yellow-400"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

     

      {/* Main body wrapper */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ================= TAB: HOME ================= */}
        {activeTab === "home" && (
          <div className="space-y-12">
         {/* ================= HERO BANNER ================= */}
<div className="relative min-h-[500px] sm:min-h-[580px] rounded-3xl overflow-hidden bg-slate-950 text-white border border-slate-800 shadow-2xl">

  {/* Hero background image */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{ backgroundImage: "url('/assets/background.jpeg')" }}
  />

  {/* Dark cinematic overlays */}
  <div className="absolute inset-0 bg-slate-950/55" />
  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-slate-950/20" />
  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" />

  {/* Decorative glow */}
  <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
  <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl" />

  {/* Hero content */}
  <div className="relative z-10 min-h-[500px] sm:min-h-[580px] flex items-center">

    <div className="w-full p-6 sm:p-10 md:p-14 lg:p-16">

      <div className="max-w-4xl space-y-4 sm:space-y-5">

        {/* ================= CLUB LOGO ================= */}
        <div className="flex items-center gap-5 sm:gap-6 mb-2">

          {/* Logo container */}
          <div className="relative shrink-0">

            {/* Glow behind logo */}
            <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl scale-110" />

            {/* Logo background */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full bg-white/95 border-4 border-yellow-400/80 shadow-2xl flex items-center justify-center p-2 sm:p-2.5">

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/logo.jpeg"
                alt="Kariobangi Legends FC Logo"
                className="w-full h-full object-contain rounded-full"
              />

            </div>

          </div>

          {/* Club identity beside logo */}
          <div className="hidden sm:block">

            <p className="text-yellow-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">
              Official Club
            </p>

            <p className="text-white text-lg md:text-xl font-black uppercase tracking-tight mt-1">
              Kariobangi Legends FC
            </p>

            <div className="flex items-center gap-2 mt-2">
              <span className="w-8 h-1 rounded-full bg-emerald-500" />
              <span className="w-5 h-1 rounded-full bg-yellow-400" />
              <span className="w-8 h-1 rounded-full bg-emerald-500" />
            </div>

          </div>

        </div>


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

            {/* Logo placeholder */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-xl mb-4">
              <Shield className="w-12 h-12 sm:w-14 sm:h-14 text-emerald-400" />
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

            {/* Opponent logo placeholder */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-xl mb-4">
              <Shield className="w-12 h-12 sm:w-14 sm:h-14 text-slate-400" />
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
                {upcomingFixtures[0].date}
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
                {upcomingFixtures[0].status || "Upcoming"}
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Match Centre button */}
      <div className="relative z-10 p-5 sm:p-6 border-t border-white/10">

        <button
          onClick={() => setActiveTab("fixtures")}
          className="w-full group flex items-center justify-center gap-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black uppercase tracking-wider text-xs sm:text-sm py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-yellow-400/20 cursor-pointer"
        >
          <Trophy className="w-4 h-4" />
          Match Centre
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

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
  {initialData.gallery.length > 0 ? (

    <div className="relative group">

      {/* Large image area */}
      <div className="relative h-[320px] sm:h-[430px] md:h-[520px] lg:h-[560px] rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 shadow-xl">

        {initialData.gallery.map((item, index) => (

          <div
            key={item.id}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${
              index === galleryCarouselIndex
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >

            {/* Clear image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.caption || "Kariobangi Legends FC"}
              className="w-full h-full object-contain"
            />

            {/* Very light overlay only at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />


            {/* Caption */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 z-20">

              {item.category && (
                <span className="inline-flex items-center bg-emerald-600 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-2">
                  {item.category}
                </span>
              )}

              <p className="text-lg sm:text-2xl font-black text-white leading-snug max-w-2xl">
                {item.caption || "Kariobangi Legends FC"}
              </p>

            </div>

          </div>

        ))}


        {/* Previous */}
        <button
          onClick={() =>
            setGalleryCarouselIndex((current) =>
              current === 0
                ? initialData.gallery.length - 1
                : current - 1
            )
          }
          className="absolute z-30 left-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-yellow-400 hover:text-slate-950 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-300 opacity-70 group-hover:opacity-100"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>


        {/* Next */}
        <button
          onClick={() =>
            setGalleryCarouselIndex((current) =>
              current === initialData.gallery.length - 1
                ? 0
                : current + 1
            )
          }
          className="absolute z-30 right-4 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-yellow-400 hover:text-slate-950 text-white border border-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-300 opacity-70 group-hover:opacity-100"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>


        {/* Counter */}
        <div className="absolute z-30 top-4 right-4">

          <div className="px-3 py-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-md text-white text-[9px] font-black">
            {galleryCarouselIndex + 1} / {initialData.gallery.length}
          </div>

        </div>

      </div>


      {/* ================= DOTS ================= */}
      <div className="flex justify-center items-center gap-2 mt-5">

        {initialData.gallery.map((_, index) => (

          <button
            key={index}
            onClick={() => setGalleryCarouselIndex(index)}
            className={`h-2 rounded-full transition-all duration-500 ${
              index === galleryCarouselIndex
                ? "w-8 bg-yellow-400"
                : "w-2 bg-slate-300 hover:bg-emerald-500"
            }`}
            aria-label={`Show image ${index + 1}`}
          />

        ))}

      </div>

    </div>

  ) : (

    /* Empty gallery */
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">

      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
        <Camera className="w-7 h-7 text-slate-300" />
      </div>

      <h4 className="font-black text-slate-800">
        No Gallery Photos Yet
      </h4>

      <p className="text-sm text-slate-500 mt-2">
        Club photos and matchday moments will appear here.
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
                  "{msg.message}"
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
  <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl">

    {/* Decorative background */}
    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
    <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-yellow-400/5 blur-3xl" />

    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[320px_1fr]">

      {/* Founder image */}
      <div className="relative min-h-[360px] lg:min-h-full bg-slate-900">

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/coach-portrait.jpg"
          alt="Mr. Erick Otieno Atanga"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Image overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Founder label */}
        <div className="absolute bottom-0 left-0 right-0 p-6">

          <span className="inline-flex items-center bg-yellow-400 text-slate-950 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
            Founder & Patron
          </span>

          <h3 className="text-xl font-black text-white">
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
          Kariobangi Legends is more than a football club — it is a community
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
                  Showcasing real team moments in Kariobangi North. You can dynamically add new photos of match fixtures and academy work through the Admin Panel.
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveTab("admin");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Photo to Board
              </button>
            </div>

            {/* Category Filter buttons */}
            <div className="flex gap-2 flex-wrap bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
              {["All", "Match", "Training", "Community", "Academy"].map((cat) => (
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
                  className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                  
                >
                  <div className="h-72 relative bg-slate-900 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <button
  type="button"
  onClick={() => {
    setSelectedGalleryImage(item);
  }}
  className="w-full h-full cursor-zoom-in"
>
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img
    src={item.imageUrl}
    alt={item.caption}
    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out"
  />
</button>
                    <span className="absolute top-4 left-4 bg-slate-950/90 text-yellow-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>
                  <div className="p-5 space-y-2">
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                      {item.caption}
                    </p>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-slate-400 font-bold">
                        Published: {new Date(item.createdAt).toLocaleDateString()}
                      </p>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredGallery.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-500 text-sm mt-3">No photos in this category yet</p>
                <p className="text-xs text-slate-400 mt-1">Go to the Admin Panel to post pictures of this event!</p>
              </div>
            )}
          </div>
        )}
                    {selectedGalleryImage && (
              <div
                className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300"
                onClick={() => setSelectedGalleryImage(null)}
              >
                <div
                  className="relative w-full max-w-6xl h-[90vh] flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedGalleryImage(null)}
                    className="absolute top-2 right-2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl transition"
                    aria-label="Close image"
                  >
                    ×
                  </button>

{/* Previous Button */}
<button
  type="button"
  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl transition"
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
  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl transition"
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
<div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 text-white text-xs font-bold px-4 py-2 rounded-full">
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
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                  />

                  {/* Caption */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-16 rounded-b-lg">
                    <p className="text-white font-bold text-sm">
                      {selectedGalleryImage.caption}
                    </p>
                    <p className="text-emerald-400 text-xs font-semibold mt-1 uppercase">
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
            These former players came together and formed Legends FC —
            bringing together old players who still had football in their
            hearts. Every Sunday, they met to share football experience,
            score goals, have fun, debate football and reminisce about
            memorable football moments.
          </p>

          <p className="mt-3 font-bold text-emerald-700">
            They called it FB — Football & Bonding.
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

        {/* Support */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-slate-900 uppercase">
            Support Our Mission
          </h4>

          <p className="text-xs text-slate-600 leading-relaxed">
            Supporting Kariobangi Legends means supporting football talent,
            community development and the dreams of young people.
          </p>

          <button
            onClick={() => setActiveTab("donors")}
            className="w-full bg-slate-950 text-yellow-400 text-xs font-bold py-3 rounded-xl hover:bg-slate-900 transition uppercase tracking-wider cursor-pointer"
          >
            Go To Donation Options
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

    {/* ================= HEADER ================= */}
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


    {/* ================= TWO MANAGEMENT SECTIONS ================= */}
    {[
      {
        name: "Club Leadership",
        title: "Club Leadership / Board",
        description:
          "Strategic leadership, governance and overall direction of Kariobangi Legends.",
      },
      {
        name: "Technical Team",
        title: "Technical Team",
        description:
          "Football, coaching, matchday and technical development of the team.",
      },
    ].map((section) => {

      const members = initialData.management
        .filter(
          (member) =>
            member.category === section.name
        )
        .sort(
          (a, b) =>
            a.displayOrder - b.displayOrder
        );

      if (members.length === 0) return null;

      return (
        <section
          key={section.name}
          className="space-y-6"
        >

          {/* ================= SECTION HEADING ================= */}
          <div className="flex items-start gap-4">

            <div className="w-1.5 min-h-16 bg-yellow-400 rounded-full" />

            <div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-950">
                {section.title}
              </h3>

              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                {section.description}
              </p>
            </div>

          </div>


          {/* ================= OFFICIALS ================= */}
          <div
            className={
              section.name === "Club Leadership"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            }
          >

            {members.map((member) => (
              <div
                key={member.id}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >

                {/* ================= PHOTO ================= */}
                <div className="relative h-72 bg-slate-100 overflow-hidden">

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      member.imageUrl ||
                      "/images/management-placeholder.jpg"
                    }
                    alt={`${member.name} - ${member.position}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.currentTarget.src =
                        "/images/management-placeholder.jpg";
                    }}
                  />

                  {/* Dark gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950/90 to-transparent" />

                  {/* Position */}
                  <div className="absolute bottom-4 left-4 right-4">

                    <span className="inline-flex bg-slate-950/95 text-yellow-400 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-xl shadow-lg">
                      {member.position}
                    </span>

                  </div>

                </div>


                {/* ================= INFORMATION ================= */}
                <div className="p-5 space-y-4">

                  <div>

                    <h4 className="text-xl font-black text-slate-950 leading-tight">
                      {member.name}
                    </h4>

                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                      {member.position}
                    </p>

                  </div>


                  {/* Responsibilities */}
                  {member.responsibilities && (
                    <div className="space-y-1.5">

                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Responsibilities
                      </p>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {member.responsibilities}
                      </p>

                    </div>
                  )}


                  {/* Biography */}
                  {member.bio && (
                    <div className="space-y-1.5">

                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        Biography
                      </p>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {member.bio}
                      </p>

                    </div>
                  )}


                  {/* ================= ADMIN CONTROLS ================= */}
                  {isAdminAuthenticated && (
                    <div className="flex gap-2 pt-2">

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() =>
                          handleAdminEditManagement(member)
                        }
                        className="flex-1 bg-slate-950 text-yellow-400 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-slate-900 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        Edit
                      </button>


                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() =>
                          handleAdminDeleteManagement(
                            member.id
                          )
                        }
                        disabled={isPending}
                        className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-red-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        Delete
                      </button>

                    </div>
                  )}

                </div>

              </div>
            ))}

          </div>

        </section>
      );
    })}


    {/* ================= EMPTY STATE ================= */}
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

            {/* Quick Stat Highlights */}
            <div className="bg-slate-950 text-white p-6 rounded-2xl border border-yellow-500/10 flex flex-wrap gap-6 items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Squad Average Age</p>
                <p className="text-2xl font-black text-yellow-400">21.8 Years</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Top Scorer (This Season)</p>
                <p className="text-2xl font-black text-yellow-400">Erick 'Chicha' (16 Goals)</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Local Nairobi Born</p>
                <p className="text-2xl font-black text-yellow-400">100% Proud</p>
              </div>
              <button
                onClick={() => {
                  setActiveTab("admin");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs px-4 py-2.5 rounded-xl hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Add Player Row
              </button>
            </div>

            {/* Squad Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {initialData.players.map((player) => (
                <div
                  key={player.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-950 font-black text-sm flex items-center justify-center border border-slate-200">
                          #{player.jerseyNumber}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                            {player.name}
                          </h3>
                          <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mt-0.5">
                            {player.position}
                          </p>
                        </div>
                      </div>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-500 uppercase">
                        Senior Squad
                      </span>
                                       </div>

                    {/* Player Photo */}
                    <div className="w-full h-64 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={player.imageUrl || "/images/squad-training.jpg"}
                        alt={`${player.name} - Kariobangi Legends`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/images/squad-training.jpg";
                        }}
                      />
                    </div>

                    {/* Quick Stats list */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Apps</p>
                        <p className="text-sm font-black text-slate-900">{player.appearances}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Goals</p>
                        <p className="text-sm font-black text-slate-900">{player.goals}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Assists</p>
                        <p className="text-sm font-black text-slate-900">{player.assists}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100/30">
                      <strong>Scout Notes:</strong> {player.bio}
                    </p>
                  </div>

                  {/* Player footer card — admin actions visible only to admins */}
<div className="bg-slate-950 text-white px-6 py-3 flex justify-between items-center text-xs border-t border-slate-900">
  <div className="flex items-center gap-2">
    
    {isAdminAuthenticated && (
      <>
        <button
          onClick={() =>
            openReplaceImage(player.id, "player", player.imageUrl)
          }
          className="text-blue-400 hover:text-blue-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-0.5 cursor-pointer"
          title="Replace this player's photo"
        >
          <Camera className="w-3.5 h-3.5" /> Swap Photo
        </button>

        <button
          onClick={() =>
            handleDeletePlayer(player.id, player.name)
          }
          className="text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-0.5 cursor-pointer"
          title="Remove player from squad"
        >
          <Trash2 className="w-3.5 h-3.5" /> Remove
        </button>
      </>
    )}
  </div>

  <button
                      onClick={() => {
                        setActiveTab("shop");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-yellow-400 hover:text-yellow-500 font-bold uppercase tracking-wider text-[11px] flex items-center gap-0.5 cursor-pointer"
                    >
                      Buy Jersey <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB: FIXTURES & MATCHES ================= */}
        {activeTab === "fixtures" && (
          <div className="space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-3xl font-black text-slate-950 tracking-tight">Match Center & Results</h2>
              <p className="text-sm text-slate-600">
                Track our journey through FKF Division One. All fixtures reflect our battle for promotion to the National Super League.
              </p>
            </div>

            {/* Past Results & Upcoming Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upcoming fixtures */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-950 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" /> Upcoming Matches
                </h3>

                <div className="space-y-3">
                  {upcomingFixtures.map((fixture) => (
                      <div
                        key={fixture.id}
                        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold">FKF DIVISION ONE</span>
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-extrabold uppercase text-[10px]">
                            {fixture.isHome ? "HOME MATCH" : "AWAY MATCH"}
                          </span>
                        </div>

                        {/* Teams display */}
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2 w-5/12">
                            <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center font-bold text-yellow-400 text-xs border-2 border-yellow-500">
                              KL
                            </div>
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                              Legends FC
                            </span>
                          </div>

                          <div className="text-center w-2/12 font-bold text-xs text-slate-400">
                            VS
                          </div>

                          <div className="flex items-center gap-2 justify-end w-5/12 text-right">
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                              {fixture.opponent}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                              {fixture.opponent.slice(0, 2).toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Venue & Date */}
                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {fixture.venue}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700">{fixture.date}</span>
                            <button
  type="button"
  onClick={() => handleEditFixture(fixture)}
  className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded cursor-pointer"
  title="Edit this fixture"
>
  Edit
</button>
                            <button
                              onClick={() => handleDeleteFixture(fixture.id, fixture.opponent)}
                              className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Remove this fixture"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Completed matches */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-950 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" /> Recent Results
                </h3>

                <div className="space-y-3">
                  {recentFixtures.map((fixture) => (
                      <div
                        key={fixture.id}
                        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3"
                      >
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold">FKF DIVISION ONE</span>
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-extrabold uppercase text-[10px]">
                            FT (Completed)
                          </span>
                        </div>

                        {/* Score line */}
                        <div className="flex items-center justify-between py-1">
                          {/* Legends */}
                          <div className="flex items-center gap-2 w-5/12">
                            <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center font-bold text-yellow-400 text-xs border-2 border-yellow-500">
                              KL
                            </div>
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                              Legends FC
                            </span>
                          </div>

                          {/* Scores */}
                          <div className="w-2/12 flex items-center justify-center gap-1.5">
                            <span className="text-base font-black text-slate-950">
                              {fixture.isHome ? fixture.homeScore : fixture.awayScore}
                            </span>
                            <span className="text-slate-300 font-bold">:</span>
                            <span className="text-base font-black text-slate-950">
                              {fixture.isHome ? fixture.awayScore : fixture.homeScore}
                            </span>
                          </div>

                          {/* Opponent */}
                          <div className="flex items-center gap-2 justify-end w-5/12 text-right">
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                              {fixture.opponent}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs">
                              {fixture.opponent.slice(0, 2).toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Match Highlight notes */}
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 flex items-center gap-1 truncate max-w-[200px]">
                            <MapPin className="w-3.5 h-3.5" /> {fixture.venue}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                              {fixture.isHome && (fixture.homeScore ?? 0) > (fixture.awayScore ?? 0)
                                ? "Legends Win ✓"
                                : "Draw Match"}
                            </span>
                            <button
  type="button"
  onClick={() => handleEditFixture(fixture)}
  className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded cursor-pointer"
  title="Edit this result"
>
  Edit
</button>
                            <button
                              onClick={() => handleDeleteFixture(fixture.id, fixture.opponent)}
                              className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Remove this result"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
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
  <ShoppingBag className="w-4 h-4" /> Add to Cart — M-Pesa Ready
</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB: DONORS & SUPPORT ================= */}
        {activeTab === "donors" && (
          <div className="space-y-8">
            <div className="max-w-3xl space-y-2">
              <h2 className="text-3xl font-black text-slate-950 tracking-tight">Sponsor Kariobangi Legends</h2>
              <p className="text-sm text-slate-600">
                Operating a competitive club in Division One of the Kenyan league requires resources. 
                Our boys face immense hurdles. Your support directly provides boots, matches transport, academy training, and daily healthy meals.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Form Column */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-xl font-bold text-slate-950">Make a Safe Support Donation</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Every Shilling matters. A single pair of standard boots costs around Ksh 2,500 ($19 USD). 
                  Fill in the details below to contribute dynamically to our team.
                </p>

                <form onSubmit={handleDonationSubmit} className="space-y-5">
                  {/* Preset amounts in Ksh */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">
                      Select Amount (Ksh)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { val: 500, label: "500\n(Academy Lunch)" },
                        { val: 1500, label: "1,500\n(Academy Fee)" },
                        { val: 3000, label: "3,000\n(1 Boot Pair)" },
                        { val: 8000, label: "8,000\n(Away Bus)" },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => {
                            setDonationAmount(preset.val);
                            setCustomDonation("");
                          }}
                          className={`p-3 rounded-xl font-extrabold text-center transition flex flex-col items-center justify-center border whitespace-pre-line ${
                            donationAmount === preset.val && !customDonation
                              ? "bg-slate-950 text-yellow-400 border-slate-950"
                              : "bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100"
                          }`}
                        >
                          <span className="text-sm">Ksh {preset.val.toLocaleString()}</span>
                          <span className="text-[8px] font-medium text-slate-400 leading-tight mt-1">
                            {preset.label.split("\n")[1]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount input */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">
                      Or Enter Custom Shillings Amount (Ksh)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-400 font-bold text-sm">Ksh</span>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        value={customDonation}
                        onChange={(e) => {
                          setCustomDonation(e.target.value);
                          setDonationAmount(0);
                        }}
                        className="w-full text-sm pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Atanga Fan Club / Sarah Jepchirchir"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase block">
                        Fund Purpose
                      </label>
                      <select
                        value={donationPurpose}
                        onChange={(e) => setDonationPurpose(e.target.value)}
                        className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="Boots & Equipment">Boots & Match Balls</option>
                        <option value="Academy Support">U-15 Grassroots Academy</option>
                        <option value="Transport & Meals">Away Game Bus Hire</option>
                        <option value="General Club Fund">General Operational Support</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold uppercase block">
                      Message of Hope (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Keep pushing hard! Kariobangi is proud of you all!"
                      value={donationMessage}
                      onChange={(e) => setDonationMessage(e.target.value)}
                      className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Kenya M-Pesa style warning */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2 text-emerald-800 text-[11px] leading-relaxed">
                    <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>M-Pesa Support:</strong> Simulated Checkout works automatically. 
                      Your name and donation will be safely logged into our local PostgreSQL database.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider py-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4 text-emerald-100 fill-emerald-100" />
                    {isPending ? "Recording Donation..." : "Confirm & Send Support"}
                  </button>
                </form>
              </div>

              {/* Right Side Donors Feed */}
              <div className="space-y-6">
                <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-900 shadow-sm space-y-4">
                  <h3 className="font-bold text-base text-yellow-400">Past Donors Honor Board</h3>
                  <p className="text-xs text-slate-300">
                    A special thank you to all those who have sponsored Kariobangi Legends. You are fueling community dreams.
                  </p>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {initialData.donations.map((d) => (
                      <div key={d.id} className="p-3 bg-slate-900 rounded-xl space-y-1.5 border border-slate-800">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-100 truncate max-w-[140px]">{d.donorName}</span>
                          <span className="text-emerald-400 font-black whitespace-nowrap">Ksh {d.amount.toLocaleString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          Target: {d.purpose}
                        </p>
                        {d.message && (
                          <p className="text-xs text-slate-300 italic">"{d.message}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-100 space-y-3">
                  <h4 className="font-extrabold text-sm text-slate-950">Where does the money go?</h4>
                  <ul className="space-y-2 text-xs text-slate-600 leading-relaxed list-disc list-inside">
                    <li>FKF Division One registration fees</li>
                    <li>First-aid kit replenishment</li>
                    <li>Renting buses to travel across Nairobi County</li>
                    <li>Purchasing pure black home kits and white away jerseys</li>
                    <li>Supporting the Under-15 educational scholarship fund</li>
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
                        "{msg.message}"
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

        {/* ================= TAB: ADMIN PANEL ================= */}
        {activeTab === "admin" && (
          <div className="space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-3xl font-black text-slate-950 tracking-tight">Manager Administration Panel</h2>
              <p className="text-sm text-slate-600">
                Are you a club official or Mr. Erick Otieno Atanga? Add players, schedule matches, post news updates, or add photos straight to the PostgreSQL database.
              </p>
            </div>

            {!isAdminAuthenticated ? (
              <div className="max-w-md mx-auto bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-950 mx-auto">
                  <Settings className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-bold text-slate-950">Enter Manager Password</h3>
                  
                </div>
                <form onSubmit={handleAdminLogin} className="space-y-3">
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center text-slate-900"
                  />
                  <button
                    type="submit"
                    className="w-full bg-slate-950 hover:bg-slate-900 text-yellow-400 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
                  >
                    Authenticate
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Admin Status Header */}
                <div className="bg-emerald-600 text-white p-4 rounded-2xl flex justify-between items-center text-xs">
                  <span className="font-bold">✓ Authenticated as Kariobangi Legends Manager</span>
                  <button
  onClick={async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
    } finally {
      setIsAdminAuthenticated(false);
    }
  }}
  className="bg-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-800 font-bold transition"
>
  Logout Admin
</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Action 1: Add Player */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-950 flex items-center gap-1.5">
                      <UserPlus className="w-5 h-5 text-emerald-600" /> Add Player to Squad
                    </h3>
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

                      <div className="grid grid-cols-4 gap-2">
                        <div className="col-span-2 space-y-1">
                          <label className="font-bold text-slate-500">Position</label>
                          <select
                            value={adminPlayerPos}
                            onChange={(e) => setAdminPlayerPos(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                          >
                            <option value="Goalkeeper">Goalkeeper</option>
                            <option value="Defender">Defender</option>
                            <option value="Midfielder">Midfielder</option>
                            <option value="Forward">Forward</option>
                          </select>
                        </div>
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
                  </div>

                  {/* Action 2: Add Fixture (Dynamically updates upcoming games) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-950 flex items-center gap-1.5">
                      <Calendar className="w-5 h-5 text-yellow-500" /> Log / Update Match Game
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Instantly updates the **Upcoming Next Match Banner** on the Home Page and the Match Center.
                    </p>
                    <form
  onSubmit={
    editingFixtureId
      ? handleAdminUpdateFixture
      : handleAdminAddFixture
  }
  className="space-y-3 text-xs"
>
                      <div className="grid grid-cols-2 gap-3">
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
                          <label className="font-bold text-slate-500">Date (Readable format)</label>
                          <input
                            type="text"
                            placeholder="e.g. 2026-04-12"
                            value={adminDate}
                            onChange={(e) => setAdminDate(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
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
                          <label className="font-bold text-slate-500">Match Status</label>
                          <select
                            value={adminStatus}
                            onChange={(e) => setAdminStatus(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="completed">Completed (FT)</option>
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

                      {adminStatus === "completed" && (
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
    Add Chairman, CEO, Team Manager, coaches, administrators and other club officials.
    Photos can be uploaded directly from your computer.
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

        // Set a valid default position whenever section changes
        if (category === "Club Leadership") {
          setAdminManagementPosition("Chairman");
        } else {
          setAdminManagementPosition("Head Coach");
        }
      }}
      className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
    >
      <option value="Club Leadership">
        Club Leadership / Board
      </option>

      <option value="Technical Team">
        Technical Team
      </option>
    </select>
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

      {/* CLUB LEADERSHIP */}
      {adminManagementCategory === "Club Leadership" && (
        <>
          <option value="Chairman">
            Chairman
          </option>

          <option value="Vice Chairman">
            Vice Chairman
          </option>

          <option value="CEO / President">
            CEO / President
          </option>

          <option value="Senior Team Manager">
            Senior Team Manager
          </option>

          <option value="Club Secretary">
            Club Secretary
          </option>

          <option value="Club Treasurer">
            Club Treasurer
          </option>

          <option value="Community Representative">
            Community Representative
          </option>

          <option value="Board Member">
            Board Member
          </option>
        </>
      )}


      {/* TECHNICAL TEAM */}
      {adminManagementCategory === "Technical Team" && (
        <>
          <option value="Head Coach">
            Head Coach
          </option>

          <option value="Assistant Coach">
            Assistant Coach
          </option>

          <option value="Goalkeeping Coach">
            Goalkeeping Coach
          </option>

          <option value="Fitness Coach">
            Fitness Coach
          </option>

          <option value="Team Doctor / Physiotherapist">
            Team Doctor / Physiotherapist
          </option>

          <option value="Team Analyst">
            Team Analyst
          </option>

          <option value="Kit Manager">
            Kit Manager
          </option>

          <option value="Disciplinarian">
            Disciplinarian
          </option>

          <option value="Photographer">
            Photographer
          </option>

          <option value="Equipment & Matchday Assistant">
            Equipment & Matchday Assistant
          </option>
        </>
      )}

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
      Official's Photo
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
</div>

{/* Action 4: Add Gallery Image (For Showcasing More Images!) */}

                  {/* Action 3: Add Gallery Image (For Showcasing More Images!) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-950 flex items-center gap-1.5">
                      <Camera className="w-5 h-5 text-emerald-600" /> Post Photo to Team Gallery
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Upload a photo directly from your computer to the Kariobangi Legends team gallery.
                    </p>

                    <form onSubmit={handleAdminAddGallery} className="space-y-3 text-xs">
                      {/* Gallery Photo */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-500">Gallery Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setAdminGalleryFile(file);
                          }}
                          className="block w-full text-sm text-slate-600
                            file:mr-4 file:py-2.5 file:px-4
                            file:rounded-xl file:border-0
                            file:text-xs file:font-bold
                            file:bg-slate-950 file:text-yellow-400
                            hover:file:bg-slate-800
                            cursor-pointer"
                          required
                        />

                        {adminGalleryFile && (
                          <p className="text-xs text-emerald-600 font-semibold">
                            Selected: {adminGalleryFile.name}
                          </p>
                        )}
                      </div>

                      {/* Caption and Category */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Caption / Description</label>
                          <input
                            type="text"
                            placeholder="e.g. Celebrating our winning goal in Githurai."
                            value={adminGalleryCaption}
                            onChange={(e) => setAdminGalleryCaption(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Event Category</label>
                          <select
                            value={adminGalleryCategory}
                            onChange={(e) => setAdminGalleryCategory(e.target.value)}
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                          >
                            <option value="Match">Matchday Action</option>
                            <option value="Training">Pitch Training</option>
                            <option value="Community">Slum Community Event</option>
                            <option value="Academy">U-15 Youth Academy</option>
                          </select>
                        </div>
                      </div>

                      {/* Publish Button */}
                      <button
                        type="submit"
                        disabled={isPending || !adminGalleryFile}
                        className="w-full bg-slate-950 text-yellow-400 font-bold py-2.5 rounded-xl uppercase tracking-wider hover:bg-slate-900 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPending ? "Uploading Image..." : "Choose Photo & Publish"}
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

                {/* ================= ADMIN ORDERS ================= */}
                {/* ORDER STATISTICS */}
{(() => {
  const totalOrders = adminOrders.length;

  const paidOrders = adminOrders.filter(
    (order) =>
      String(order.paymentStatus || "").toLowerCase() === "paid"
  );

  const pendingOrders = adminOrders.filter(
    (order) =>
      String(order.paymentStatus || "").toLowerCase() === "pending"
  );

  const failedOrders = adminOrders.filter(
    (order) =>
      String(order.paymentStatus || "").toLowerCase() === "failed"
  );

  const totalSales = paidOrders.reduce(
    (total, order) => total + Number(order.totalAmount || 0),
    0
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">

      {/* TOTAL ORDERS */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Total Orders
        </p>

        <p className="text-3xl font-black text-slate-950 mt-2">
          {totalOrders}
        </p>

        <p className="text-xs text-slate-500 mt-1">
          All merchandise orders
        </p>
      </div>

      {/* PAID ORDERS */}
      <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
          Paid Orders
        </p>

        <p className="text-3xl font-black text-emerald-700 mt-2">
          {paidOrders.length}
        </p>

        <p className="text-xs text-emerald-600 mt-1">
          Successfully paid
        </p>
      </div>

      {/* PENDING ORDERS */}
      <div className="bg-yellow-50 rounded-2xl border border-yellow-100 shadow-sm p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-yellow-600">
          Pending
        </p>

        <p className="text-3xl font-black text-yellow-700 mt-2">
          {pendingOrders.length}
        </p>

        <p className="text-xs text-yellow-600 mt-1">
          Awaiting payment
        </p>
      </div>

      {/* FAILED ORDERS */}
      <div className="bg-rose-50 rounded-2xl border border-rose-100 shadow-sm p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-rose-600">
          Failed
        </p>

        <p className="text-3xl font-black text-rose-700 mt-2">
          {failedOrders.length}
        </p>

        <p className="text-xs text-rose-600 mt-1">
          Unsuccessful payments
        </p>
      </div>

      {/* TOTAL SALES */}
      <div className="bg-slate-950 rounded-2xl shadow-sm p-5">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Total Sales
        </p>

        <p className="text-2xl font-black text-yellow-400 mt-2">
          Ksh {totalSales.toLocaleString()}
        </p>

        <p className="text-xs text-slate-400 mt-1">
          Paid orders only
        </p>
      </div>

    </div>
  );
})()}
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
    <div className="divide-y divide-slate-100">
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

                </div>
              </div>

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
      </main>

      {/* ================= SHOPPING CART COLLAPSIBLE PANEL ================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>

          <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-100">
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
                    </div>
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
                      Buying items directly finances the team's Division One league expenses.
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

                  {/* ================= M-PESA CHECKOUT ================= */}
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
              4004975
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-[8px] text-slate-400 uppercase font-bold">
              Account
            </p>

            <p className="text-xs font-black text-white mt-2">
              KARIOBANGI
              <br />
              LEGENDS
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
            4. Enter PayBill <strong>4004975</strong>.
          </li>
          <li>
            5. Enter Account <strong>KARIOBANGI LEGENDS</strong>.
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
<footer className="bg-slate-950 text-white mt-20 border-t-2 border-yellow-500/30">

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">

    {/* ================= FOOTER BRANDING ================= */}
    <div className="space-y-5">

      {/* Club Logo + Name */}
      <div className="flex items-center gap-3">

        <div className="relative w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center border border-yellow-500 overflow-hidden">

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logo.jpeg"
            alt="Kariobangi Legends FC badge"
            className="w-full h-full object-contain p-1"
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

      {/* ================= SOCIAL MEDIA ================= */}
      <div className="pt-2">

        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">
          Follow the Legends
        </p>

        <div className="flex items-center gap-3">

          {/* X / Twitter */}
          <a
            href="https://x.com/Kariobangi40852"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Kariobangi Legends on X"
            title="Follow Kariobangi Legends on X"
            className="group w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-white hover:bg-black hover:border-yellow-400 hover:text-yellow-400 hover:-translate-y-1 transition-all duration-300 shadow-md"
          >
            <span className="text-lg font-black group-hover:scale-110 transition-transform">
              𝕏
            </span>
          </a>

          {/* Facebook */}
          <a
            href="https://www.facebook.com/profile.php?id=100092849342811"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Kariobangi Legends on Facebook"
            title="Follow Kariobangi Legends on Facebook"
            className="group w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-white hover:bg-[#1877F2] hover:border-[#1877F2] hover:-translate-y-1 transition-all duration-300 shadow-md"
          >
            <span className="text-xl font-black group-hover:scale-110 transition-transform">
              f
            </span>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/kariobangi_legends_fc"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Kariobangi Legends on Instagram"
            title="Follow Kariobangi Legends on Instagram"
            className="group w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-white hover:bg-pink-600 hover:border-pink-500 hover:-translate-y-1 transition-all duration-300 shadow-md"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle
                cx="17.5"
                cy="6.5"
                r="1"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </a>

        </div>

      </div>

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
          { label: "Merchandise Shop", tab: "shop" },
          { label: "Donors & Supporters", tab: "donors" },
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
        Slum-to-Stardom Contact
      </h4>

      <p className="text-slate-400 leading-relaxed">
        Kariobangi North Ground,
        <br />
        Nairobi County, Kenya
      </p>

      <p className="text-slate-400 leading-relaxed">
        Founded under Mr. Erick Otieno Atanga's leadership.
      </p>

      <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-900">
        © {new Date().getFullYear()} Kariobangi Legends FC. Made with love for Nairobi youth.
      </p>

    </div>

  </div>

</footer>
    </div>
  );
}


