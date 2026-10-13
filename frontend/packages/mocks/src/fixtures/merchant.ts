import type {
  MaterialRequestDetail,
  MerchantCategory,
  MerchantProfile,
} from "@cfc/types";

/**
 * Merchant fixtures.
 *
 * One signed-in shop — an electrical and hardware supplier in Trichy — and the
 * material requests sitting in its queue. The set deliberately covers every
 * status the dashboard has to render, including a partially accepted request
 * and one that lapsed unanswered, because those are the states a screen built
 * only against the happy path gets wrong.
 */

const HOUR = 60 * 60 * 1000;

/** Fixed clock so timestamps read the same on every render. */
const NOW = new Date("2026-10-13T09:30:00.000Z").getTime();

const at = (offsetMs: number): string =>
  new Date(NOW + offsetMs).toISOString();

export const merchantCategories: MerchantCategory[] = [
  { id: "cat-electrical", name: "Electrical" },
  { id: "cat-plumbing", name: "Plumbing" },
  { id: "cat-hardware", name: "General hardware" },
  { id: "cat-paint", name: "Paint & finishes" },
  { id: "cat-sanitary", name: "Sanitary ware" },
];

export const merchantProfile: MerchantProfile = {
  id: "mer-1",
  shopName: "Sri Balaji Electricals & Hardware",
  ownerName: "Ramesh Kumar",
  phone: "9791964797",
  addressLine: "14, Big Bazaar Street",
  area: "Thillai Nagar",
  city: "Tiruchirappalli",
  pincode: "620018",
  categories: [
    merchantCategories[0]!,
    merchantCategories[2]!,
    merchantCategories[1]!,
  ],
  openTime: "09:00",
  closeTime: "20:30",
  status: "approved",
  acceptingRequests: true,
};

