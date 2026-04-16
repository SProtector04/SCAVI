import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Settings as SettingsIcon, Save, Bell, Shield, Clock } from "lucide-react"

function SettingsPage() {
  const [institutionName, setInstitutionName] = useState("Universidad Tecnológica La Salle")
  const [timezone, setTimezone] = useState("america-managua")
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [realTimeNotifications, setRealTimeNotifications] = useState(true)
  const [dailySummary, setDailySummary] = useState(false)
  const [barrierTime, setBarrierTime] = useState("5")
  const [maxAttempts, setMaxAttempts] = useState("3")
  const [precision, setPrecision] = useState("alto")

  const handleSave = () => {
    console.log("Guardando configuración...")
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">Administra la configuración del sistema</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar Cambios
        </Button>
      </div>

      {/* Configuración General */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <SettingsIcon className="h-5 w-5" />
            Configuración General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="institucion">Nombre de la Institución</Label>
              <Input
                id="institucion"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                placeholder="Universidad Tecnológica La Salle"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zona-horaria">Zona Horaria</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="zona-horaria">
                  <SelectValue placeholder="Seleccionar zona horaria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="america-managua">América/Managua (UTC-6)</SelectItem>
                  <SelectItem value="america-mexico">América/México (UTC-6)</SelectItem>
                  <SelectItem value="america-bogota">América/Bogotá (UTC-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas por correo electrónico</Label>
              <p className="text-sm text-muted-foreground">Recibir alertas de seguridad en tu correo</p>
            </div>
            <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones en tiempo real</Label>
              <p className="text-sm text-muted-foreground">Mostrar alertas instantáneas en el panel</p>
            </div>
            <Switch checked={realTimeNotifications} onCheckedChange={setRealTimeNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Resumen diario</Label>
              <p className="text-sm text-muted-foreground">Enviar reporte diario de actividad</p>
            </div>
            <Switch checked={dailySummary} onCheckedChange={setDailySummary} />
          </div>
        </CardContent>
      </Card>

      {/* Parámetros de Acceso */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Shield className="h-5 w-5" />
            Parámetros de Acceso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tiempo-apertura">Tiempo de apertura de barrera (segundos)</Label>
              <Input
                id="tiempo-apertura"
                type="number"
                value={barrierTime}
                onChange={(e) => setBarrierTime(e.target.value)}
                placeholder="5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intentos">Intentos máximos antes de bloqueo</Label>
              <Input
                id="intentos"
                type="number"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                placeholder="3"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="precision">Nivel de precisión de reconocimiento</Label>
            <Select value={precision} onValueChange={setPrecision}>
              <SelectTrigger id="precision">
                <SelectValue placeholder="Seleccionar nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bajo">Bajo (más rápido, menos preciso)</SelectItem>
                <SelectItem value="medio">Medio (equilibrado)</SelectItem>
                <SelectItem value="alto">Alto (más lento, más preciso)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Información del Sistema */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Clock className="h-5 w-5" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Versión</p>
              <p className="text-lg font-semibold text-foreground">1.0.0</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Estado</p>
              <p className="text-lg font-semibold text-green-600">Activo</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Última Actualización</p>
              <p className="text-lg font-semibold text-foreground">16/04/2026</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Uptime</p>
              <p className="text-lg font-semibold text-foreground">15 días</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SettingsPage