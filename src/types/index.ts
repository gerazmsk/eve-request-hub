export type UserRole = 'client' | 'provider';

export type RequestStatus = 'pending' | 'confirmed' | 'declined';

export type ProviderEventStatus = 'pending' | 'approved' | 'canceled' | 'completed';

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
