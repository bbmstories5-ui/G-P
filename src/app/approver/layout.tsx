import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import TopNoticeBar from '@/components/TopNoticeBar';

export default async function ApproverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser(undefined, 'APPROVER');

  if (!user) {
    redirect('/login/approver');
  }

  if (user.role !== 'APPROVER' && user.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-[#F2F4F7] overflow-hidden font-sans">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden m-0 sm:m-2.5 lg:my-3 lg:mr-3 bg-white rounded-none sm:rounded-[20px] lg:rounded-[26px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border-0 sm:border border-slate-200/80">
        <Topbar user={user} title="Lead Approver Portal — Creative Governance" />
        <TopNoticeBar />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

