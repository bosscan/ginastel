import React, { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  autoCapture?: boolean; // jika true, otomatis ambil foto sekali setelah ready
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, autoCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [error, setError] = useState<string | null>(null); // pesan kesalahan penting
  const [needInteract, setNeedInteract] = useState(false); // user gesture needed
  const [initialTried, setInitialTried] = useState(false);
  const benignMessages = [
    'The play() request was interrupted by a new load request.'
  ];
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let retryTimer: number | undefined;
    async function init() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Browser tidak mendukung kamera.');
        return;
      }
      setInitialTried(true);
      try {
        const constraints: MediaStreamConstraints = { video: { facingMode: { ideal: 'environment' } }, audio: false };
        stream = await navigator.mediaDevices.getUserMedia(constraints).catch(async () => {
          return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        });
        const video = videoRef.current;
        if (video) {
          video.setAttribute('playsInline','true');
          video.muted = true; // membantu autoplay di mobile safari
          video.srcObject = stream;

          const markReady = () => {
            if (!streamReady) setStreamReady(true);
          };

            // event listeners untuk berbagai kondisi readiness
          video.addEventListener('loadeddata', markReady, { once: true });
          video.addEventListener('canplay', markReady, { once: true });
          video.addEventListener('playing', markReady, { once: true });

          const attemptPlay = async () => {
            try {
              await video.play();
              markReady();
            } catch (playErr: any) {
              const msg = playErr?.message || '';
              if (msg.includes('NotAllowedError') || msg.includes('gesture')) {
                setNeedInteract(true);
              } else if (!benignMessages.some(m => msg.includes(m))) {
                // Jika bukan pesan jinak, set error; namun beri kesempatan retry dulu
                retryTimer = window.setTimeout(() => attemptPlay(), 600);
              }
            }
          };
          attemptPlay();

          // fallback: jika belum ready dalam 3 detik dan tidak butuh gesture, coba lagi
          setTimeout(() => {
            if (!streamReady && !needInteract && !error) attemptPlay();
          }, 3000);
        }
      } catch (e: any) {
        const msg = e?.message || 'Tidak bisa akses kamera';
        if (msg.toLowerCase().includes('permission')) setNeedInteract(true); else if (!benignMessages.some(m => msg.includes(m))) setError(msg);
      }
    }
    init();
    return () => {
      if (retryTimer) window.clearTimeout(retryTimer);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [streamReady, needInteract, error]);

  useEffect(() => {
    if (streamReady && autoCapture && !photo) {
      // auto capture setelah 1.2 detik (biar fokus)
      const t = setTimeout(() => handleCapture(), 1200);
      return () => clearTimeout(t);
    }
  }, [streamReady, autoCapture, photo]);

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setPhoto(dataUrl);
    onCapture(dataUrl);
  }

  function retake() {
    setPhoto(null);
  }

  return (
    <div className="camera-box">
  {error && <div className="camera-error">{error}</div>}
      {!photo && streamReady && (
        <div className="camera-live">
          <video ref={videoRef} playsInline muted />
          <div className="camera-overlay" />
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {photo && (
        <div className="camera-preview-wrapper">
          <img src={photo} alt="Bukti QRIS" className="camera-preview" />
        </div>
      )}
      <div className="camera-actions">
        {!photo && needInteract && (
          <button type="button" className="capture-btn" onClick={async () => {
            setNeedInteract(false);
            try {
              await videoRef.current?.play();
              setStreamReady(true);
            } catch {
              setError('Permission kamera belum diberikan. Periksa setting browser.');
            }
          }}>Aktifkan Kamera</button>
        )}
        {!photo && !needInteract && (
          <button type="button" className="capture-btn" onClick={handleCapture} disabled={!streamReady}>Ambil Foto</button>
        )}
        {photo && <button type="button" className="capture-btn" onClick={retake}>Ulangi Foto</button>}
      </div>
      {!streamReady && !error && initialTried && !needInteract && <div className="camera-hint">Menginisialisasi kamera...</div>}
      {error && (
        <div className="camera-fallback">
          <p style={{fontSize:'12px'}}>Fallback upload bukti (gambar) jika kamera bermasalah:</p>
          <input type="file" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => { const dataUrl = reader.result as string; setPhoto(dataUrl); onCapture(dataUrl); };
            reader.readAsDataURL(file);
          }} />
        </div>
      )}
      <div className="camera-hint">Pastikan foto menampilkan bukti pembayaran jelas.</div>
    </div>
  );
};

export default CameraCapture;
