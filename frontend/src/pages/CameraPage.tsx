import WebcamCapture from "../components/WebcamCapture"

function CameraPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cámara ANPR</h1>
        <p className="text-muted-foreground">
          Detecta vehículos y lee matrículas en tiempo real
        </p>
      </div>

      <div className="max-w-2xl">
        <WebcamCapture />
      </div>
    </div>
  )
}

export default CameraPage