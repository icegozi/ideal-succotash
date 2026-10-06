import { z } from "zod";
import { VALIDATION_MESSAGES } from "@/constants/messages";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGES.EMAIL.REQUIRED)
    .email(VALIDATION_MESSAGES.EMAIL.INVALID),
  password: z.string().min(1, VALIDATION_MESSAGES.PASSWORD.REQUIRED),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, VALIDATION_MESSAGES.NAME.MIN_LENGTH(2))
      .max(100, VALIDATION_MESSAGES.NAME.MAX_LENGTH(100)),
    email: z
      .string()
      .trim()
      .min(1, VALIDATION_MESSAGES.EMAIL.REQUIRED)
      .email(VALIDATION_MESSAGES.EMAIL.INVALID)
      .max(150, VALIDATION_MESSAGES.EMAIL.MAX_LENGTH(150)),
    password: z
      .string()
      .min(8, VALIDATION_MESSAGES.PASSWORD.MIN_LENGTH(8))
      .max(100, VALIDATION_MESSAGES.PASSWORD.MAX_LENGTH(100))
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, VALIDATION_MESSAGES.PASSWORD.FORMAT),
    confirmPassword: z.string().min(1, VALIDATION_MESSAGES.PASSWORD.CONFIRM_REQUIRED),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: VALIDATION_MESSAGES.PASSWORD.MISMATCH,
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
