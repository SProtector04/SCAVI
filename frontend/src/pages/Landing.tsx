import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, AlertTriangle, Settings, Car, Menu, X } from "lucide-react"
import { Link } from "react-router-dom"

function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const benefits = [
    {
      icon: Shield,
      title: "Seguridad Reforzada",
      desc: "Control automatizado de acceso con reconocimiento de placas vehiculares y verificación en tiempo real contra la base de datos institucional.",
    },
    {
      icon: AlertTriangle,
      title: "Reducción de Errores",
      desc: "Elimina el factor de error humano en la verificación de acceso. Sistema automatizado con precisión superior al 98% en reconocimiento.",
    },
    {
      icon: Settings,
      title: "Optimización Operativa",
      desc: "Reduce tiempos de espera en puntos de acceso y optimiza la asignación de personal de seguridad con automatización inteligente.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-800">
              <Car className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">SCAVI</span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#beneficios" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Beneficios
            </a>
            <a href="#contacto" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Contacto
            </a>
            <Link
              to="/login"
              className="rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              Iniciar Sesión
            </Link>
          </nav>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border bg-card px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-4">
              <a href="#beneficios" className="text-sm font-medium text-muted-foreground">
                Beneficios
              </a>
              <a href="#contacto" className="text-sm font-medium text-muted-foreground">
                Contacto
              </a>
              <Link
                to="/login"
                className="rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                Iniciar Sesión
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-muted/50 to-background px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <Car className="h-4 w-4 text-green-800" />
            <span>Universidad Tecnológica La Salle</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Sistema de Control de Acceso Vehicular Institucional
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Automatiza y optimiza el control de acceso vehicular en tu institución con tecnología de
            reconocimiento de placas, monitoreo en tiempo real y gestión centralizada de usuarios.
          </p>
          <div className="mt-10">
            <Link
              to="/login"
              className="inline-flex rounded-lg bg-green-800 px-8 py-3 text-lg font-medium text-white transition-colors hover:bg-green-700"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="bg-background px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Beneficios Clave</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Transforma la gestión de acceso vehicular en tu institución
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((benefit, i) => {
              const Icon = benefit.icon
              return (
                <Card key={i} className="border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col items-center p-8 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-800/10">
                      <Icon className="h-7 w-7 text-green-800" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{benefit.title}</h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">{benefit.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="border-t border-border bg-card px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-800">
                <Car className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">SCAVI</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              © 2026 SCAVI - Universidad Tecnológica La Salle. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing