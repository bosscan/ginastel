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
    async function init() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Browser tidak mendukung kamera.');
        return;
      }
      setInitialTried(true);
      try {
        const constraints: MediaStreamConstraints = { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
        stream = await navigator.mediaDevices.getUserMedia(constraints).catch(async () => {
          // fallback tanpa facingMode
          return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current?.play();
              setStreamReady(true);
            } catch (playErr: any) {
              const msg = playErr?.message || '';
              if (msg.includes('NotAllowedError') || msg.includes('gesture')) {
                setNeedInteract(true); // user harus klik
              } else if (!benignMessages.some(m => msg.includes(m))) {
                setError('Gagal memulai kamera. Izinkan akses kamera di browser.');
              } else {
                setTimeout(() => { videoRef.current?.play().catch(() => {}); }, 400);
              }
            }
          };
        }
      } catch (e: any) {
        const msg = e?.message || 'Tidak bisa akses kamera';
        if (msg.toLowerCase().includes('permission')) setNeedInteract(true); else if (!benignMessages.some(m => msg.includes(m))) setError(msg);
      }
    }
    init();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

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
            try { await videoRef.current?.play(); setStreamReady(true); } catch { setError('Klik diizinkan kamera diblokir. Periksa permission.'); }
          }}>Aktifkan Kamera</button>
        )}
        {!photo && !needInteract && <button type="button" className="capture-btn" onClick={handleCapture} disabled={!streamReady}>Ambil Foto</button>}
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
