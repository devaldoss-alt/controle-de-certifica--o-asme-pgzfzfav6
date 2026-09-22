import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Lock, KeyRound, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import pb from '@/lib/pocketbase/client'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Fluxo "Esqueceu a senha?"
  const [isResetMode, setIsResetMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetStatus, setResetStatus] = useState<{
    type: 'success' | 'error' | 'warning' | null
    message: string
  }>({ type: null, message: '' })
  const [resetLoading, setResetLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn(email, password)
    if (res.error) {
      setError('Credenciais inválidas. Tente novamente.')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetStatus({ type: null, message: '' })

    const targetEmail = resetEmail.trim().toLowerCase()
    if (!targetEmail) {
      setResetStatus({
        type: 'error',
        message: 'Por favor, informe seu e-mail corporativo cadastrado.',
      })
      setResetLoading(false)
      return
    }

    try {
      // Chamada nativa PocketBase requestPasswordReset
      await pb.collection('users').requestPasswordReset(targetEmail)
      setResetStatus({
        type: 'success',
        message: `Solicitação de redefinição enviada com sucesso para ${targetEmail}. Verifique sua caixa de entrada e siga as instruções para cadastrar sua nova senha.`,
      })
    } catch (err: any) {
      const errMsg = (err?.message || '').toLowerCase()
      // Detectar se o servidor falhou por falta de SMTP configurado
      if (
        errMsg.includes('smtp') ||
        errMsg.includes('mail') ||
        errMsg.includes('send') ||
        err?.status === 500
      ) {
        setResetStatus({
          type: 'warning',
          message:
            'O serviço de envio de e-mails (SMTP) não está configurado no servidor no momento. Por favor, contate o administrador do QualiHub para apoio com sua credencial.',
        })
      } else {
        setResetStatus({
          type: 'error',
          message:
            err?.message ||
            'Não foi possível solicitar a redefinição de senha. Verifique o e-mail informado.',
        })
      }
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-20 mix-blend-luminosity grayscale"
        style={{
          backgroundImage:
            'url(https://img.usecurling.com/p/1600/900?q=industrial%20factory&color=black)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-0" />

      {/* Floating accent glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md p-8 glass rounded-2xl shadow-2xl border-white/10 animate-fade-in-up">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            {isResetMode ? (
              <KeyRound className="w-8 h-8 text-primary" />
            ) : (
              <Lock className="w-8 h-8 text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2 tracking-tight">
            QualiHub
          </h1>
          <p className="text-muted-foreground text-sm">
            {isResetMode ? 'Recuperação de Acesso e Senha' : 'Controle de Qualidade ASME / NBIC'}
          </p>
        </div>

        {!isResetMode ? (
          <>
            {error && (
              <Alert
                variant="destructive"
                className="mb-6 bg-destructive/10 border-destructive/20 text-destructive"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">
                  Email Corporativo
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-primary"
                  placeholder="seu.nome@psc.com"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white/80">
                    Senha
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email)
                      setIsResetMode(true)
                      setError('')
                      setResetStatus({ type: null, message: '' })
                    }}
                    className="text-xs text-primary hover:underline hover:text-primary/90 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-black/20 border-white/10 text-white focus:border-primary"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={loading}
              >
                {loading ? 'Autenticando...' : 'Acesso Seguro'}
              </Button>
            </form>
          </>
        ) : (
          <div className="space-y-5">
            <div className="text-sm text-white/80 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10">
              Digite seu e-mail corporativo cadastrado. Enviaremos um link seguro via PocketBase
              para você redefinir sua senha.
            </div>

            {resetStatus.type === 'success' && (
              <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <AlertDescription>{resetStatus.message}</AlertDescription>
              </Alert>
            )}

            {resetStatus.type === 'error' && (
              <Alert
                variant="destructive"
                className="bg-destructive/10 border-destructive/20 text-destructive"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{resetStatus.message}</AlertDescription>
              </Alert>
            )}

            {resetStatus.type === 'warning' && (
              <Alert className="bg-amber-500/10 border-amber-500/30 text-amber-300">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <AlertDescription>{resetStatus.message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-white/80">
                  Email Corporativo
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-primary"
                  placeholder="ex: devaldoss@gmail.com"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={resetLoading}
              >
                {resetLoading ? 'Enviando instrução...' : 'Enviar Link de Redefinição'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsResetMode(false)
                  setResetStatus({ type: null, message: '' })
                }}
                className="w-full text-white/70 hover:text-white hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para o Login
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
