import WebcamCapture from "../components/WebcamCapture"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface User {
  rol: string;
  [key: string]: unknown;
}

function isAdmin(): boolean {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return false;
    const user = JSON.parse(userStr) as User;
    return user?.rol === "ADMIN";
  } catch {
    return false;
  }
}

function CameraPage() {
  const admin = isAdmin();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cámara ANPR</h1>
          <p className="text-muted-foreground">
            Detecta vehículos y lee matrículas en tiempo real
          </p>
        </div>
        
        {admin && (
          <Button 
            className="w-full sm:w-auto"
            onClick={() => alert("Función para añadir cámaras RTSP/IP próximamente.")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir Cámara
          </Button>
        )}
      </div>

      <div className="max-w-2xl">
        <WebcamCapture />
      </div>
    </div>
  )
}

export default CameraPage