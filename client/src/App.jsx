import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lock, Copy, Check, Terminal, Shield, Eye, RefreshCw, Clock, Flame, Unlock, FileText, Upload } from 'lucide-react';
import { createSecret, getSecret } from './api';
// --- Web Crypto API Utilities ---

// Generate a random symmetric key (AES-GCM)
const generateKey = async () => {
    return window.crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

// Export key to base64 for URL fragment
const exportKey = async (key) => {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

// Import key from base64 string
const importKey = async (base64Key) => {
    const rawKey = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return window.crypto.subtle.importKey(
        "raw",
        rawKey,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
};

// Helper to convert ArrayBuffer to Base64 (chunked to avoid stack overflow)
const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    const chunkSize = 0x8000; // 32KB chunks
    for (let i = 0; i < len; i += chunkSize) {
        binary += String.fromCharCode.apply(
            null,
            bytes.subarray(i, Math.min(i + chunkSize, len))
        );
    }
    return btoa(binary);
};

// Encrypt string data
const encryptMessage = async (message, key) => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(message);

    const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoded
    );

    return {
        iv: btoa(String.fromCharCode(...iv)),
        data: arrayBufferToBase64(ciphertext)
    };
};

// Encrypt file data
const encryptFile = async (file, key) => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const arrayBuffer = await file.arrayBuffer();

    const ciphertext = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        arrayBuffer
    );

    return {
        iv: btoa(String.fromCharCode(...iv)),
        data: arrayBufferToBase64(ciphertext)
    };
};

// Decrypt string data
// Decrypt data
const decryptData = async (encryptedData, key, ivBase64, isFile = false) => {
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    try {
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            data
        );

        if (isFile) {
            return decrypted; // Return ArrayBuffer for files
        }
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        throw new Error("Decryption failed. Invalid key or corrupted data.");
    }
};

// --- Components ---

const TechnicalHeader = () => (
    <div className="border-b border-zinc-800 pb-6 mb-8 uppercase tracking-widest text-xs text-zinc-500 font-mono select-none">
        <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl text-zinc-100 font-bold tracking-tighter flex items-center gap-2">
                    <Shield className="w-6 h-6 text-orange-600" />
                    BLACKBOX_SECURE
                </h1>
                <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-600 animate-pulse"></span> SYSTEM ONLINE</span>
                    <span>// ENCRYPTION: AES-256-GCM</span>
                </div>
            </div>
            <div className="text-right hidden sm:block">
                <p>LOCATION: UNKNOWN</p>
                <p>PROTOCOL: LOCAL-ZERO-KNOWLEDGE</p>
                <p className="text-orange-600 mt-1">ENCRYPTED DATA SHARING SERVICE</p>
            </div>
        </div>

        <div className="w-full h-px bg-zinc-800 mt-6 relative">
            <div className="absolute top-0 left-0 h-1 w-24 bg-zinc-100"></div>
            <div className="absolute top-0 right-0 h-1 w-24 bg-orange-600"></div>
        </div>
    </div>
);

const StripedButton = ({ onClick, children, disabled, className = "" }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`
      relative w-full group overflow-hidden bg-orange-900/20 border border-orange-600/50 
      hover:border-orange-500 hover:bg-orange-900/40 text-orange-500 hover:text-orange-400
      transition-all duration-300 py-4 px-6 uppercase font-mono tracking-widest text-sm font-bold
      disabled:opacity-50 disabled:cursor-not-allowed ${className}
    `}
    >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #ea580c 10px, #ea580c 20px)' }}>
        </div>
        <span className="relative z-10 flex items-center justify-center gap-2">
            {children}
        </span>
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-orange-500"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-orange-500"></div>
    </button>
);

const ConfigToggle = ({ label, options, value, onChange }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            {label}
        </label>
        <div className="flex border border-zinc-800 bg-zinc-900/50">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`
            flex-1 py-3 text-[10px] sm:text-xs font-mono uppercase tracking-wider transition-colors relative
            ${value === opt.value
                            ? 'text-orange-500 bg-orange-900/10'
                            : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800'}
          `}
                >
                    {value === opt.value && (
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-orange-500"></div>
                    )}
                    {opt.label}
                </button>
            ))}
        </div>
    </div>
);

// --- Main Application ---

