import axios from "axios";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./api";
import {
  ClaimAction,
  ClaimListItem,
  ClaimRole,
  ClaimRoom,
  ClaimStatus,
  ClaimSummary,
  MyMatchItem,
  PaginatedClaims,
  VerificationAnswer,
  VerificationQuestion,
  VerificationReviewStatus,
} from "../types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface MyClaimsOptions {
  role: ClaimRole;
  status?: ClaimStatus;
  page: number;
}

export interface SubmitVerificationAnswer {
  questionId: string;
  answer: string;
}

export async function getMyMatches(): Promise<MyMatchItem[]> {
  const response = await api.get<ApiResponse<MyMatchItem[]>>("/matches/my");
  return response.data.data;
}

export async function getMyClaims(
  options: MyClaimsOptions,
): Promise<PaginatedClaims> {
  const response = await api.get<ApiResponse<PaginatedClaims>>("/claims", {
    params: {
      role: options.role,
      status: options.status,
      page: options.page,
    },
  });
  return response.data.data;
}

export async function getClaim(claimId: string): Promise<ClaimRoom> {
  const response = await api.get<ApiResponse<ClaimRoom>>(`/claims/${claimId}`);
  return response.data.data;
}

export async function createClaim(matchId: string): Promise<ClaimSummary> {
  const response = await api.post<ApiResponse<ClaimSummary>>("/claims", {
    matchId,
  });
  return response.data.data;
}

export async function updateClaim(
  claimId: string,
  action: ClaimAction,
  reviewNotes?: string,
): Promise<ClaimListItem> {
  const response = await api.patch<ApiResponse<ClaimListItem>>(
    `/claims/${claimId}`,
    { action, reviewNotes },
  );
  return response.data.data;
}

export async function addVerificationQuestions(
  claimId: string,
  questions: string[],
): Promise<VerificationQuestion[]> {
  const response = await api.post<ApiResponse<VerificationQuestion[]>>(
    "/verification/questions",
    { claimId, questions },
  );
  return response.data.data;
}

export async function submitVerificationAnswers(
  answers: SubmitVerificationAnswer[],
): Promise<VerificationAnswer[]> {
  const response = await api.post<ApiResponse<VerificationAnswer[]>>(
    "/verification/answers",
    { answers },
  );
  return response.data.data;
}

export async function reviewVerificationAnswer(
  answerId: string,
  reviewStatus: Exclude<VerificationReviewStatus, "PENDING">,
): Promise<VerificationAnswer> {
  const response = await api.patch<ApiResponse<VerificationAnswer>>(
    `/verification/answers/${answerId}`,
    { reviewStatus },
  );
  return response.data.data;
}

export function getFriendlyClaimError(error: unknown): string {
  const message = axios.isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message || ""
    : error instanceof Error
      ? error.message
      : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("already have an active claim")) {
    return "You already requested this claim. Open My Claims to check its status.";
  }
  if (normalized.includes("active claim limit reached")) {
    return "You have reached the limit of 5 active claims. Resolve an existing claim before starting another.";
  }
  if (
    normalized.includes("cannot submit an ownership claim against your own") ||
    normalized.includes("only the owner of the lost report")
  ) {
    return "Only the owner of the lost item can request this claim.";
  }
  if (
    normalized.includes("status") ||
    normalized.includes("transition") ||
    normalized.includes("can only") ||
    normalized.includes("only the finder") ||
    normalized.includes("only the claimant")
  ) {
    return "This action is not available for the claim's current status or your role. Refresh and try again.";
  }

  return message || "Something went wrong. Please try again.";
}

const invalidateClaimData = async (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["claims"] }),
    queryClient.invalidateQueries({ queryKey: ["my-claims"] }),
    queryClient.invalidateQueries({ queryKey: ["my-matches"] }),
    queryClient.invalidateQueries({ queryKey: ["item-detail"] }),
    queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] }),
  ]);
};

function useClaimMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        throw new Error(getFriendlyClaimError(error));
      }
    },
    onSuccess: () => invalidateClaimData(queryClient),
  });
}

export function useMyMatches(enabled = true) {
  return useQuery({
    queryKey: ["my-matches"],
    queryFn: getMyMatches,
    enabled,
  });
}

export function useMyClaims(options: MyClaimsOptions, enabled = true) {
  return useQuery({
    queryKey: ["my-claims", options],
    queryFn: () => getMyClaims(options),
    enabled,
  });
}

export function useClaim(claimId: string, enabled = true) {
  return useQuery({
    queryKey: ["claims", claimId],
    queryFn: () => getClaim(claimId),
    enabled: Boolean(claimId) && enabled,
  });
}

export function useCreateClaim() {
  return useClaimMutation(createClaim);
}

export function useUpdateClaim() {
  return useClaimMutation(
    ({ claimId, action, reviewNotes }: {
      claimId: string;
      action: ClaimAction;
      reviewNotes?: string;
    }) => updateClaim(claimId, action, reviewNotes),
  );
}

export function useAddVerificationQuestions() {
  return useClaimMutation(
    ({ claimId, questions }: { claimId: string; questions: string[] }) =>
      addVerificationQuestions(claimId, questions),
  );
}

export function useSubmitVerificationAnswers() {
  return useClaimMutation(submitVerificationAnswers);
}

export function useReviewVerificationAnswer() {
  return useClaimMutation(
    ({ answerId, reviewStatus }: {
      answerId: string;
      reviewStatus: Exclude<VerificationReviewStatus, "PENDING">;
    }) => reviewVerificationAnswer(answerId, reviewStatus),
  );
}
