import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

export default async function SignIn() {
  const signInUrl = await getSignInUrl();
  redirect(signInUrl);
} 