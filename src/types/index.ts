export type UserRole = 'client' | 'provider';

export interface User {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  profileId?: string;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  category: string;
  title: string;
  location: string;
  about: string;
  priceLabel: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  gallery: string[];
  coverImage: string;
  profileImage: string;
}

export type RequestStatus = 'pending' | 'confirmed' | 'declined';

export type ProviderEventStatus = 'pending' | 'approved' | 'canceled' | 'completed';

export interface ProviderEvent {
  id: string;
  providerId: string;
  date: string;
  clientName: string;
  jobCost: string;
  status: ProviderEventStatus;
  address: string;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  providerId: string;
  category: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  location: string;
  budget: string;
  notes: string;
  status: RequestStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface MessageThread {
  id: string;
  requestId?: string;
  clientId: string;
  providerId: string;
  messages: Message[];
}

export const CATEGORIES = [
  { key: 'photographer', label: 'Photo', icon: '📷' },
  { key: 'videographer', label: 'Video', icon: '🎥' },
  { key: 'makeup', label: 'Makeup Artist', icon: '💄' },
  { key: 'dj', label: 'DJ', icon: '🎧' },
  { key: 'catering', label: 'Catering', icon: '🍽️' },
  { key: 'florist', label: 'Florist / Decorator', icon: '💐' },
  { key: 'planner', label: 'Event Planner', icon: '📋' },
  { key: 'dancers', label: 'Dancers', icon: '💃' },
  { key: 'animators', label: 'Animators', icon: '🎪' },
  { key: 'art', label: 'Art', icon: '🎨' },
  { key: 'host', label: 'Host', icon: '🎤' },
  { key: 'cake', label: 'Cake / Desserts', icon: '🎂' },
  { key: 'rentals', label: 'Rentals', icon: '🏕️' },
  { key: 'stylist', label: 'Stylist', icon: '👗' },
  { key: 'cleaning', label: 'Cleaning', icon: '🧹' },
  { key: 'security', label: 'Security', icon: '🛡️' },
];
