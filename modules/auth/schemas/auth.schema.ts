import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email không được để trống.")
    .email("Định dạng email không hợp lệ."),
  password: z.string().min(1, "Mật khẩu không được để trống."),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Họ và tên tối thiểu 2 ký tự.")
      .max(100, "Tối đa 100 ký tự."),
    email: z
      .string()
      .trim()
      .min(1, "Email không được để trống.")
      .email("Định dạng email không hợp lệ.")
      .max(150, "Tối đa 150 ký tự."),
    password: z
      .string()
      .min(8, "Mật khẩu phải có tối thiểu 8 ký tự.")
      .max(100, "Tối đa 100 ký tự.")
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "Mật khẩu phải chứa cả chữ cái và chữ số."),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
