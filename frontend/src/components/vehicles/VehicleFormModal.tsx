import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Check } from "lucide-react"

export interface VehicleFormData {
  placa: string
  tipo: string
}

interface VehicleFormModalProps {
  isOpen: boolean
  isEditing: boolean
  formData: VehicleFormData
  onClose: () => void
  onSubmit: () => void
  onChange: (field: keyof VehicleFormData, value: string) => void
}

export function VehicleFormModal({
  isOpen,
  isEditing,
  formData,
  onClose,
  onSubmit,
  onChange,
}: VehicleFormModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? "Editar Vehículo" : "Nuevo Vehículo"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Placa</label>
            <Input
              value={formData.placa}
              onChange={(e) => onChange("placa", e.target.value.toUpperCase())}
              placeholder="ABC-123"
              disabled={isEditing}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo</label>
            <select
              value={formData.tipo}
              onChange={(e) => onChange("tipo", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="DOCENTE">Docente</option>
              <option value="ESTUDIANTE">Estudiante</option>
              <option value="ADMINISTRATIVO">Administrativo</option>
              <option value="VISITANTE">Visitante</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={onSubmit}>
              <Check className="mr-2 h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
