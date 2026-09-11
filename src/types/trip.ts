export interface Member {
  id: string;
  name: string;
  nickname: string;
  phone?: string;
  /** Phone number, national id or e-wallet id. Falls back to `phone`. */
  promptPayId?: string;
  avatarColor: string;
  status: 'confirmed' | 'maybe' | 'declined';
  role: 'organizer' | 'member';
  hasCarVolunteer?: boolean;
  carSeatsOffered?: number;
  paidDeposit?: boolean;
  notes?: string;
}

export interface CarVolunteer {
  id: string;
  driverName: string;
  carModel: string;
  maxSeats: number;
  meetingArea: string;
  notes?: string;
}

export interface Car {
  id: string;
  driverName: string;
  carModel: string;
  licensePlate?: string;
  maxSeats: number;
  meetingPoint: string;
  departureTime: string;
  passengerIds: string[];
  notes?: string;
}

export interface AccommodationOption {
  id: string;
  name: string;
  location: string;
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  linkUrl?: string;
  imageUrl?: string;
  highlights: string[];
  suggestedBy: string;
  votes: string[]; // member nicknames or IDs who voted
}

export interface Room {
  id: string;
  roomName: string;
  bedType: string;
  capacity: number;
  guestIds: string[];
  hasBathroom: boolean;
  notes?: string;
}

export interface Accommodation {
  name: string;
  villaType: string;
  address: string;
  mapUrl: string;
  checkIn: string;
  checkOut: string;
  totalBedrooms: number;
  totalBathrooms: number;
  wifiSsid?: string;
  wifiPassword?: string;
  rooms: Room[];
}

export interface PlaceIdea {
  id: string;
  title: string;
  category: 'cafe' | 'food' | 'nature' | 'party' | 'other';
  location: string;
  mapUrl?: string;
  suggestedBy: string;
  votes: string[]; // member IDs who want to go
  notes?: string;
}

/**
 * A dish someone wants on the trip's table. Candidates only — the group votes,
 * the ones with the most votes get bought. `votes` holds member ids, same as
 * `PlaceIdea`.
 */
export interface MenuIdea {
  id: string;
  title: string;
  category: 'grill' | 'main' | 'snack' | 'drink' | 'dessert' | 'other';
  /** Which sitting this is for. */
  meal: 'dinner' | 'breakfast' | 'latenight' | 'anytime';
  /** Rough baht per head, used only to sketch the food budget. */
  estimatedPerHead?: number;
  suggestedBy: string;
  votes: string[]; // member ids who want this dish
  notes?: string;
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  location: string;
  category: 'travel' | 'food' | 'cafe' | 'nature' | 'relax' | 'activity' | 'other';
  mapUrl?: string;
  notes?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  dayLabel: string;
  date: string;
  activities: Activity[];
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  payerId: string;
  category: 'accommodation' | 'food' | 'fuel' | 'tickets' | 'other';
  splitBetween?: string[];
  date: string;
  notes?: string;
  /** Receipt or transfer slip kept as proof of what was spent. */
  slipId?: string;
}

/**
 * Money moved between two people to settle up, as opposed to money spent on
 * the trip. Recording one takes it off the outstanding transfer list.
 */
export interface Payment {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  date: string;
  slipId?: string;
  note?: string;
}

export interface PackingItem {
  id: string;
  title: string;
  category: 'shared' | 'personal';
  assignedMemberId?: string;
  isPacked: boolean;
}

export interface Announcement {
  id: string;
  text: string;
  date: string;
  author: string;
}

export interface TripData {
  id: string;
  /**
   * Bumped on every saved change. Whoever holds the higher number holds the
   * newer trip — it is how a device tells its own unsynced edits apart from an
   * older copy arriving from the cloud cache.
   */
  revision?: number;
  title: string;
  tagline: string;
  destination: string;
  startDate: string; // 2026-10-31
  endDate: string;   // 2026-11-01
  statusPhase: 'planning' | 'finalized';
  coverImage: string;
  members: Member[];
  cars: Car[];
  accommodationOptions: AccommodationOption[];
  confirmedAccommodation?: Accommodation;
  placeIdeas: PlaceIdea[];
  menuIdeas: MenuIdea[];
  itinerary: ItineraryDay[];
  expenses: Expense[];
  payments?: Payment[];
  packingList: PackingItem[];
  announcements: Announcement[];
}

/** The lists on a trip that people add to, edit and delete from. */
export const TRIP_LISTS = [
  'members',
  'cars',
  'accommodationOptions',
  'placeIdeas',
  'menuIdeas',
  'itinerary',
  'expenses',
  'payments',
  'packingList',
  'announcements',
] as const;

export type TripListName = (typeof TRIP_LISTS)[number];

/**
 * How a screen changes a list.
 *
 * Adding and editing go through `onSaveItem`, which writes that item alone.
 * Removing has its own call and is the only thing that takes anything away —
 * no screen can drop an item by handing back a shorter list.
 */
export interface TripListEditor {
  onSaveItem: (list: TripListName, item: object) => void;
  onRemoveItem: (list: TripListName, itemId: string) => void;
}
