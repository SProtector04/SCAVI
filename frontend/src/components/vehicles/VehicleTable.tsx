import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Edit, Trash2 } from "lucide-react"

export interface Vehiculo {
  placa: string
  tipo: string
}

interface VehicleTableProps {
  vehiculos: Vehiculo[]
  loading: boolean
  onEdit: (vehiculo: Vehiculo) => void
  onDelete: (placa: string) => void
  getTipoLabel: (tipo: string) => string
  getTipoColor: (tipo: string) => string
}

export function VehicleTable({
  vehiculos,
  loading,
  onEdit,
  onDelete,
  getTipoLabel,
  getTipoColor,
}: VehicleTableProps) {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Placa</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    Cargando...
                  </td>
                </tr>
              ) : vehiculos.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No se encontraron vehículos
                  </td>
                </tr>
              ) : (
                vehiculos.map((vehiculo) => (
                  <tr key={vehiculo.placa} className="hover:bg-muted/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-semibold text-foreground">{vehiculo.placa}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getTipoColor(vehiculo.tipo)}`}>
                        {getTipoLabel(vehiculo.tipo)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(vehiculo)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(vehiculo.placa)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
