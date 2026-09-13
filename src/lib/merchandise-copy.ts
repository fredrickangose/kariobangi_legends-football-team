export const SHOP_DELIVERY_NOTE =
  "Nairobi delivery is arranged after payment confirmation. Cash orders are packed once the club office marks them paid. Allow 2–5 working days in Nairobi and 3–7 days for other counties.";

export const SHOP_SIZE_CHART = [
  { size: "S", chest: "88–94 cm", length: "69 cm" },
  { size: "M", chest: "96–102 cm", length: "71 cm" },
  { size: "L", chest: "104–110 cm", length: "73 cm" },
  { size: "XL", chest: "112–118 cm", length: "75 cm" },
  { size: "XXL", chest: "120–126 cm", length: "77 cm" },
] as const;

const GENERIC_DESCRIPTION =
  "Official Kariobangi Legends merchandise.";

const COPY_BY_KEY: Record<string, { name: string; description: string }> = {
  "black jersey": {
    name: "Home Kit · Resilience Black",
    description:
      "Official 2026 home shirt in Resilience Black. Replica match fit with the Kariobangi Legends crest. Profits support boots, scholarships, and match travel.",
  },
  "white jersey": {
    name: "Away Kit · Pure White",
    description:
      "Official away shirt in Pure White. Clean replica cut with club crest and contrast trim. Profits go back to the Division One squad.",
  },
  "red jersey": {
    name: "Change Kit · Kariobangi Red",
    description:
      "Bold red change shirt for travel days and training photos. Official replica with the club crest. Every sale supports youth football in Kariobangi North.",
  },
  "green jersey": {
    name: "Away Kit · Hope Green",
    description:
      "Official Hope Green away shirt. Replica match fit with the Kariobangi Legends crest. Profits fund academy kits and match-day transport.",
  },
  scarf: {
    name: "Matchday Supporter Scarf",
    description:
      "Club colours for cold Nairobi evenings. Wear it in the stand or on the walk to the ground. Every sale supports youth football in Kariobangi North.",
  },
  "black jumper": {
    name: "Training Jumper · Resilience Black",
    description:
      "Heavy club jumper in Resilience Black. Warm enough for early training and travel days. Crested replica with profits going back to the squad.",
  },
  "red jumper": {
    name: "Travel Jumper · Kariobangi Red",
    description:
      "Bold red club jumper for away days and fan meet-ups. Official replica cut with the Kariobangi Legends crest.",
  },
  jumper: {
    name: "Club Crest Jumper",
    description:
      "Everyday club jumper with the Kariobangi Legends crest. Soft replica layer for training, travel, and matchday.",
  },
  cap: {
    name: "Club Crest Cap",
    description:
      "Snapback-style club cap with the Kariobangi Legends crest. Everyday fan wear — profits fund academy kits and match travel.",
  },
};

function normalizeProductKey(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getImprovedMerchandiseCopy(item: {
  name: string;
  description?: string | null;
}) {
  const key = normalizeProductKey(item.name);
  const preset = COPY_BY_KEY[key];
  const currentDescription = (item.description || "").trim();
  const descriptionIsGeneric =
    !currentDescription ||
    currentDescription === GENERIC_DESCRIPTION ||
    /^official kariobangi legends/i.test(currentDescription);

  if (preset) {
    return {
      name: preset.name,
      description: descriptionIsGeneric ? preset.description : currentDescription,
      improved: preset.name !== item.name.trim() || descriptionIsGeneric,
    };
  }

  return {
    name: item.name.trim(),
    description: descriptionIsGeneric
      ? "Official Kariobangi Legends replica. 100% of profit supports player boots, school scholarships, and match travel."
      : currentDescription,
    improved:
      descriptionIsGeneric && currentDescription !== ""
        ? true
        : descriptionIsGeneric && !currentDescription,
  };
}

export function merchandiseNeedsCopyUpgrade(item: {
  name: string;
  description?: string | null;
}) {
  const improved = getImprovedMerchandiseCopy(item);
  return (
    improved.name !== item.name.trim() ||
    improved.description !== (item.description || "").trim()
  );
}
