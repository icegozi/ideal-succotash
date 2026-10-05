"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/shared/Button";
import { FormField, Input, PasswordInput } from "@/components/shared/form";
import { registerAction } from "@/modules/auth/actions/auth.actions";
import { type RegisterInput, registerSchema } from "@/modules/auth/schemas/auth.schema";
import type { AuthActionState } from "@/modules/auth/types/auth.types";

export function RegisterForm() {
  const router = useRouter();
  const [formState, setFormState] = useState<AuthActionState>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setFormState({ status: "idle" });

    const result = await registerAction({ status: "idle" }, data);
    setFormState(result);

    if (result.status === "success" && result.redirectTo) {
      router.push(result.redirectTo);
      router.refresh();
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {formState.status === "error" && formState.message ? (
        <div className="auth-alert" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{formState.message}</span>
        </div>
      ) : null}

      {formState.status === "success" && formState.message ? (
        <div className="auth-alert auth-alert-success" role="status">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{formState.message}</span>
        </div>
      ) : null}

      <FormField
        id="register-name"
        label="Họ và tên cán bộ"
        required
        error={errors.name?.message || formState.fieldErrors?.name?.[0]}
      >
        <Input
          id="register-name"
          type="text"
          autoComplete="name"
          autoFocus
          placeholder="Dược sĩ Nguyễn Văn A"
          hasError={Boolean(errors.name || formState.fieldErrors?.name)}
          {...register("name")}
        />
      </FormField>

      <FormField
        id="register-email"
        label="Email công vụ"
        required
        error={errors.email?.message || formState.fieldErrors?.email?.[0]}
      >
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="nguyenvana@medstock.local"
          hasError={Boolean(errors.email || formState.fieldErrors?.email)}
          {...register("email")}
        />
      </FormField>

      <FormField
        id="register-password"
        label="Mật khẩu"
        required
        hint="Tối thiểu 8 ký tự, phải gồm cả chữ và số"
        error={errors.password?.message || formState.fieldErrors?.password?.[0]}
      >
        <PasswordInput
          id="register-password"
          autoComplete="new-password"
          placeholder="••••••••"
          hasError={Boolean(errors.password || formState.fieldErrors?.password)}
          {...register("password")}
        />
      </FormField>

      <FormField
        id="register-confirm-password"
        label="Xác nhận mật khẩu"
        required
        error={errors.confirmPassword?.message || formState.fieldErrors?.confirmPassword?.[0]}
      >
        <PasswordInput
          id="register-confirm-password"
          autoComplete="new-password"
          placeholder="••••••••"
          hasError={Boolean(errors.confirmPassword || formState.fieldErrors?.confirmPassword)}
          {...register("confirmPassword")}
        />
      </FormField>

      <div className="auth-actions">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting || formState.status === "success"}
        >
          {isSubmitting ? "Đang xử lý đăng ký…" : "Đăng ký tài khoản"}
        </Button>
      </div>

      <div className="auth-footer">
        <span>Đã có tài khoản công vụ?</span>
        <Link href="/login">Đăng nhập ngay</Link>
      </div>
    </form>
  );
}
