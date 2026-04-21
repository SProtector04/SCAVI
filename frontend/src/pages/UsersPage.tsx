import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, Mail, Building } from "lucide-react"
import api from "../api/axios"

interface Usuario {
  id: number
  username: string
  first_name?: string
  last_name?: string
  email?: string
  rol?: string
  departamento?: string
  is_active?: boolean
}

function UsersPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await api.get("/usuarios/")
        const data = response.data
        const usuariosArray = Array.isArray(data) ? data : (data.results || [])
        setUsuarios(usuariosArray)
      } catch (err) {
        console.error("Error fetching usuarios:", err)
        setError("No se pudieron cargar los usuarios.")
        setUsuarios([
          { id: 1, username: "mgarcia", first_name: "María", last_name: "García", email: "mgarcia@ulsa.edu.ni", rol: "Docente", departamento: "Ingeniería" },
          { id: 2, username: "cmartinez", first_name: "Carlos", last_name: "Martínez", email: "cmartinez@ulsa.edu.ni", rol: "Administrativo", departamento: "Recursos Humanos" },
          { id: 3, username: "alopez", first_name: "Ana", last_name: "López", email: "alopez@ulsa.edu.ni", rol: "Docente", departamento: "Ciencias" },
          { id: 4, username: "jrodriguez", first_name: "Juan", last_name: "Rodríguez", email: "jrodriguez@ulsa.edu.ni", rol: "Estudiante", departamento: "Arquitectura" },
          { id: 5, username: "lfernandez", first_name: "Laura", last_name: "Fernández", email: "lfernandez@ulsa.edu.ni", rol: "Docente", departamento: "Derecho" },
          { id: 6, username: "psanchez", first_name: "Pedro", last_name: "Sánchez", email: "psanchez@ulsa.edu.ni", rol: "Administrativo", departamento: "Finanzas" },
          { id: 7, username: "sherrera", first_name: "Sofía", last_name: "Herrera", email: "sherrera@ulsa.edu.ni", rol: "Estudiante", departamento: "Medicina" },
          { id: 8, username: "dramirez", first_name: "Diego", last_name: "Ramírez", email: "dramirez@ulsa.edu.ni", rol: "Docente", departamento: "Economía" },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchUsuarios()
  }, [])

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || ""
    const last = lastName?.charAt(0) || ""
    return (first + last).toUpperCase() || "?"
  }

  const getRoleBadgeVariant = (rol?: string) => {
    switch (rol?.toLowerCase()) {
      case "admin":
        return "destructive"
      case "docente":
        return "default"
      case "estudiante":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Lista de Usuarios Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-muted"></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {usuarios.map((usuario) => (
                <Card key={usuario.id} className="border-border bg-muted/30 shadow-sm">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(212,78%,27%)]/10">
                      <span className="text-xl font-bold text-[hsl(212,78%,27%)]">
                        {getInitials(usuario.first_name, usuario.last_name)}
                      </span>
                    </div>
                    <h3 className="font-medium text-foreground">
                      {usuario.first_name} {usuario.last_name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">@{usuario.username}</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        usuario.rol === "ADMIN" ? "bg-red-100 text-red-800" :
                        usuario.rol === "Docente" ? "bg-primary/10 text-primary" :
                        usuario.rol === "Estudiante" ? "bg-secondary/20 text-secondary" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {usuario.rol || "Usuario"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{usuario.departamento}</p>
                  </CardContent>
                </Card>
              ))}
              {usuarios.length === 0 && (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  No hay usuarios registrados
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default UsersPage