export default function SecureApp() {
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('IDLE'); // IDLE, ENCRYPTING, UPLOADING, DONE, DECRYPTING, ERROR, EXPIRED, BURNED
    const [generatedLink, setGeneratedLink] = useState('');
    const [mode, setMode] = useState('CREATE'); // CREATE, VIEW
    const [decryptedContent, setDecryptedContent] = useState(null);
    const [loading, setLoading] = useState(true);

    // Configuration State
    const [timeLimit, setTimeLimit] = useState(10); // Minutes
    const [viewLimit, setViewLimit] = useState(1); // 1 or -1 (Unlimited)

    // URL Params State (for View Mode)
    const [viewId, setViewId] = useState(null);
    const [viewKey, setViewKey] = useState(null);

    useEffect(() => {
        // Check URL for shared secret
        // Pattern: ?id=DOC_ID#KEY_BASE64
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const hash = window.location.hash.substring(1); // Remove #

        if (id && hash) {
            setMode('VIEW');
            setViewId(id);
            setViewKey(hash);
        }
        setLoading(false);
    }, []);

    const [pasteLink, setPasteLink] = useState('');

    const [inputType, setInputType] = useState('TEXT'); // TEXT, FILE
    const [selectedFile, setSelectedFile] = useState(null);

    const handleEncryptAndShare = async () => {
        if (inputType === 'TEXT' && !message.trim()) return;
        if (inputType === 'FILE' && !selectedFile) return;

        setStatus('ENCRYPTING');

        try {
            // 1. Generate Key
            const key = await generateKey();

            let encrypted;
            let type = 'text';
            let fileName = null;
            let mimeType = null;

            // 2. Encrypt Data
            if (inputType === 'FILE') {
                encrypted = await encryptFile(selectedFile, key);
                type = 'file';
                fileName = selectedFile.name;
                mimeType = selectedFile.type;
            } else {
                encrypted = await encryptMessage(message, key);
            }

            setStatus('UPLOADING');

            // 3. Store in Backend
            const response = await createSecret(encrypted.data, encrypted.iv, timeLimit, viewLimit, type, fileName, mimeType);
            const docId = response.id;

            // 4. Generate Link
            const exportedKey = await exportKey(key);
            const link = `${window.location.origin}${window.location.pathname}?id=${docId}#${exportedKey}`;

            setGeneratedLink(link);
            setStatus('DONE');
        } catch (error) {
            console.error(error);
            setStatus('ERROR');
        }
    };

    const handlePasteDecrypt = () => {
        if (!pasteLink) return;
        try {
            const url = new URL(pasteLink);
            const id = url.searchParams.get('id');
            const hash = url.hash.substring(1);

            if (id && hash) {
                setViewId(id);
                setViewKey(hash);
                setMode('VIEW');
                setStatus('IDLE');
                setPasteLink('');
            } else {
                alert('Invalid Link Format');
            }
        } catch (e) {
            alert('Invalid URL');
        }
    };

    const handleDecrypt = async () => {
        if (!viewId || !viewKey) return;
        setStatus('DECRYPTING');

        try {
            // 1. Fetch from Backend
            const secretData = await getSecret(viewId);

            // 2. Import Key
            const key = await importKey(viewKey);

            // 3. Decrypt
            const isFile = secretData.type === 'file';
            const decrypted = await decryptData(secretData.data, key, secretData.iv, isFile);

            if (isFile) {
                // Create Blob and URL
                const blob = new Blob([decrypted], { type: secretData.mimeType });
                const url = URL.createObjectURL(blob);
                setDecryptedContent({ type: 'file', url, fileName: secretData.fileName });
            } else {
                setDecryptedContent({ type: 'text', content: decrypted });
            }

            setStatus('IDLE');
        } catch (error) {
            console.error(error);
            const msg = error.message || '';

            if (msg.includes('EXPIRED') || msg === 'EXPIRED') {
                setStatus('EXPIRED');
                setDecryptedContent({ type: 'error', content: "ERROR: TIME LIMIT EXCEEDED. MESSAGE PURGED." });
            } else if (msg.includes('BURNED') || msg === 'BURNED') {
                setStatus('BURNED');
                setDecryptedContent({ type: 'error', content: "ERROR: VIEW LIMIT REACHED. MESSAGE INCINERATED." });
            } else if (msg.includes('NOT_FOUND') || msg === 'NOT_FOUND') {
                setStatus('ERROR');
                setDecryptedContent({ type: 'error', content: "ERROR: MESSAGE CONTENT NOT FOUND." });
            } else {
                setStatus('ERROR');
                setDecryptedContent({ type: 'error', content: "ERROR: UNABLE TO DECRYPT. KEY INVALID OR DATA CORRUPTED." });
            }
        }
    };

    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generatedLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement("textarea");
            textArea.value = generatedLink;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Fallback failed', err);
                alert('Failed to copy link. Please copy manually.');
            }
            document.body.removeChild(textArea);
        }
    };

    const reset = () => {
        setMode('CREATE');
        setMessage('');
        setGeneratedLink('');
        setStatus('IDLE');
        setDecryptedContent(null);
        window.history.pushState({}, document.title, window.location.pathname);
    };

    if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-orange-600 font-mono animate-pulse">INITIALIZING SECURE LINK...</div>;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300 font-mono selection:bg-orange-900 selection:text-orange-200 p-4 md:p-8 flex flex-col">
            <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col">

                <TechnicalHeader />

                {/* Main Interface Area */}
                <div className="flex-grow flex flex-col relative">

                    {/* Decorative Grid Lines */}
                    <div className="absolute inset-0 pointer-events-none border-l border-r border-zinc-900/50 hidden md:block"></div>
                    <div className="absolute top-1/2 w-full h-px bg-zinc-900/50 -z-10"></div>

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 h-full">

                        {/* Left Column: Context / Status */}
                        <div className="md:col-span-4 flex flex-col gap-6 h-full">
                            <div className="space-y-2">
                                <h2 className="text-3xl font-bold text-white uppercase leading-none tracking-tighter">
                                    {mode === 'CREATE' ? 'Prepare Data For Transmission' : 'Incoming Encrypted Transmission'}
                                </h2>
                                <div className="w-12 h-1 bg-orange-600"></div>
                            </div>

                            <div className="text-xs text-zinc-500 space-y-1 uppercase tracking-wider">
                                <p>*** LERNO // SECURE OPS - {new Date().getFullYear()} ***</p>
                                <p>*** STATUS: {status} ***</p>
                            </div>

                            {/* Status Box */}
                            <div className="border border-zinc-800 bg-zinc-900/50 p-4 mt-auto">
                                <div className="flex items-center gap-2 text-orange-500 mb-2">
                                    <Terminal size={16} />
                                    <span className="text-xs font-bold uppercase">System Output Log</span>
                                </div>
                                <div className="font-mono text-xs text-zinc-400 space-y-1 h-32 overflow-y-auto">
                                    <p className="text-zinc-600">waiting for input...</p>
                                    {status === 'ENCRYPTING' && <p className="text-orange-400">{'>'} generating 256-bit AES-GCM key...</p>}
                                    {status === 'UPLOADING' && <p className="text-orange-400">{'>'} establishing uplink to secure storage...</p>}
                                    {status === 'DONE' && <p className="text-green-500">{'>'} transmission secured. link generated.</p>}
                                    {mode === 'VIEW' && <p className="text-blue-400">{'>'} encrypted package detected.</p>}
                                    {decryptedContent && decryptedContent.type !== 'error' && <p className="text-green-500">{'>'} payload decrypted successfully.</p>}
                                    {status === 'ERROR' && <p className="text-red-500">{'>'} CRITICAL ERROR. OPERATION ABORTED.</p>}
                                    {status === 'EXPIRED' && <p className="text-red-500">{'>'} ERROR: TIMEOUT. LINK EXPIRED.</p>}
                                    {status === 'BURNED' && <p className="text-red-500">{'>'} ERROR: VIEW LIMIT REACHED.</p>}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Interaction */}
                        <div className="md:col-span-8 flex flex-col gap-8 h-full justify-end">

                            {mode === 'CREATE' ? (
                                <>
                                    {!generatedLink ? (
                                        <div className="flex flex-col gap-6 h-full">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                                        Payload Content
                                                    </label>
                                                    <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-sm">
                                                        <button
                                                            onClick={() => setInputType('TEXT')}
                                                            className={`px-3 py-1 text-[10px] font-bold uppercase transition-colors ${inputType === 'TEXT' ? 'bg-zinc-800 text-orange-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                                                        >
                                                            Text
                                                        </button>
                                                        <button
                                                            onClick={() => setInputType('FILE')}
                                                            className={`px-3 py-1 text-[10px] font-bold uppercase transition-colors ${inputType === 'FILE' ? 'bg-zinc-800 text-orange-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                                                        >
                                                            File
                                                        </button>
                                                    </div>
                                                </div>

                                                {inputType === 'TEXT' ? (
                                                    <textarea
                                                        value={message}
                                                        onChange={(e) => setMessage(e.target.value)}
                                                        placeholder="ENTER SENSITIVE INFORMATION HERE..."
                                                        className="w-full h-48 bg-transparent border border-zinc-700 p-4 text-zinc-300 placeholder-zinc-700 focus:border-orange-600 focus:ring-1 focus:ring-orange-600/20 focus:outline-none resize-none transition-colors font-mono text-sm"
                                                    />
                                                ) : (
                                                    <div className="w-full h-48 bg-zinc-900/20 border border-zinc-700 border-dashed flex flex-col items-center justify-center p-6 text-center hover:bg-zinc-900/40 transition-colors relative">
                                                        <input
                                                            type="file"
                                                            onChange={(e) => setSelectedFile(e.target.files[0])}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                        {selectedFile ? (
                                                            <div className="flex flex-col items-center gap-2 text-orange-500">
                                                                <FileText size={32} />
                                                                <p className="text-sm font-bold">{selectedFile.name}</p>
                                                                <p className="text-xs text-zinc-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-2 text-zinc-500">
                                                                <Upload size={32} />
                                                                <p className="text-xs font-bold uppercase tracking-widest">Drop File or Click to Upload</p>
                                                                <p className="text-[10px] text-zinc-600">MAX SIZE: 5MB</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Configuration Panel */}
                                            <div className="border border-zinc-800 bg-zinc-900/20 p-4 space-y-4">
                                                <div className="flex items-center gap-2 text-zinc-500 border-b border-zinc-800 pb-2 mb-2">
                                                    <Flame size={14} className="text-orange-600" />
                                                    <span className="text-[10px] uppercase tracking-widest font-bold">Self-Destruct Protocol</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <ConfigToggle
                                                        label={<><Clock size={12} /> Time Limit</>}
                                                        value={timeLimit}
                                                        onChange={setTimeLimit}
                                                        options={[
                                                            { label: '10 Mins', value: 10 },
                                                            { label: '1 Hour', value: 60 },
                                                            { label: '24 Hours', value: 1440 },
                                                        ]}
                                                    />
                                                    <ConfigToggle
                                                        label={<><Eye size={12} /> Max Views</>}
                                                        value={viewLimit}
                                                        onChange={setViewLimit}
                                                        options={[
                                                            { label: '1 View', value: 1 },
                                                            { label: 'Unlimited', value: -1 },
                                                        ]}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-auto">
                                                <StripedButton onClick={handleEncryptAndShare} disabled={status !== 'IDLE' || (inputType === 'TEXT' && !message) || (inputType === 'FILE' && !selectedFile)}>
                                                    {status === 'IDLE' ? (
                                                        <>
                                                            <Lock size={18} />
                                                            Initiate Encryption Protocol
                                                        </>
                                                    ) : (
                                                        <>
                                                            <RefreshCw size={18} className="animate-spin" />
                                                            Processing...
                                                        </>
                                                    )}
                                                </StripedButton>
                                            </div>

                                            <div className="flex items-center gap-4 my-4">
                                                <div className="h-px bg-zinc-800 flex-1"></div>
                                                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">OR DECRYPT</span>
                                                <div className="h-px bg-zinc-800 flex-1"></div>
                                            </div>

                                            <div className="flex gap-2">
                                                <input
                                                    value={pasteLink}
                                                    onChange={(e) => setPasteLink(e.target.value)}
                                                    placeholder="PASTE SECURE LINK HERE..."
                                                    className="flex-1 bg-zinc-900/50 border border-zinc-800 p-3 text-xs text-zinc-300 font-mono focus:border-orange-600 focus:outline-none transition-colors"
                                                />
                                                <button
                                                    onClick={handlePasteDecrypt}
                                                    disabled={!pasteLink}
                                                    className="bg-zinc-800 border border-zinc-700 px-4 hover:bg-zinc-700 text-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Unlock size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="bg-zinc-900/50 border border-green-900/50 p-6 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-green-600"></div>
                                                <h3 className="text-green-500 font-bold mb-4 flex items-center gap-2">
                                                    <Check size={20} />
                                                    PAYLOAD SECURED
                                                </h3>
                                                <div className="flex flex-col gap-2 mb-6">
                                                    <p className="text-sm text-zinc-400">
                                                        Encryption complete. Use the link below to share the payload.
                                                    </p>
                                                    <div className="flex gap-4 text-[10px] uppercase tracking-wider text-zinc-500 font-mono mt-2">
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} /> Exp: {timeLimit < 60 ? `${timeLimit}m` : `${timeLimit / 60}h`}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Eye size={12} /> Limit: {viewLimit === -1 ? '∞' : viewLimit}
                                                        </span>
                                                    </div>
                                                </div>


                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Secure Link</label>
                                                    <div className="flex gap-0">
                                                        <input
                                                            readOnly
                                                            value={generatedLink}
                                                            className="flex-1 bg-black border border-zinc-700 border-r-0 p-3 text-xs text-zinc-300 font-mono focus:outline-none"
                                                        />
                                                        <button
                                                            onClick={copyToClipboard}
                                                            className="bg-zinc-800 border border-zinc-700 px-4 hover:bg-zinc-700 text-zinc-300 transition-colors"
                                                        >
                                                            {copied ? <Check size={16} className="text-green-500" /> : (
                                                                <Copy size={16} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <StripedButton onClick={reset} className="!border-zinc-700 !text-zinc-500 !bg-transparent hover:!text-zinc-300 hover:!border-zinc-500">
                                                Encode New Transmission
                                            </StripedButton>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* VIEW MODE */
                                <div className="space-y-6">
                                    {!decryptedContent ? (
                                        <div className="space-y-6">
                                            <div className="bg-orange-950/20 border border-orange-900/50 p-6 flex flex-col items-center text-center gap-4 py-12">
                                                <AlertTriangle size={48} className="text-orange-600 mb-2" />
                                                <h3 className="text-xl text-orange-500 font-bold uppercase tracking-widest">Encrypted Payload Detected</h3>
                                                <p className="text-zinc-500 text-sm max-w-md">
                                                    You are attempting to access a secured artifact.
                                                    To proceed, the local decryption key from your URL fragment will be applied.
                                                </p>
                                            </div>

                                            {['EXPIRED', 'BURNED'].includes(status) ? (
                                                <div className="text-center p-6 border border-red-900/50 bg-red-950/10 text-red-500 font-mono text-sm uppercase tracking-widest">
                                                    {status === 'EXPIRED' ? 'This link has expired.' : 'This link has reached its view limit.'}
                                                </div>
                                            ) : (
                                                <StripedButton onClick={handleDecrypt} disabled={status === 'DECRYPTING'}>
                                                    {status === 'DECRYPTING' ? 'Deciphering...' : 'Process Decryption Key'}
                                                </StripedButton>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <label className="text-xs font-bold text-green-600 uppercase tracking-widest flex items-center gap-2">
                                                        <Unlock size={14} />
                                                        Decrypted Content
                                                    </label>
                                                    <span className="text-[10px] text-zinc-600">UTF-8 DECODED</span>
                                                </div>
                                                <div className="w-full min-h-[16rem] bg-black/50 border border-zinc-700 p-6 text-zinc-100 font-mono text-sm leading-relaxed whitespace-pre-wrap shadow-inner relative flex flex-col justify-center">
                                                    {/* Corner markers for the text area */}
                                                    <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-600"></div>
                                                    <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-600"></div>
                                                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-600"></div>
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-600"></div>

                                                    {decryptedContent.type === 'text' && decryptedContent.content}
                                                    {decryptedContent.type === 'error' && <span className="text-red-500">{decryptedContent.content}</span>}
                                                    {decryptedContent.type === 'file' && (
                                                        <div className="flex flex-col items-center gap-4">
                                                            <FileText size={48} className="text-orange-500" />
                                                            <div className="text-center">
                                                                <p className="text-sm font-bold text-white mb-1">{decryptedContent.fileName}</p>
                                                                <p className="text-xs text-zinc-500 uppercase tracking-widest">Decrypted File Ready</p>
                                                            </div>
                                                            <a
                                                                href={decryptedContent.url}
                                                                download={decryptedContent.fileName}
                                                                className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                                                            >
                                                                <Upload size={14} className="rotate-180" />
                                                                Download File
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                onClick={reset}
                                                className="w-full py-4 text-xs uppercase tracking-widest text-zinc-600 hover:text-orange-600 transition-colors border border-zinc-800 hover:border-orange-900/30"
                                            >
                                                [ Terminate Session ]
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-zinc-800 text-[10px] text-zinc-600 font-mono uppercase flex justify-between items-end">
                    <div>
                        <p>LERNO</p>
                        <p>Focusing on Building What Matters</p>
                    </div>
                    <div className="text-right">
                        <p>All Work is Our Own</p>
                        <p>Follow on X</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
