import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  X,
  Camera,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  Keyboard,
  CheckCircle2,
  AlertCircle,
  Barcode,
  Search,
  Zap,
} from 'lucide-react';

export const playScanBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    // Classic crisp POS scanner double-chirp
    osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // A6 note
    osc.frequency.setValueAtTime(2349.32, audioCtx.currentTime + 0.04); // D7 note
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(60);
    }
  } catch (err) {
    // AudioContext might be restricted until user gesture; ignore silently
  }
};

export interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcodeOrCode: string) => void;
  title?: string;
  subtitle?: string;
  allowContinuous?: boolean;
  quickSampleCodes?: Array<{ code: string; label: string }>;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Product Barcode',
  subtitle = 'Point camera at any standard barcode, UPC, EAN, or QR code',
  allowContinuous = false,
  quickSampleCodes = [],
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [isContinuous, setIsContinuous] = useState(allowContinuous);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanFeedbackMsg, setScanFeedbackMsg] = useState<string | null>(null);
  const [isScannerRunning, setIsScannerRunning] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'barcode-scanner-viewport';
  const isCooldownRef = useRef(false);

  // Stop camera helper
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current && isScannerRunning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        // Ignored if already stopped
      } finally {
        setIsScannerRunning(false);
        setTorchOn(false);
        setTorchSupported(false);
      }
    }
  }, [isScannerRunning]);

  // Handle successful scan
  const handleDecodedText = useCallback(
    (decodedText: string) => {
      const cleanCode = decodedText.trim();
      if (!cleanCode) return;

      // Throttle rapid repeated scans of same item in continuous mode
      if (isCooldownRef.current) return;
      isCooldownRef.current = true;

      playScanBeep();
      setLastScannedCode(cleanCode);
      setScanFeedbackMsg(`Identified: ${cleanCode}`);

      onScan(cleanCode);

      if (!isContinuous) {
        // Single scan: close after short confirmation
        setTimeout(() => {
          stopCamera();
          onClose();
        }, 400);
      } else {
        // Continuous mode: pause 1.4s before enabling next scan
        setTimeout(() => {
          isCooldownRef.current = false;
          setScanFeedbackMsg(null);
        }, 1400);
      }
    },
    [isContinuous, onScan, onClose, stopCamera]
  );

  // Start Camera
  const startCamera = useCallback(
    async (cameraIdOrFacing?: string) => {
      setCameraError(null);
      await stopCamera();

      // Check for camera support in browser
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Camera API is not supported in this browser or requires an HTTPS secure connection.'
        );
        setActiveTab('manual');
        return;
      }

      try {
        const scanner = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
        html5QrCodeRef.current = scanner;

        // Fetch cameras list if not populated
        const deviceList = await Html5Qrcode.getCameras();
        if (deviceList && deviceList.length > 0) {
          setCameras(deviceList.map((d) => ({ id: d.id, label: d.label || `Camera ${d.id}` })));
        }

        // Camera config: default to back camera (environment)
        const cameraConfig = cameraIdOrFacing
          ? { deviceId: { exact: cameraIdOrFacing } }
          : { facingMode: 'environment' };

        const qrConfig = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minDim = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minDim * 0.82),
              height: Math.floor(minDim * 0.55), // Wider horizontal box optimized for 1D barcodes
            };
          },
          aspectRatio: 1.0,
        };

        await scanner.start(
          cameraConfig,
          qrConfig,
          (decodedText) => handleDecodedText(decodedText),
          () => {
            // Frame scan failure; harmless, ignore per-frame failures
          }
        );

        setIsScannerRunning(true);

        // Check if torch/flashlight is supported
        try {
          // @ts-ignore
          const capabilities = scanner.getRunningTrackCapabilities?.();
          if (capabilities && 'torch' in capabilities) {
            setTorchSupported(true);
          }
        } catch (e) {
          setTorchSupported(false);
        }
      } catch (err: any) {
        console.warn('Failed to start camera scanner:', err);
        const errMsg = err?.message || String(err);
        if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission denied')) {
          setCameraError('Camera permission was denied. Please allow camera access in your browser settings.');
        } else if (errMsg.includes('NotFoundError') || errMsg.includes('no camera')) {
          setCameraError('No active camera found on this device.');
        } else {
          setCameraError(
            'Unable to start camera. You can enter the product barcode or SKU code manually below.'
          );
        }
        setIsScannerRunning(false);
      }
    },
    [handleDecodedText, stopCamera]
  );

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !torchSupported) return;
    try {
      const nextState = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        // @ts-ignore
        advanced: [{ torch: nextState }],
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Could not toggle torch:', e);
    }
  };

  // Switch camera (front/back or next device)
  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) {
      // Toggle between environment and user
      const nextFacing = selectedCameraId === 'user' ? 'environment' : 'user';
      setSelectedCameraId(nextFacing);
      startCamera(nextFacing);
      return;
    }

    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    setSelectedCameraId(nextCamera.id);
    startCamera(nextCamera.id);
  };

  // Lifecycle: open/close camera
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
    }
  }, [isOpen, activeTab]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        } catch (e) {}
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualInput.trim();
    if (!code) return;

    playScanBeep();
    onScan(code);
    setManualInput('');
    if (!isContinuous) {
      onClose();
    } else {
      setScanFeedbackMsg(`Applied Code: ${code}`);
      setTimeout(() => setScanFeedbackMsg(null), 2000);
    }
  };

  const handleApplySample = (code: string) => {
    playScanBeep();
    onScan(code);
    if (!isContinuous) {
      onClose();
    } else {
      setScanFeedbackMsg(`Applied: ${code}`);
      setTimeout(() => setScanFeedbackMsg(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 w-full max-w-md overflow-hidden z-10 flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight leading-tight">
                {title}
              </h2>
              <p className="text-[11px] text-slate-400 leading-tight">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher (Camera vs Manual Code Entry) */}
        <div className="flex items-center p-2 bg-slate-850 border-b border-slate-800 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              stopCamera();
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Type Code / SKU</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-3.5">
          {activeTab === 'camera' ? (
            <div className="space-y-3">
              {/* Viewport Box */}
              <div className="relative w-full aspect-square max-h-[300px] bg-black rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
                {/* HTML5 QR Container */}
                <div
                  id={scannerContainerId}
                  className="w-full h-full object-cover"
                />

                {/* Overlaid Animated Scanner Overlay */}
                {isScannerRunning && !cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Targeting Box with corner marks */}
                    <div className="relative w-[82%] h-[55%] border-2 border-indigo-400/80 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.5)] flex items-center justify-center overflow-hidden">
                      {/* Laser scanning line */}
                      <div className="absolute w-full h-[2px] bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-bounce" />

                      {/* Corner Accents */}
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white" />
                    </div>

                    <div className="absolute bottom-3 text-center px-3 py-1 bg-slate-900/80 backdrop-blur-xs rounded-full border border-slate-700 text-[10px] text-slate-300 font-medium tracking-wide">
                      Align barcode inside red laser frame
                    </div>
                  </div>
                )}

                {/* Feedback Toast Overlay */}
                {scanFeedbackMsg && (
                  <div className="absolute inset-x-4 top-4 p-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg animate-in zoom-in-95 duration-150 z-20">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="truncate">{scanFeedbackMsg}</span>
                  </div>
                )}

                {/* Camera Error Message */}
                {cameraError && (
                  <div className="p-4 text-center space-y-2 z-10 max-w-[280px]">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-xs text-amber-200 font-medium">
                      {cameraError}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Use Product Code Instead</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Controls Bar */}
              <div className="flex items-center justify-between gap-2 px-1 text-xs">
                <div className="flex items-center gap-1.5">
                  {cameras.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-700 cursor-pointer"
                      title="Switch Camera"
                    >
                      <SwitchCamera className="w-3.5 h-3.5 text-slate-400" />
                      <span>Switch Camera</span>
                    </button>
                  )}

                  {torchSupported && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border cursor-pointer ${
                        torchOn
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      {torchOn ? (
                        <FlashlightOff className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Flashlight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Torch</span>
                    </button>
                  )}
                </div>

                {/* Continuous Scan Toggle */}
                {allowContinuous && (
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isContinuous}
                      onChange={(e) => setIsContinuous(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span>Continuous Scan</span>
                  </label>
                )}
              </div>
            </div>
          ) : (
            /* Manual Barcode / Code / SKU Entry View */
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Enter Barcode, SKU, or Product Code
                </label>
                <div className="relative">
                  <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. AUDIO-001, 8901001000012, or prod-1"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Works with USB handheld laser scanners, typed SKUs, or copied barcodes.
                </p>
              </div>

              {scanFeedbackMsg && (
                <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{scanFeedbackMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Look Up &amp; Apply Code</span>
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo/Sample Barcodes (Handy for Instant Desktop Testing) */}
          {quickSampleCodes.length > 0 && (
            <div className="pt-3 border-t border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Quick Test Codes (Click to simulate scan):</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {quickSampleCodes.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleApplySample(item.code)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-[10px] transition-colors cursor-pointer text-left truncate max-w-[190px]"
                    title={`Apply ${item.label} (${item.code})`}
                  >
                    <span className="text-white font-bold">{item.code}</span>
                    <span className="text-slate-400 ml-1">({item.label})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Auto-focusing camera scanner</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
