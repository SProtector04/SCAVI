import { useRef, useState, useEffect, useCallback } from "react"
import { Camera, CameraOff, Search, Loader2 } from "lucide-react"
import api from "../api/axios"

interface DetectionResult {
  plate_text?: string
  text?: string
  confidence: number
  bbox?: [number, number, number, number]
  class_name?: string
  class?: string
}

function WebcamCapture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  
  const [isStreaming, setIsStreaming] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [detections, setDetections] = useState<DetectionResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [streamActive, setStreamActive] = useState(false)

  const getCameraErrorMessage = (err: unknown) => {
    const name = err && typeof err === "object" && "name" in err ? String((err as { name?: string }).name) : ""

    switch (name) {
      case "NotAllowedError":
      case "PermissionDeniedError":
        return "El navegador bloqueó la cámara. Acepta el permiso o revisa la configuración del sitio."
      case "NotFoundError":
        return "No se encontró ninguna cámara disponible en este equipo."
      case "NotReadableError":
        return "La cámara está ocupada o no pudo abrirse. Cierra otras apps que la estén usando."
      case "OverconstrainedError":
        return "La cámara disponible no cumple con las restricciones solicitadas."
      case "SecurityError":
        return "La cámara solo funciona en HTTPS o localhost."
      default:
        return "No se pudo acceder a la cámara. Verifica HTTPS, permisos y que exista un dispositivo disponible."
    }
  }

  const startCamera = useCallback(async () => {
    try {
      if (!window.isSecureContext) {
        setError("La cámara solo funciona en HTTPS o localhost.")
        return
      }

      const constraints = [
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        },
        { video: true },
      ] as const

      let stream: MediaStream | null = null
      for (const config of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(config)
          break
        } catch {
          continue
        }
      }

      if (!stream) {
        throw new Error("No camera stream available")
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsStreaming(true)
        setStreamActive(true)
        setError(null)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError(getCameraErrorMessage(err))
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
    setStreamActive(false)
    setDetections([])
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext("2d")
      if (ctx) ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    return () => {
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const drawBoundingBoxes = useCallback((ctx: CanvasRenderingContext2D, results: DetectionResult[]) => {
    results.forEach((det) => {
      if (det.bbox) {
        const [x1, y1, x2, y2] = det.bbox
        ctx.strokeStyle = "#22c55e"
        ctx.lineWidth = 3
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
        
        ctx.fillStyle = "#22c55e"
        ctx.font = "bold 14px sans-serif"
        ctx.fillText(`${det.plate_text || det.text || det.class_name || det.class} (${(det.confidence * 100).toFixed(0)}%)`, x1, y1 - 8)
      }
    })
  }, [])

  const analyzeFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !overlayCanvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const overlay = overlayCanvasRef.current
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError("No hay imagen para capturar")
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    overlay.width = video.videoWidth
    overlay.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    const overlayCtx = overlay.getContext("2d")
    if (!ctx || !overlayCtx) return

    ctx.drawImage(video, 0, 0)
    overlayCtx.clearRect(0, 0, overlay.width, overlay.height)

    setIsAnalyzing(true)
    setError(null)

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError("Error al capturar la imagen")
        setIsAnalyzing(false)
        return
      }

      const formData = new FormData()
      formData.append("image", blob, "capture.jpg")

      try {
        const response = await api.post("anpr/events/detect/", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })

        const results = response.data.detections || []
        setDetections(results)

        results.forEach((det: DetectionResult) => {
          if (det.bbox) {
            const [x1, y1, x2, y2] = det.bbox
            const scaleX = video.videoWidth / 640
            const scaleY = video.videoHeight / 480
            det.bbox = [x1 * scaleX, y1 * scaleY, x2 * scaleX, y2 * scaleY]
          }
        })

        drawBoundingBoxes(overlayCtx, results)
      } catch (err: unknown) {
        console.error("Analysis error:", err)
        const axiosErr = err as { response?: { data?: { detail?: string } } }
        setError(axiosErr.response?.data?.detail || "Error al analizar la imagen")
        setDetections([])
      } finally {
        setIsAnalyzing(false)
      }
    }, "image/jpeg", 0.9)
  }, [drawBoundingBoxes])

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${!streamActive ? "hidden" : ""}`}
        />
        
        {!streamActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center text-muted-foreground">
              <Camera className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>Inicia la cámara para comenzar</p>
            </div>
          </div>
        )}
        
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        
        {isAnalyzing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="flex gap-2">
        {!isStreaming ? (
          <button
            onClick={startCamera}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium"
          >
            <Camera className="h-4 w-4" />
            Iniciar Cámara
          </button>
        ) : (
          <>
            <button
              onClick={stopCamera}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <CameraOff className="h-4 w-4" />
              Detener Cámara
            </button>
            <button
              onClick={analyzeFrame}
              disabled={isAnalyzing}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              {isAnalyzing ? "Analizando..." : "Tomar Foto y Analizar"}
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {detections.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">Resultados:</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {detections.map((det, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-border bg-card"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-foreground">
                    {det.plate_text || det.text || "Detección"}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {(det.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                {(det.class_name || det.class) && (
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    {det.class_name || det.class}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default WebcamCapture
