import { redirect } from 'next/navigation';

// There are no passwords anymore — recovery happens on the sign-in page
// via the 12-word phrase when a new browser needs access.
export default function ResetPasswordPage() {
  redirect('/login');
}
