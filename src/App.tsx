import React, { useState, useRef, useEffect } from 'react';
import { Settings, Image as ImageIcon, FileText, CheckCircle, Activity, HeartPulse, Send, UploadCloud, Mic, Square, Trash2 } from 'lucide-react';
import { runIntegratedAnalysis } from './services/api';

const App: React.FC = () => {
  // Input State
  const [history, setHistory] = useState('');
  const [examination, setExamination] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('geminiApiKey') || '');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [donateData, setDonateData] = useState(false);

  // Analysis State
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    localStorage.setItem('geminiApiKey', apiKey);
  }, [apiKey]);

  // Audio Recording (Voice Dictation / Patient Consult)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlobLocal = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlobLocal);
        setAudioUrl(URL.createObjectURL(audioBlobLocal));
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      alert("Failed to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleClearAudio = () => {
    setAudioUrl(null);
    setAudioBlob(null);
  };

  // File Handling
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files as FileList)]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Run AI Analysis
  const handleAnalyze = async () => {
    if (!apiKey) {
      setIsSettingsOpen(true);
      setError("Please add an API Key first.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await runIntegratedAnalysis({
        history,
        examination,
        files,
        audioBlob,
        apiKey,
        model,
        donateData
      });
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err) || "An error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  // Safe Markdown display (Basic regex parsing for demonstration)
  // Instead of importing Markdown renderer, build a highly robust, pure React formatter
  const renderMarkdown = (text: string) => {
      if(!text) return null;
      return <div className="results-markdown" dangerouslySetInnerHTML={{__html: 
          text.replace(/^### (.*)$/gm, '<h3>$1</h3>')
              .replace(/^## (.*)$/gm, '<h2>$1</h2>')
              .replace(/^# (.*)$/gm, '<h1>$1</h1>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\n\n/g, '<br/>')
              .replace(/\n- (.*)/g, '<li>$1</li>')
      }} />;
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <h1><Activity color="var(--primary)" size={28} /> Co-Pilot AI</h1>
        <nav className="sidebar-nav">
          <button className="nav-item active"><HeartPulse size={20}/> New Case Analysis</button>
          <button className="nav-item"><FileText size={20}/> Case History</button>
          <button className="nav-item" onClick={() => setIsSettingsOpen(true)}><Settings size={20}/> Configuration</button>
        </nav>
        
        <div style={{marginTop: 'auto'}}>
          <label className="toggle-wrapper" title="Anonymized queries help train our future specialized code models">
             <input type="checkbox" className="toggle-checkbox" checked={donateData} onChange={e => setDonateData(e.target.checked)} />
             <span style={{color: 'var(--text-secondary)', fontSize: '0.8rem'}}>Contribute to Code Model Hub</span>
          </label>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">Multi-Modal Diagnostic Co-Pilot</div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setIsSettingsOpen(true)}>Settings</button>
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={isLoading}>
              {isLoading ? <span className="loading-spinner"></span> : <><Send size={16}/> Integrate & Analyze</>}
            </button>
          </div>
        </header>

        <section className="content-area">
          {/* Left Panel: Inputs */}
          <div className="panel">
            <div className="panel-header">Clinical Baseline Inputs</div>
            <div className="panel-body">
              {/* Voice / Audio Consult */}
              <div className="form-group">
                <label className="form-label">
                  Consultation Audio (Dictation or Dialogue)
                  {isRecording && <span className="recording-indicator"></span>}
                </label>
                <div className="audio-controls">
                  {!isRecording ? (
                     <button className="btn btn-secondary" onClick={startRecording}><Mic size={16}/> Record</button>
                  ) : (
                     <button className="btn btn-primary" style={{backgroundColor: 'var(--danger)', borderColor: 'var(--danger)'}} onClick={stopRecording}><Square size={16}/> Stop</button>
                  )}
                  {audioUrl && (
                    <>
                      <audio src={audioUrl} controls style={{height: '35px', flex: 1}}/>
                      <button className="btn btn-secondary" style={{padding: '0.25rem'}} onClick={handleClearAudio}><Trash2 size={16}/></button>
                    </>
                  )}
                </div>
              </div>

              {/* Text Fields */}
              <div className="form-group">
                <label className="form-label">Patient History</label>
                <textarea 
                  className="form-control" 
                  placeholder="Enter medical history, symptoms, past illnesses..." 
                  value={history} onChange={(e) => setHistory(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">General & Systemic Examination</label>
                <textarea 
                  className="form-control" 
                  placeholder="Vitals, targeted physical exams..." 
                  value={examination} onChange={(e) => setExamination(e.target.value)} 
                />
              </div>

              {/* Multimodal Uploads */}
              <div className="form-group">
                <label className="form-label">Diagnostics, Scans & Records</label>
                <div 
                  className="dropzone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud className="dropzone-icon" size={32} />
                  <div className="dropzone-text">Drag & drop files here, or click to browse</div>
                  <div className="dropzone-text" style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>Supports ECGs (Images/PDFs), X-Rays, Lab Reports</div>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple accept="image/*,application/pdf" style={{display: 'none'}} />
                </div>

                {files.length > 0 && (
                  <div className="file-list">
                    {files.map((file, idx) => (
                      <div className="file-item" key={idx}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                          {file.type.startsWith('image/') ? <ImageIcon size={16} color="var(--primary)"/> : <FileText size={16} color="var(--accent)"/>}
                          <span>{file.name}</span>
                        </div>
                        <button className="file-remove" onClick={() => removeFile(idx)}><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Output */}
          <div className="panel" style={{borderColor: analysisResult ? 'var(--primary)' : 'var(--border)'}}>
            <div className="panel-header" style={{backgroundColor: analysisResult ? 'rgba(2, 132, 199, 0.2)' : 'var(--surface-color-light)'}}>
              <CheckCircle size={20} color={analysisResult ? "var(--primary)" : "var(--text-secondary)"} />
              Diagnostic Output & Treatment Plan
            </div>
            <div className="panel-body">
              {error && (
                <div style={{padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '0.5rem', border: '1px solid var(--danger)'}}>
                  <strong>Error:</strong> {error}
                </div>
              )}
              
              {!analysisResult && !isLoading && !error && (
                <div style={{textAlign: 'center', color: 'var(--text-secondary)', marginTop: '20vh'}}>
                  <Activity size={48} style={{opacity: 0.2, margin: '0 auto 1rem'}} />
                  Provide clinical inputs and click "Integrate & Analyze" <br/> to generate the cohesive plan.
                </div>
              )}
              
              {isLoading && (
                <div style={{textAlign: 'center', color: 'var(--primary)', marginTop: '20vh'}}>
                   <div className="loading-spinner" style={{width: '40px', height: '40px', borderWidth: '4px', borderColor: 'rgba(2,132,199,0.3)', borderTopColor: 'var(--primary)', marginBottom: '1rem'}}></div>
                   <div>Synthesizing Multimodal Model Outputs...</div>
                </div>
              )}
              
              {analysisResult && (
                 renderMarkdown(analysisResult)
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Model Settings</div>
              <button className="modal-close" onClick={() => setIsSettingsOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
               <div className="form-group" style={{marginBottom: '1rem'}}>
                  <label className="form-label">Gemini API Key</label>
                  <input type="password" placeholder="AIZA..." className="form-control" value={apiKey} onChange={e => setApiKey(e.target.value)} />
               </div>
               <div className="form-group">
                  <label className="form-label">Inference Model</label>
                  <select className="form-control" value={model} onChange={e => setModel(e.target.value)}>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast, Multimodal)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Advanced Reasoning, Multimodal)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  </select>
               </div>
            </div>
            <div className="modal-footer">
               <button className="btn btn-primary" onClick={() => setIsSettingsOpen(false)}>Save & Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
