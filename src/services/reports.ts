import type { Checklist, User } from '@/services/api'
import { format } from 'date-fns'
import { safeFormatDate } from '@/lib/safe-data'

export function generateComplianceReport(
  checklists: Checklist[],
  _users: User[],
  t: (key: string) => string,
) {
  const date = format(new Date(), 'dd/MM/yyyy')
  const pending = checklists.filter((c) => c.status === 'pending').length
  const completed = checklists.filter((c) => c.status === 'completed').length
  const approved = checklists.filter((c) => c.approval_status === 'approved').length
  const critical = checklists.filter((c) => c.is_critical && c.status === 'pending').length

  const rows = checklists
    .map((c) => {
      const due = safeFormatDate(c.due_date, 'dd/MM/yyyy', '-')
      const st =
        c.approval_status === 'approved'
          ? t('report.statusApproved')
          : c.approval_status === 'rejected'
            ? t('report.statusRejected')
            : c.status === 'completed'
              ? t('report.statusCompleted')
              : t('report.statusPending')
      return `<tr><td>${c.title}</td><td>${c.role_assigned}</td><td>${c.mcq_ref || '-'}</td><td>${st}</td><td>${due}</td><td>${c.is_critical ? t('report.yes') : t('report.no')}</td></tr>`
    })
    .join('')

  const html = `<!DOCTYPE html><html><head><title>${t('report.title')} - PSC Proserco</title>
<style>body{font-family:Arial,sans-serif;margin:40px;color:#222}.header{text-align:center;margin-bottom:30px;border-bottom:3px solid #c8a834;padding-bottom:20px}.logo{font-size:28px;font-weight:bold;color:#c8a834;letter-spacing:2px}.subtitle{font-size:14px;color:#666;margin-top:5px}.stats{display:flex;gap:15px;margin-bottom:30px}.stat{flex:1;background:#f8f8f8;padding:15px;border-radius:8px;text-align:center;border:1px solid #e0e0e0}.stat-value{font-size:28px;font-weight:bold;color:#333}.stat-label{font-size:11px;color:#888;text-transform:uppercase}table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #ddd;font-size:12px}th{background:#f5f5f5;font-weight:bold;text-transform:uppercase;font-size:11px}@media print{body{margin:10px}}</style>
</head><body><div class="header"><div class="logo">PSC PROSERCO</div><div class="subtitle">${t('report.title')} - ${date}</div></div>
<div class="stats"><div class="stat"><div class="stat-value">${checklists.length}</div><div class="stat-label">${t('report.total')}</div></div><div class="stat"><div class="stat-value">${pending}</div><div class="stat-label">${t('report.pending')}</div></div><div class="stat"><div class="stat-value">${completed}</div><div class="stat-label">${t('report.completed')}</div></div><div class="stat"><div class="stat-value">${approved}</div><div class="stat-label">${t('report.approved')}</div></div><div class="stat"><div class="stat-value">${critical}</div><div class="stat-label">${t('report.critical')}</div></div></div>
<table><thead><tr><th>${t('report.colTitle')}</th><th>${t('report.colRole')}</th><th>${t('report.colRef')}</th><th>${t('report.colStatus')}</th><th>${t('report.colDeadline')}</th><th>${t('report.colCritical')}</th></tr></thead><tbody>${rows}</tbody></table>
<script>window.onload=function(){window.print()}</script></body></html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
