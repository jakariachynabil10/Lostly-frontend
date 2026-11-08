import { z } from "zod";
import { api } from "./api";

export interface RegisterResponse {
  email: string;
  requiresVerification: boolean;
}

const emailSchema = z.string().trim().toLowerCase().email();

const registerRequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: z.string().min(6),
});

const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

const verifyEmailRequestSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/),
});

const resendVerificationRequestSchema = z.object({ email: emailSchema });

export async function loginUser(email: string, password: string) {
  const credentials = loginRequestSchema.parse({ email, password });
  const response = await api.post("/auth/login", credentials);
  return response.data as {
    success: boolean;
    data: {
      user: {
        id: string;
        name: string;
        email: string;
        profileImage?: string | null;
        createdAt: string;
      };
      accessToken: string;
      refreshToken: string;
    };
  };
}

export async function registerUser(name: string, email: string, password: string) {
  const input = registerRequestSchema.parse({ name, email, password });
  const response = await api.post("/auth/register", input);
  return response.data as { success: boolean; data: RegisterResponse };
}

export async function verifyEmail(email: string, code: string) {
  const input = verifyEmailRequestSchema.parse({ email, code });
  const response = await api.post("/auth/verify-email", input);
  return response.data as {
    success: boolean;
    data: {
      user: {
        id: string;
        name: string;
        email: string;
        profileImage?: string | null;
        createdAt: string;
      };
      accessToken: string;
      refreshToken: string;
    };
  };
}

export async function resendVerification(email: string) {
  const input = resendVerificationRequestSchema.parse({ email });
  const response = await api.post("/auth/resend-verification", input);
  return response.data as { success: boolean; message: string };
}
