export type ReportType = "LOST" | "FOUND";
export type ReportStatus = "ACTIVE" | "MATCH_FOUND" | "RESOLVED" | "CLOSED";

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  createdAt: string;
  _count?: {
    reports: number;
  };
}

export interface Category {
  id: string;
  name: string;
  _count?: {
    reports: number;
  };
}

export interface MatchFactor {
  factor: string;
  weight: number;
  score: number;
  earned: number;
  matched: boolean;
  details: string;
}

export interface MatchItem {
  id: string;
  similarityScore: number;
  matchingFactors: MatchFactor[];
  createdAt: string;
  claim?: {
    id: string;
    status: string;
  } | null;
  counterpartType?: ReportType;
  counterpart?: ItemReport;
  myItem?: Partial<ItemReport>;
  matchedItem?: Partial<ItemReport>;
}

export interface ItemReport {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    profileImage?: string | null;
  };
  type: ReportType;
  categoryId: string;
  category: Category;
  itemName: string;
  brand?: string | null;
  color?: string | null;
  description: string;
  location: string;
  date: string;
  approximateTime?: string | null;
  imageUrl?: string | null;
  identifyingFeatures?: string | null;
  status: ReportStatus;
  matchesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedReports {
  reports: ItemReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  userStats: {
    totalLost: number;
    totalFound: number;
    activeMatches: number;
    resolvedItems: number;
    pendingClaims: number;
    successfulRecoveries: number;
  };
  systemStats: {
    totalLost: number;
    totalFound: number;
    totalMatches: number;
    totalResolved: number;
  };
  weeklyTrends?: {
    days: string[];
    reports: number[];
    matches: number[];
    percentIncrease: number;
  };
  recentNotifications?: NotificationItem[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface PaginatedNotifications {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}
