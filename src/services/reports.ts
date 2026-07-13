import type { Checklist, User } from '@/services/api'
import { format } from 'date-fns'

export function generateComplianceReport(checklists: Checklist[], _users: User[]) {
  const date = format(new Date(), 'dd/MM/yyyy')
  const pending = checklists.filter((c) => c.status === 'pending').length
  const completed = checklists.filter((c) => c.status === 'completed').length
  const approved = checklists.filter((c) => c.approval_status === 'approved').length
  const critical = checklists.filter((c) => c.is_critical && c.status === 'pending').length

  const rows = checklists
    .map((c) => {
      const due = c.due_date ? format(new Date(c.due_date), 'dd/MM/yyyy') : '-'
      const st =
        c.approval_status === 'approved'
          ? 'Aprovado'
          : c.approval_status === 'rejected'
            ? 'Rejeitado'
            : c.status === 'completed'
              ? 'Concluido'
              : 'Pendente'
      return `<tr><td>${c.title}</td><td>${c.role_assigned}</td><td>${c.mcq_ref || '-'}</td><td>${st}</td><td>${due}</td><td>${c.is_critical ? 'Sim' : 'Nao'}</td></tr>`
    })
    .join('')

  const html = `<!DOCTYPE html><html><head><title>Relatorio de Conformidade - PSC Proserco</title>
<style>body{font-family:Arial,sans-serif;margin:40px;color:#222}.header{text-align:center;margin-bottom:30px;border-bottom:3px solid #c8a834;padding-bottom:20px}.logo{font-size:28px;font-weight:bold;color:#c8a834;letter-spacing:2px}.subtitle{font-size:14px;color:#666;margin-top:5px}.stats{display:flex;gap:15px;margin-bottom:30px}.stat{flex:1;background:#f8f8f8;padding:15px;border-radius:8px;text-align:center;border:1px solid #e0e0e0}.stat-value{font-size:28px;font-weight:bold;color:#333}.stat-label{font-size:11px;color:#888;text-transform:uppercase}table{width:100%;border-collapse:collapse}th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #ddd;font-size:12px}th{background:#f5f5f5;font-weight:bold;text-transform:uppercase;font-size:11px}@media print{body{margin:10px}}</style>
</head><body><div class="header"><div class="logo">PSC PROSERCO</div><div class="subtitle">Relatorio de Conformidade ASME/NBIC - ${date}</div></div>
<div class="stats"><div class="stat"><div class="stat-value">${checklists.length}</div><div class="stat-label">Total</div></div><div class="stat"><div class="stat-value">${pending}</div><div class="stat-label">Pendentes</div></div><div class="stat"><div class="stat-value">${completed}</div><div class="stat-label">Concluidos</div></div><div class="stat"><div class="stat-value">${approved}</div><div class="stat-label">Aprovados</div></div><div class="stat"><div class="stat-value">${critical}</div><div class="stat-label">Criticos</div></div></div>
<table><thead><tr><th>Titulo</th><th>Cargo</th><th>Ref.</th><th>Status</th><th>Vencimento</th><th>Critico</th></tr></thead><tbody>${rows}</tbody></table>
<script>window.onload=function(){window.print()}</script></body></html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
