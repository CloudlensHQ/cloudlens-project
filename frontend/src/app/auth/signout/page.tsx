"use server";

import { signOut } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";

export default async function SignOutPage() {
  await signOut();
  redirect("/");
}
