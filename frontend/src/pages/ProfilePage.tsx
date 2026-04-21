import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Save, CheckCircle } from "lucide-react"
import api from "../api/axios"

interface UserProfile {
  id: number
  username: string
  first_name?: string
  last_name?: string
  email?: string
  rol?: string
  is_active?: boolean
}

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/auth/me/")
        const userData = response.data
        setProfile(userData)
        setFormData({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
        })
      } catch (error) {
        console.error("Error cargando perfil:", error)
        setErrorMsg("Error al cargar los datos del perfil desde el servidor.")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setErrorMsg(null)
    try {
      await api.patch("/auth/me/", formData)
      setProfile({ ...profile, ...formData } as UserProfile)
      localStorage.setItem("user", JSON.stringify({ ...profile, ...formData }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Error guardando perfil:", error)
      setErrorMsg("Error al guardar los cambios en el servidor. Intente de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  const getInitials = () => {
    if (!profile) return "?"
    const first = profile.first_name?.charAt(0) || ""
    const last = profile.last_name?.charAt(0) || ""
    return (first + last).toUpperCase() || profile.username?.charAt(0).toUpperCase() || "?"
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-800 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="border-border bg-card shadow-sm lg:row-span-2">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-green-800">
              <span className="text-3xl font-bold text-white">{getInitials()}</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="text-muted-foreground">@{profile?.username}</p>
            <div className="mt-3">
              <Badge variant={profile?.rol === "ADMIN" ? "destructive" : "default"}>
                {profile?.rol || "Usuario"}
              </Badge>
            </div>
            <div className="mt-6 w-full space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{profile?.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="border-border bg-card shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nombre</label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Nombre"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Apellido</label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Apellido"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Correo electrónico</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
            
            {errorMsg && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
                {errorMsg}
              </div>
            )}
            
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="bg-green-800 hover:bg-green-900 text-white">
                {saved ? <CheckCircle className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                {saving ? "Guardando..." : saved ? "Guardado con éxito" : "Guardar Cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage
