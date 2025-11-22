import React, { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  autoCapture?: boolean; // tidak dipakai untuk QRIS saat ini, bisa diaktifkan lagi jika perlu
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, autoCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [error, setError] = useState<string | null>(null); // pesan kesalahan penting
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [initialized, setInitialized] = useState(false); // sudah pernah request perangkat
  const [statusMsg, setStatusMsg] = useState<string>('Belum mulai');
  const benignMessages = [
    'The play() request was interrupted by a new load request.'
  ];
  const [photo, setPhoto] = useState<string | null>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);

  // Enumerate devices AFTER first permission grant
  async function loadDevices() {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const vids = list.filter(d => d.kind === 'videoinput');
      setDevices(vids);
      if (!selectedDeviceId && vids.length > 0) setSelectedDeviceId(vids[0].deviceId);
    } catch (e: any) {
      // ignore; will still allow default stream
    }
  }

  async function startStream(deviceId?: string) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Browser tidak mendukung kamera.');
      return;
    }
    setStarting(true);
    setError(null);
    setStatusMsg('Meminta izin kamera...');
    try {
      // Stop existing
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(t => t.stop());
        currentStreamRef.current = null;
      }
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: 'environment' } },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(async () => {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      });
      currentStreamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.setAttribute('playsInline','true');
        video.muted = true;
        video.srcObject = stream;
        // Coba play langsung lalu polling videoWidth
        try {
          await video.play();
        } catch (e: any) {
          if (!benignMessages.some(m => (e?.message||'').includes(m))) {
            setError('Gagal play(): ' + (e?.message || 'Unknown'));
          }
        }
        setStatusMsg('Menyiapkan stream...');
        for (let i=0;i<20;i++) { // ~3s total
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            setStreamReady(true);
            setStatusMsg('Kamera siap');
            break;
          }
          await new Promise(r => setTimeout(r,150));
        }
        if (!streamReady) {
          setStatusMsg('Menunggu frame pertama...');
          setTimeout(() => {
            if (video.videoWidth > 0 && !streamReady) {
              setStreamReady(true);
              setStatusMsg('Kamera siap');
            } else if (!streamReady) {
              setStatusMsg('Frame belum muncul, coba Refresh');
            }
          }, 1000);
        }
      }
      await loadDevices();
      setInitialized(true);
    } catch (e: any) {
      setError(e?.message || 'Tidak bisa akses kamera');
      setStatusMsg('Gagal akses kamera');
    } finally {
      setStarting(false);
    }
  }

  // Auto capture still supported if desired (not primary path now)
  useEffect(() => {
    if (streamReady && autoCapture && !photo) {
      const t = setTimeout(() => handleCapture(), 1200);
      return () => clearTimeout(t);
    }
  }, [streamReady, autoCapture, photo]);

  useEffect(() => {
    return () => {
      if (currentStreamRef.current) {
        currentStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

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

  async function retake() {
    setPhoto(null);
    setStreamReady(false);
    // restart stream on retake for clarity
    await startStream(selectedDeviceId || undefined);
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
      <div className="camera-actions" style={{flexWrap:'wrap'}}>
        {!initialized && (
          <button type="button" className="capture-btn" disabled={starting} onClick={() => startStream(selectedDeviceId || undefined)}>
            {starting ? 'Memulai...' : 'Aktifkan Kamera'}
          </button>
        )}
        {initialized && !photo && (
          <>
            <button type="button" className="capture-btn" onClick={handleCapture} disabled={!streamReady}>Ambil Foto</button>
            <button type="button" className="capture-btn" onClick={() => startStream(selectedDeviceId || undefined)} disabled={starting || !streamReady}>Refresh</button>
            {devices.length > 1 && (
              <select className="qris-input" value={selectedDeviceId || ''} onChange={e => { setSelectedDeviceId(e.target.value); startStream(e.target.value); }} style={{flex:'1 1 100%', marginTop:8}}>
                {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || 'Kamera'}</option>)}
              </select>
            )}
          </>
        )}
        {photo && <button type="button" className="capture-btn" onClick={retake}>Ulangi Foto</button>}
      </div>
  {!photo && initialized && <div className="camera-hint" style={{fontSize:'11px'}}>{statusMsg}</div>}
      {error && (
        <div className="camera-fallback">
          <p style={{fontSize:'12px', margin:'4px 0'}}>{error}</p>
          <button type="button" className="capture-btn" onClick={() => startStream(selectedDeviceId || undefined)} disabled={starting}>Coba Lagi</button>
          <p style={{fontSize:'12px'}}>Fallback upload bukti jika kamera tetap gagal:</p>
          <input type="file" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => { const dataUrl = reader.result as string; setPhoto(dataUrl); onCapture(dataUrl); };
            reader.readAsDataURL(file);
          }} />
        </div>
      )}
      {/* Selalu sediakan opsi capture langsung device (mobile membuka kamera) */}
      {!photo && (
        <div style={{marginTop:8}}>
          <input type="file" accept="image/*" capture="environment" onChange={e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => { const dataUrl = reader.result as string; setPhoto(dataUrl); onCapture(dataUrl); }; 
            reader.readAsDataURL(file);
          }} style={{display:'block', width:'100%'}} />
          <div className="camera-hint" style={{marginTop:4}}>Alternatif: unggah / ambil foto langsung dari perangkat.</div>
        </div>
      )}
      <div className="camera-hint">Pastikan foto menampilkan bukti pembayaran jelas.</div>
    </div>
  );
};

export default CameraCapture;
