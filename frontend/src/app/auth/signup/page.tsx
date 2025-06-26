import { getSignUpUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

export default async function SignUp() {
  const signUpUrl = await getSignUpUrl();
  redirect(signUpUrl);
} 