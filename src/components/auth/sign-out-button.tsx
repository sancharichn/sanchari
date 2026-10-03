"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SignOutButton(props: Omit<ButtonProps, "onClick">) {
  const [pending, setPending] = useState(false);
  return (
    <Button
      variant="outline"
      {...props}
      disabled={pending || props.disabled}
      onClick={() => {
        setPending(true);
        void signOut({ callbackUrl: "/" });
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
