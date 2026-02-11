
import React, { useState, useRef } from 'react';
import { PromptItem, GenerationConfig, GenerationStatus, AspectRatio, ImageSize, ImageStyle, ImageLighting } from './types';
import { generateImage } from './services/geminiService';
import { 
  PlusIcon, 
  PlayIcon, 
  TrashIcon, 
  ArrowDownTrayIcon, 
  StopIcon, 
  PhotoIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  SwatchIcon,
  SunIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [rawPrompts, setRawPrompts] = useState<string>('');
  const [promptsQueue, setPromptsQueue] = useState<PromptItem[]>([]);
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: "1:1",
    imageSize: "1K",
    highQuality: false,
    style: "none",
    lighting: "none"
  });
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const stopRef = useRef<boolean>(false);

  const handleLoadPrompts = () => {
    const lines = rawPrompts.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const newItems: PromptItem[] = lines.map((text, i) => ({
      id: `${Date.now()}-${i}`,
      text,
      status: 'pending'
    }));
    setPromptsQueue(prev => [...prev, ...newItems]);
    setRawPrompts('');
    setStatus(GenerationStatus.IDLE);
  };

  const clearQueue = () => {
    setPromptsQueue([]);
    setStatus(GenerationStatus.IDLE);
    setCurrentIndex(-1);
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startGeneration = async () => {
    if (promptsQueue.length === 0) return;
    
    stopRef.current = false;
    setStatus(GenerationStatus.PROCESSING);

    for (let i = 0; i < promptsQueue.length; i++) {
      if (stopRef.current) break;
      if (promptsQueue[i].status === 'done') continue;

      setCurrentIndex(i);
      
      setPromptsQueue(prev => prev.map((item, idx) => 
        idx === i ? { ...item, status: 'generating' } : item
      ));

      try {
        const imageUrl = await generateImage(promptsQueue[i].text, config);
        
        setPromptsQueue(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'done', imageUrl } : item
        ));
        
        downloadImage(imageUrl, `genai-${i+1}.png`);
        
      } catch (error: any) {
        console.error("Failed to generate image", error);
        setPromptsQueue(prev => prev.map((item, idx) => 
          idx === i ? { ...item, status: 'failed', error: error.message || 'Unknown error' } : item
        ));
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setStatus(GenerationStatus.COMPLETED);
    setCurrentIndex(-1);
  };

  const stopGeneration = () => {
    stopRef.current = true;
    setStatus(GenerationStatus.IDLE);
  };

  const stylesList: { id: ImageStyle; label: string; icon: string }[] = [
    { id: 'none', label: 'Default', icon: '🎨' },
    { id: 'realistic', label: 'Realistic', icon: '📸' },
    { id: 'cinematic', label: 'Cinematic', icon: '🎬' },
    { id: 'hand-painted', label: 'Painted', icon: '🖌️' },
    { id: 'stoic', label: 'Stoic', icon: '🏛️' },
    { id: 'cartoonish', label: 'Cartoon', icon: '👾' },
    { id: 'cyberpunk', label: 'Cyberpunk', icon: '🌃' },
    { id: 'minimalist', label: 'Minimal', icon: '⚪' },
    { id: 'digital-art', label: 'Digital', icon: '💻' },
  ];

  const lightingList: { id: ImageLighting; label: string }[] = [
    { id: 'none', label: 'Natural' },
    { id: 'golden-hour', label: 'Golden Hour' },
    { id: 'dramatic', label: 'Dramatic' },
    { id: 'neon', label: 'Neon' },
    { id: 'soft', label: 'Soft' },
    { id: 'studio', label: 'Studio' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <SparklesIcon className="w-10 h-10 text-indigo-600 animate-pulse" />
              VisionBulk <span className="text-indigo-600">AI</span>
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Batch generate stunning images with custom artistic styles.</p>
          </div>
          
          <div className="flex gap-2 items-center">
            {status === GenerationStatus.PROCESSING ? (
              <button 
                onClick={stopGeneration}
                className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-rose-200 active:scale-95"
              >
                <StopIcon className="w-6 h-6" /> Stop
              </button>
            ) : (
              <button 
                onClick={startGeneration}
                disabled={promptsQueue.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-indigo-200 active:scale-95"
              >
                <PlayIcon className="w-6 h-6" /> Run Batch
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                <PlusIcon className="w-6 h-6 text-indigo-500" />
                1. Add Prompts
              </h2>
              <textarea 
                value={rawPrompts}
                onChange={(e) => setRawPrompts(e.target.value)}
                placeholder="Type your prompts here...&#10;One prompt per line.&#10;Example:&#10;A brave lion in a suit&#10;An astronaut drinking chai"
                className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-sm font-medium"
              />
              <button 
                onClick={handleLoadPrompts}
                disabled={!rawPrompts.trim()}
                className="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:bg-slate-200 transition-all active:scale-[0.98]"
              >
                Queue Prompts
              </button>
            </section>

            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                <SwatchIcon className="w-6 h-6 text-indigo-500" />
                2. Select Style
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {stylesList.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setConfig(prev => ({ ...prev, style: s.id }))}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                      config.style === s.id 
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 scale-[1.05] z-10 shadow-md' 
                        : 'border-slate-100 text-slate-600 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <span className="text-xl mb-1">{s.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{s.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                <SunIcon className="w-6 h-6 text-indigo-500" />
                3. Final Details
              </h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Lighting Mood</label>
                  <div className="flex flex-wrap gap-2">
                    {lightingList.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setConfig(prev => ({ ...prev, lighting: l.id }))}
                        className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
                          config.lighting === l.id 
                            ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm' 
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Aspect Ratio</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(["1:1", "3:4", "4:3", "9:16", "16:9"] as AspectRatio[]).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setConfig(prev => ({ ...prev, aspectRatio: ratio }))}
                        className={`py-2 text-[10px] font-black rounded-lg border transition-all ${
                          config.aspectRatio === ratio 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : 'border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="flex items-center justify-between cursor-pointer group p-3 rounded-2xl bg-indigo-50/30 border border-indigo-100 hover:bg-indigo-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg transition-colors ${config.highQuality ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        <SparklesIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-700 block leading-tight">Gemini Pro Mode</span>
                        <span className="text-[10px] text-indigo-500 font-bold uppercase">Ultimate Quality</span>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      checked={config.highQuality}
                      onChange={(e) => setConfig(prev => ({ ...prev, highQuality: e.target.checked }))}
                    />
                  </label>
                </div>
              </div>
            </section>
          </div>

          {/* Results Queue */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black text-slate-800">Processing Queue</h2>
                  {promptsQueue.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs font-bold text-slate-600">
                        {promptsQueue.filter(p => p.status === 'done').length} Complete
                      </span>
                    </div>
                  )}
                </div>
                {promptsQueue.length > 0 && status === GenerationStatus.IDLE && (
                  <button 
                    onClick={clearQueue}
                    className="group flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-all font-bold text-xs uppercase"
                  >
                    <TrashIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Clear List
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {promptsQueue.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 py-32 space-y-4">
                    <div className="p-8 bg-slate-50 rounded-full border-2 border-dashed border-slate-200">
                      <PhotoIcon className="w-20 h-20 opacity-20" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-400">Your gallery is empty</p>
                      <p className="text-sm font-medium">Add some prompts on the left to begin your artistic journey.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {promptsQueue.map((item, index) => (
                      <div 
                        key={item.id} 
                        className={`group relative flex flex-col rounded-3xl border transition-all duration-300 overflow-hidden ${
                          index === currentIndex 
                            ? 'border-indigo-400 bg-indigo-50/30 shadow-xl ring-2 ring-indigo-500/20' 
                            : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg hover:-translate-y-1'
                        }`}
                      >
                        <div className="aspect-square bg-slate-100 relative flex items-center justify-center border-b border-slate-100 overflow-hidden">
                          {item.imageUrl ? (
                            <>
                              <img src={item.imageUrl} alt={item.text} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <button 
                                  onClick={() => downloadImage(item.imageUrl!, `image-${index}.png`)}
                                  className="w-full bg-white text-slate-900 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform"
                                >
                                  <ArrowDownTrayIcon className="w-5 h-5" /> Download
                                </button>
                              </div>
                            </>
                          ) : item.status === 'generating' ? (
                            <div className="flex flex-col items-center p-8 text-center">
                              <div className="relative mb-4">
                                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                                <ArrowPathIcon className="w-12 h-12 text-indigo-500 animate-spin relative" />
                              </div>
                              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest animate-pulse">Dreaming...</span>
                            </div>
                          ) : item.status === 'failed' ? (
                            <div className="flex flex-col items-center gap-2 p-8 text-center">
                              <ExclamationCircleIcon className="w-12 h-12 text-rose-400" />
                              <span className="text-xs font-bold text-rose-500 uppercase">Failed to Visualize</span>
                            </div>
                          ) : (
                            <div className="text-slate-300 font-black text-4xl opacity-10 select-none">#{index + 1}</div>
                          )}
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3 flex gap-1">
                            {item.status === 'done' && (
                              <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-lg">
                                <CheckCircleIcon className="w-4 h-4" />
                              </div>
                            )}
                            <div className="bg-black/50 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase">
                              #{index + 1}
                            </div>
                          </div>
                        </div>

                        <div className="p-4">
                          <p className="text-xs text-slate-700 font-bold line-clamp-2 leading-snug min-h-[2.5rem]" title={item.text}>
                            {item.text}
                          </p>
                          {item.error && (
                            <p className="text-[10px] text-rose-500 mt-2 font-medium bg-rose-50 px-2 py-1 rounded border border-rose-100">
                              {item.error}
                            </p>
                          )}
                        </div>

                        {item.status === 'generating' && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden">
                            <div className="h-full bg-indigo-600 animate-[progress_3s_ease-in-out_infinite] w-[30%]"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {status === GenerationStatus.PROCESSING && (
                <div className="p-5 bg-indigo-600 text-white flex items-center justify-between shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                       <div className="absolute inset-0 bg-white rounded-full blur-md opacity-30 animate-pulse"></div>
                       <ArrowPathIcon className="w-6 h-6 animate-spin relative" />
                    </div>
                    <div>
                      <span className="font-black text-sm uppercase tracking-wider block">
                        Engine Processing Batch
                      </span>
                      <span className="text-[10px] font-bold opacity-80">
                        Analyzing Prompt {currentIndex + 1} of {promptsQueue.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-2 w-32 bg-indigo-400 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-white transition-all duration-500" 
                         style={{ width: `${((currentIndex + 1) / promptsQueue.length) * 100}%` }}
                       ></div>
                    </div>
                    <div className="text-xs font-black bg-white/20 px-3 py-1 rounded-full">
                      {Math.round(((currentIndex + 1) / promptsQueue.length) * 100)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        ::selection {
          background-color: #6366f1;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default App;
