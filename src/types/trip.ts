export interface Member {
  id: string;
  name: string;
  nickname: string;
  phone?: string;
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
  itinerary: ItineraryDay[];
  expenses: Expense[];
  packingList: PackingItem[];
  announcements: Announcement[];
}
