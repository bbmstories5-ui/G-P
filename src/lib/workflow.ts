export type WorkflowStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_DESIGN'
  | 'PENDING_APPROVAL'
  | 'REVISION_REQUIRED'
  | 'RESUBMITTED'
  | 'FINAL_APPROVED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

// Allowed valid workflow state transitions
const VALID_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  DRAFT: ['PENDING', 'CANCELLED'],
  PENDING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_DESIGN', 'PENDING_APPROVAL', 'PENDING'],
  IN_DESIGN: ['PENDING_APPROVAL', 'REVISION_REQUIRED', 'CANCELLED'],
  PENDING_APPROVAL: ['FINAL_APPROVED', 'REVISION_REQUIRED', 'REJECTED'],
  REVISION_REQUIRED: ['IN_DESIGN', 'RESUBMITTED', 'PENDING_APPROVAL'],
  RESUBMITTED: ['PENDING_APPROVAL', 'FINAL_APPROVED', 'REVISION_REQUIRED', 'REJECTED'],
  FINAL_APPROVED: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: ['PENDING', 'CANCELLED'],
  CANCELLED: [],
};

export function isValidTransition(from: WorkflowStatus, to: WorkflowStatus): boolean {
  const allowed = VALID_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function formatStatusLabel(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'PENDING':
      return 'Pending Assignment';
    case 'ASSIGNED':
      return 'Assigned';
    case 'IN_DESIGN':
      return 'In Design';
    case 'PENDING_APPROVAL':
      return 'Pending Approval';
    case 'REVISION_REQUIRED':
      return 'Revision Required';
    case 'RESUBMITTED':
      return 'Resubmitted';
    case 'FINAL_APPROVED':
      return 'Approved';
    case 'COMPLETED':
      return 'Completed';
    case 'REJECTED':
      return 'Rejected';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

export function getStatusTheme(status: string): { bg: string; text: string; border: string; dot: string } {
  switch (status) {
    case 'PENDING':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    case 'ASSIGNED':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
    case 'IN_DESIGN':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' };
    case 'PENDING_APPROVAL':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' };
    case 'REVISION_REQUIRED':
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' };
    case 'RESUBMITTED':
      return { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' };
    case 'FINAL_APPROVED':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'COMPLETED':
      return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500' };
    case 'REJECTED':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' };
    case 'CANCELLED':
      return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300', dot: 'bg-slate-400' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' };
  }
}
