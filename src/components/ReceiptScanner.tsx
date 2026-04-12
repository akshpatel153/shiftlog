import { useState, useRef } from 'react';
import { Camera, X, Check, Loader2 } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { scanReceipt, type ScannedShiftData } from '../services/geminiScanner';
import './ReceiptScanner.css';

interface ReceiptScannerProps {
  onScanSuccess: (data: ScannedShiftData) => void;
}

export function ReceiptScanner({ onScanSuccess }: ReceiptScannerProps) {
  const { settings } = useSettings();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<ScannedShiftData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!settings.gemini_api_key) {
      alert('Please add your Gemini API Key in Settings first.');
      return;
    }

    setIsScanning(true);
    setScannedResult(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const result = await scanReceipt(base64, settings.gemini_api_key!);
          setScannedResult(result);
        } catch (err: any) {
          alert('Scanning failed: ' + err.message);
        } finally {
          setIsScanning(false);
        }
      };
      
      // Load image into base64 to send to vision model
      reader.readAsDataURL(file);
    } catch (error: any) {
      alert('File read failed: ' + error.message);
      setIsScanning(false);
    }
    
    // reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirm = () => {
    if (scannedResult) {
      onScanSuccess(scannedResult);
      setScannedResult(null);
    }
  };

  const handleCancel = () => {
    setScannedResult(null);
  };

  return (
    <>
      <button 
        className="fab-scanner" 
        onClick={() => fileInputRef.current?.click()}
        aria-label="Scan Receipt"
      >
        <Camera size={28} color="white" />
      </button>

      {/* Hidden native input explicitly asking for hardware camera */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {isScanning && (
        <div className="scanner-overlay">
          <div className="scanner-modal glass-panel text-center">
            <Loader2 className="animate-spin text-primary mx-auto mb-4" size={48} />
            <h3 className="font-semibold text-lg text-primary">Scanning Receipt...</h3>
            <p className="text-muted text-sm mt-2">AI is reading your timesheet</p>
          </div>
        </div>
      )}

      {scannedResult && (
        <div className="scanner-overlay">
          <div className="scanner-modal glass-panel">
            <h3 className="font-semibold text-xl text-primary mb-4 text-center">Shift Identified!</h3>
            
            <div className="scan-results-box mb-6">
              <div className="scan-row mb-3">
                <span className="text-muted text-sm">Date:</span>
                <span className="font-bold text-lg">{scannedResult.date || 'Not Found'}</span>
              </div>
              <div className="scan-row">
                <span className="text-muted text-sm">Clock In:</span>
                <span className="font-bold text-lg">{scannedResult.clockIn || 'Not Found'}</span>
              </div>
              <div className="scan-row mt-3">
                <span className="text-muted text-sm">Clock Out:</span>
                <span className="font-bold text-lg">{scannedResult.clockOut || 'Not Found'}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="btn-secondary flex-1 flex justify-center items-center gap-2" onClick={handleCancel}>
                <X size={20} /> Cancel
              </button>
              <button className="btn-primary flex-1 flex justify-center items-center gap-2" onClick={handleConfirm}>
                <Check size={20} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
