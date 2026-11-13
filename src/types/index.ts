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

export type ClaimStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export type ClaimRole = "claimant" | "finder";

export type ClaimAction = "approve" | "reject" | "cancel" | "complete";

export type VerificationReviewStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface ClaimSummary {
  id: string;
  status: ClaimStatus;
}

export interface ClaimListItem {
  id: string;
  matchId: string;
  claimantId: string;
  finderId: string;
  status: ClaimStatus;
  createdAt: string;
  updatedAt: string;
  claimant: Pick<User, "id" | "name" | "profileImage">;
  finder: Pick<User, "id" | "name" | "profileImage">;
  match: {
    lostReport: Pick<
      ItemReport,
      "id" | "itemName" | "imageUrl" | "location" | "date" | "status"
    >;
    foundReport: Pick<
      ItemReport,
      "id" | "itemName" | "imageUrl" | "location" | "date" | "status"
    >;
  };
  _count: { questions: number };
}

export interface PaginatedClaims {
  claims: ClaimListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MyMatchItem extends Omit<MatchItem, "myItem" | "matchedItem"> {
  myItem: Pick<
    ItemReport,
    "id" | "itemName" | "type" | "imageUrl" | "status" | "location" | "date"
  >;
  matchedItem: Pick<
    ItemReport,
    "id" | "itemName" | "type" | "imageUrl" | "status" | "location" | "date"
  > & { user?: Pick<User, "id" | "name"> };
  claim?: ClaimSummary | null;
  claimsReceivedCount?: number;
}

export interface ClaimableMatch extends MatchItem {
  counterpart: ItemReport;
  claim?: ClaimSummary | null;
  claimsReceivedCount?: number;
}

export interface ClaimRoom {
  id: string;
  matchId: string;
  claimantId: string;
  finderId: string;
  status: ClaimStatus;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  userRole: ClaimRole;
  claimant: Pick<User, "id" | "name" | "profileImage"> & { email?: string };
  finder: Pick<User, "id" | "name" | "profileImage"> & { email?: string };
  match: {
    lostReport: ItemReport;
    foundReport: ItemReport;
  };
  questions: VerificationQuestion[];
}

export interface VerificationQuestion {
  id: string;
  claimId: string;
  question: string;
  createdAt: string;
  answers: VerificationAnswer[];
}

export interface VerificationAnswer {
  id: string;
  questionId: string;
  claimantId: string;
  answer: string;
  reviewStatus: VerificationReviewStatus;
  createdAt: string;
  updatedAt: string;
}
