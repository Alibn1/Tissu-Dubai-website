import {redirect} from 'next/navigation';

// /admin itself has no page: the (protected) layout sends anonymous visitors to
// the login form first, and authenticated ones land on the dashboard.
export default function AdminIndexPage() {
  redirect('/admin/dashboard');
}
