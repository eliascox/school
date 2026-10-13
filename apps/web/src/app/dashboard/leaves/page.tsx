import { redirect } from 'next/navigation';

export default function LeavesRedirectPage() {
  redirect('/dashboard/teacher?tab=leave_applications');
}
