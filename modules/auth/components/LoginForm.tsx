"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/shared/Button";
import { Checkbox, FormField, Input, PasswordInput } from "@/components/shared/form";
import { loginAction } from "@/modules/auth/actions/auth.actions";
import { type LoginInput, loginSchema } from "@/modules/auth/schemas/auth.schema";
import type { AuthActionState } from "@/modules/auth/types/auth.types";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [formState, setFormState] = useState<AuthActionState>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setFormState({ status: "idle" });

    const result = await loginAction({ status: "idle" }, { ...data, returnUrl });
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
        id="login-email"
        label="Email công vụ"
        required
        error={errors.email?.message || formState.fieldErrors?.email?.[0]}
      >
        <Input
          id="login-email"
          type="email"
          autoComplete="username"
          autoFocus
          placeholder="duocsi@medstock.local"
          hasError={Boolean(errors.email || formState.fieldErrors?.email)}
          {...register("email")}
        />
      </FormField>

      <FormField
        id="login-password"
        label="Mật khẩu"
        required
        error={errors.password?.message || formState.fieldErrors?.password?.[0]}
      >
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          placeholder="••••••••"
          hasError={Boolean(errors.password || formState.fieldErrors?.password)}
          {...register("password")}
        />
      </FormField>

      <div className="auth-remember-row">
        <Checkbox
          label="Ghi nhớ đăng nhập (30 ngày)"
          {...register("rememberMe")}
        />
      </div>

      <div className="auth-actions">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isSubmitting}
          disabled={isSubmitting || formState.status === "success"}
        >
          {isSubmitting ? "Đang xác thực…" : "Đăng nhập hệ thống"}
        </Button>
      </div>

      <div className="auth-footer">
        <span>Chưa có tài khoản công vụ?</span>
        <Link href={`/register${returnUrl !== "/" ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`}>
          Đăng ký ngay
        </Link>
      </div>
    </form>
  );
}
