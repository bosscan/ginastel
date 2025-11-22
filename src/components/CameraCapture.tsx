import React, { useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
}

// Disederhanakan: hanya upload / ambil foto dari perangkat, tanpa streaming kamera langsung.
const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  // (Optional) enumerasi perangkat dihapus untuk versi upload sederhana.

  function triggerFile() {
    fileInputRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhoto(dataUrl);
      onCapture(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function retake() {
    setPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="camera-box">
      {photo && (
        <div className="camera-preview-wrapper">
          <img src={photo} alt="Bukti Pembayaran" className="camera-preview" />
        </div>
      )}
      {!photo && (
        <button type="button" className="capture-btn" onClick={triggerFile}>Pilih / Ambil Foto</button>
      )}
      {photo && (
        <div className="camera-actions" style={{marginTop:8}}>
          <button type="button" className="capture-btn" onClick={retake}>Ganti Foto</button>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={onFile} />
      <div className="camera-hint" style={{marginTop:8}}>Gunakan tombol di atas untuk memilih atau mengambil foto bukti pembayaran.</div>
    </div>
  );
};

export default CameraCapture;
