import { redirect } from 'next/navigation';

// Registration happens automatically on first Google sign-in.
export default function RegisterPage() {
  redirect('/login');
}
