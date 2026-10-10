export default function TeacherPortalLayout({ children }: { children: React.ReactNode }) {
  // Teacher Portal is full-screen, mobile-first — no sidebar or admin header
  return <>{children}</>;
}
