// =====================================================================
//  Detección facial en el dispositivo (pico.js, licencia MIT).
//  La imagen de la cámara NUNCA sale del navegador: solo se analiza aquí
//  y al servidor se envía el resultado (rostro sí/no, calidad, movimiento).
//
//  Qué verifica:
//   · que haya exactamente UN rostro frente a la cámara
//   · que la imagen tenga luz y nitidez suficientes
//   · que el rostro esté centrado y a buena distancia
//   · que haya movimiento natural de la cabeza (prueba básica de presencia)
//  Limitaciones (importantes):
//   · NO reconoce QUIÉN es la persona ni la compara con su documento.
//   · Una foto o un video mostrado a la cámara podría pasar la prueba.
//   · Para verificación de identidad real se requiere un servicio
//     biométrico especializado (fase futura).
// =====================================================================
import pico from "./pico.js";

type Classifier = (r: number, c: number, s: number, pixels: Uint8Array, ldim: number) => number;
let cascade: Promise<Classifier> | null = null;

export function loadDetector(): Promise<Classifier> {
  cascade ??= fetch("models/facefinder")
    .then((r) => { if (!r.ok) throw new Error("No se pudo cargar el detector facial"); return r.arrayBuffer(); })
    .then((b) => pico.unpack_cascade(new Int8Array(b)) as Classifier)
    .catch((e) => { cascade = null; throw e; });
  return cascade;
}

export interface Face { row: number; col: number; size: number; score: number }
export interface FrameAnalysis { faces: Face[]; brightness: number; sharpness: number; width: number; height: number }

/** Umbral de confianza de pico.js (las detecciones débiles se descartan) */
export const SCORE_MIN = 50;
const W = 320;

function toGray(rgba: Uint8ClampedArray, n: number) {
  const g = new Uint8Array(n);
  for (let i = 0; i < n; i++) g[i] = (2 * rgba[i * 4] + 7 * rgba[i * 4 + 1] + rgba[i * 4 + 2]) / 10;
  return g;
}

/** Varianza del Laplaciano: medida estándar de nitidez (valores bajos = borroso) */
function sharpness(g: Uint8Array, w: number, x0: number, y0: number, x1: number, y1: number) {
  let s = 0, s2 = 0, n = 0;
  for (let y = Math.max(1, y0); y < y1 - 1; y++)
    for (let x = Math.max(1, x0); x < x1 - 1; x++) {
      const i = y * w + x;
      const v = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w];
      s += v; s2 += v * v; n++;
    }
  if (!n) return 0;
  const m = s / n;
  return s2 / n - m * m;
}

export function createAnalyzer(classify: Classifier, opts: { video?: boolean } = {}) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const memory = opts.video ? pico.instantiate_detection_memory(5) : null;

  return function analyze(src: CanvasImageSource, sw: number, sh: number): FrameAnalysis {
    const width = W, height = Math.round((W * sh) / sw);
    canvas.width = width; canvas.height = height;
    ctx.drawImage(src, 0, 0, width, height);
    const rgba = ctx.getImageData(0, 0, width, height).data;
    const gray = toGray(rgba, width * height);
    let brightness = 0;
    for (let i = 0; i < gray.length; i++) brightness += gray[i];
    brightness /= gray.length;

    const image = { pixels: gray, nrows: height, ncols: width, ldim: width };
    const params = { shiftfactor: 0.1, minsize: Math.round(Math.min(width, height) * 0.15), maxsize: 1000, scalefactor: 1.1 };
    let dets = pico.run_cascade(image, classify, params);
    if (memory) dets = memory(dets);
    dets = pico.cluster_detections(dets, 0.2);
    const faces: Face[] = dets
      .filter((d: number[]) => d[3] > SCORE_MIN)
      .map((d: number[]) => ({ row: d[0], col: d[1], size: d[2], score: d[3] }))
      .sort((a: Face, b: Face) => b.score - a.score);

    const f = faces[0];
    const sh2 = f
      ? sharpness(gray, width, Math.round(f.col - f.size / 2), Math.round(f.row - f.size / 2), Math.round(f.col + f.size / 2), Math.round(f.row + f.size / 2))
      : sharpness(gray, width, 0, 0, width, height);
    return { faces, brightness, sharpness: sh2, width, height };
  };
}

export type Check = "sin-rostro" | "varios" | "oscuro" | "claro" | "borroso" | "lejos" | "cerca" | "descentrado" | "ok";

export const CHECK_MSG: Record<Check, string> = {
  "sin-rostro": "No vemos ningún rostro. Mira de frente a la cámara.",
  varios: "Aparece más de un rostro. Solo tú debes estar frente a la cámara.",
  oscuro: "La imagen está muy oscura. Busca un lugar con más luz.",
  claro: "Hay demasiada luz o contraluz. Evita tener una ventana detrás.",
  borroso: "La imagen está borrosa. Limpia la cámara y quédate quieto un momento.",
  lejos: "Estás muy lejos. Acércate un poco a la cámara.",
  cerca: "Estás muy cerca. Aléjate un poco.",
  descentrado: "Ubica tu rostro en el centro del marco.",
  ok: "Rostro detectado correctamente.",
};

/** Evalúa si un cuadro sirve para validar */
export function evaluate(a: FrameAnalysis): Check {
  if (a.faces.length === 0) return a.brightness < 40 ? "oscuro" : "sin-rostro";
  if (a.faces.length > 1 && a.faces[1].score > a.faces[0].score * 0.4) return "varios";
  const f = a.faces[0];
  if (a.brightness < 55) return "oscuro";
  if (a.brightness > 215) return "claro";
  if (a.sharpness < 25) return "borroso";
  const rel = f.size / a.width;
  if (rel < 0.16) return "lejos";
  if (rel > 0.85) return "cerca";
  if (Math.abs(f.col - a.width / 2) > a.width * 0.22 || Math.abs(f.row - a.height / 2) > a.height * 0.25) return "descentrado";
  return "ok";
}

export interface VerificationResult {
  rostroDetectado: boolean;
  metodo: "camara" | "foto";
  cuadrosValidos: number;
  confianzaMedia: number;
  movimiento: boolean;
  brillo: number;
  nitidez: number;
  detector: string;
}