export const materialRequests: MaterialRequestDetail[] = [
  {
    id: "mr-1",
    jobRef: "CFC10248",
    serviceName: "Electrical — Distribution board replacement",
    area: "Thillai Nagar",
    proName: "Imran Khan",
    lineCount: 3,
    status: "pending",
    origin: "broadcast",
    receivedAt: at(-8 * 60 * 1000),
    expiresAt: at(7 * 60 * 1000),
    proNotes:
      "Main board is overloaded. Need an 8-way board, two 32A MCBs and wire for re-termination. Customer is at home until 6pm.",
    lines: [
      {
        id: "mrl-1",
        description: "8-way distribution board",
        quantity: 1,
        unit: "nos",
        costPaise: 240000,
        merchantCostPaise: null,
        available: true,
      },
      {
        id: "mrl-2",
        description: "32A MCB",
        quantity: 2,
        unit: "nos",
        costPaise: 96000,
        merchantCostPaise: null,
        available: true,
      },
      {
        id: "mrl-3",
        description: "2.5mm copper wire",
        quantity: 12,
        unit: "m",
        costPaise: 54000,
        merchantCostPaise: null,
        available: true,
      },
    ],
  },
  {
    id: "mr-2",
    jobRef: "CFC10251",
    serviceName: "Plumbing — Bathroom tap replacement",
    area: "Srirangam",
    proName: "Vignesh R",
    lineCount: 2,
    status: "pending",
    origin: "direct",
    receivedAt: at(-22 * 60 * 1000),
    expiresAt: null,
    proNotes: "Both taps are seized. Customer prefers chrome finish.",
    lines: [
      {
        id: "mrl-4",
        description: "Chrome pillar tap",
        quantity: 2,
        unit: "nos",
        costPaise: 130000,
        merchantCostPaise: null,
        available: true,
      },
      {
        id: "mrl-5",
        description: "PTFE thread seal tape",
        quantity: 2,
        unit: "nos",
        costPaise: 4000,
        merchantCostPaise: null,
        available: true,
      },
    ],
  },
  {
    id: "mr-3",
    jobRef: "CFC10239",
    serviceName: "Electrical — Ceiling fan installation",
    area: "Woraiyur",
    proName: "Imran Khan",
    lineCount: 2,
    status: "accepted",
    origin: "direct",
    receivedAt: at(-3 * HOUR),
    expiresAt: null,
    proNotes: "Two fans, customer has already bought the regulators.",
    lines: [
      {
        id: "mrl-6",
        description: "Ceiling fan down rod, 12 inch",
        quantity: 2,
        unit: "nos",
        costPaise: 36000,
        merchantCostPaise: 36000,
        available: true,
      },
      {
        id: "mrl-7",
        description: "Fan hook clamp",
        quantity: 2,
        unit: "nos",
        costPaise: 18000,
        merchantCostPaise: 18000,
        available: true,
      },
    ],
  },
  {
    id: "mr-4",
    jobRef: "CFC10233",
    serviceName: "Electrical — Wiring repair",
    area: "K K Nagar",
    proName: "Suresh M",
    lineCount: 3,
    status: "partially_accepted",
    origin: "broadcast",
    receivedAt: at(-5 * HOUR),
    expiresAt: null,
    proNotes: "Short in the kitchen circuit. Needs rewiring from the junction.",
    lines: [
      {
        id: "mrl-8",
        description: "1.5mm copper wire",
        quantity: 20,
        unit: "m",
        costPaise: 70000,
        merchantCostPaise: 74000,
        available: true,
      },
      {
        id: "mrl-9",
        description: "Junction box, 4 way",
        quantity: 1,
        unit: "nos",
        costPaise: 22000,
        merchantCostPaise: 22000,
        available: true,
      },
      {
        id: "mrl-10",
        description: "Heat shrink sleeve, 6mm",
        quantity: 5,
        unit: "nos",
        costPaise: 9000,
        merchantCostPaise: null,
        available: false,
      },
    ],
  },
  {
    id: "mr-5",
    jobRef: "CFC10227",
    serviceName: "Plumbing — Pipe leak repair",
    area: "Thillai Nagar",
    proName: "Vignesh R",
    lineCount: 2,
    status: "ready",
    origin: "direct",
    receivedAt: at(-7 * HOUR),
    expiresAt: null,
    readyAt: at(-40 * 60 * 1000),
    proNotes: "Leak at the riser joint on the first floor.",
    lines: [
      {
        id: "mrl-11",
        description: "CPVC pipe, 1 inch",
        quantity: 3,
        unit: "m",
        costPaise: 45000,
        merchantCostPaise: 45000,
        available: true,
      },
      {
        id: "mrl-12",
        description: "CPVC elbow, 1 inch",
        quantity: 4,
        unit: "nos",
        costPaise: 12000,
        merchantCostPaise: 12000,
        available: true,
      },
    ],
  },
  {
    id: "mr-6",
    jobRef: "CFC10219",
    serviceName: "Electrical — Switchboard repair",
    area: "Srirangam",
    proName: "Suresh M",
    lineCount: 2,
    status: "collected",
    origin: "direct",
    receivedAt: at(-26 * HOUR),
    expiresAt: null,
    readyAt: at(-23 * HOUR),
    collectedAt: at(-4 * HOUR),
    proNotes: "Replaced modular plates and two sockets.",
    lines: [
      {
        id: "mrl-13",
        description: "Modular switch plate, 8 module",
        quantity: 2,
        unit: "nos",
        costPaise: 64000,
        merchantCostPaise: 64000,
        available: true,
      },
      {
        id: "mrl-14",
        description: "6A modular socket",
        quantity: 4,
        unit: "nos",
        costPaise: 32000,
        merchantCostPaise: 30000,
        available: true,
      },
    ],
  },
  {
    id: "mr-7",
    jobRef: "CFC10244",
    serviceName: "Paint — Interior touch-up",
    area: "Cantonment",
    proName: "Karthik S",
    lineCount: 2,
    status: "expired",
    origin: "broadcast",
    receivedAt: at(-9 * HOUR),
    expiresAt: at(-8.75 * HOUR),
    proNotes: "Two walls, customer picked an off-white shade.",
    lines: [
      {
        id: "mrl-15",
        description: "Interior emulsion, 4L",
        quantity: 2,
        unit: "nos",
        costPaise: 180000,
        merchantCostPaise: null,
        available: true,
      },
      {
        id: "mrl-16",
        description: "Roller sleeve, 9 inch",
        quantity: 2,
        unit: "nos",
        costPaise: 16000,
        merchantCostPaise: null,
        available: true,
      },
    ],
  },
];
