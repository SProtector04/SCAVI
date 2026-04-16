import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Building, Shield, Bell, Lock, Save, CheckCircle } from "lucide-react"
import api from "../api/axios"

interface UserProfile {
  id: number
  username: string
  first_name?: string
  last_name?: string
  email?: string
  rol?: string
  departamento?: string
  telefono?: string
  is_active?: boolean
}

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    telefono: "",
    departamento: "",
  })
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weekly: false,
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
          telefono: userData.telefono || "",
          departamento: userData.departamento || "",
        })
      } catch {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setProfile(userData)
          setFormData({
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            email: userData.email || "",
            telefono: userData.telefono || "",
            departamento: userData.departamento || "",
          })
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch("/auth/me/", formData)
      setProfile({ ...profile, ...formData })
      localStorage.setItem("user", JSON.stringify({ ...profile, ...formData }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Error saving profile:", error)
      localStorage.setItem("user", JSON.stringify({ ...profile, ...formData }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Perfil</h1>
        <p className="text-muted-foreground">Aquí podrás consultar y actualizar la información de tu cuenta</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="border-border bg-card shadow-sm lg:row-span-2">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[hsl(212,78%,27%)]">
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
              {profile?.departamento && (
                <div className="flex items-center gap-3 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.departamento}</span>
                </div>
              )}
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Teléfono</label>
                <Input
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+505 XXXX-XXXX"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Departamento</label>
              <Input
                value={formData.departamento}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                placeholder="Departamento"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saved ? <CheckCircle className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                {saving ? "Guardando..." : saved ? "Guardado" : "Guardar Cambios"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-foreground">Alertas por correo</label>
                <p className="text-xs text-muted-foreground">Recibir alertas de seguridad en tu correo</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-foreground">Notificaciones push</label>
                <p className="text-xs text-muted-foreground">Mostrar alertas instantáneas en el panel</p>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-foreground">Resumen diario</label>
                <p className="text-xs text-muted-foreground">Enviar reporte diario de actividad</p>
              </div>
              <Switch
                checked={notifications.weekly}
                onCheckedChange={(checked) => setNotifications({ ...notifications, weekly: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-foreground">Cambiar contraseña</label>
                <p className="text-xs text-muted-foreground">Último cambio: hace 30 días</p>
              </div>
              <Button variant="outline" size="sm">
                <Lock className="mr-2 h-4 w-4" />
                Cambiar
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-foreground">Autenticación de dos factores</label>
                <p className="text-xs text-muted-foreground">Añade una capa extra de seguridad</p>
              </div>
              <Button variant="outline" size="sm">
                Activar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage
