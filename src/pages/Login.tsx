import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Lock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2 tracking-tight">
            QualiHub
          </h1>
          <p className="text-muted-foreground text-sm">Controle de Qualidade ASME / NBIC</p>
        </div>

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
            <Label htmlFor="password" className="text-white/80">
              Senha
            </Label>
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
      </div>
    </div>
  )
}
