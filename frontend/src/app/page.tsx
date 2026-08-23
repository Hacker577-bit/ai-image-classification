"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, CheckCircle2, Scan, RefreshCw, Layers } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ class_name: string; confidence: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setResult(null);
    }
  };

  const handleClassify = async () => {
    if (!file) return;
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error("Classification failed");
      
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Failed to connect to the ML backend. Ensure the FastAPI server is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-4xl text-center space-y-6 z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4 shadow-sm backdrop-blur-md">
          <Scan size={16} /> Lumina Vision Engine v1.0
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-indigo-400">
          AI Image Classification
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light">
          Upload any image and our custom PyTorch CNN architecture will identify it with high accuracy in real-time.
        </p>

        {/* Upload & Result Container */}
        <div className="mt-12 glass rounded-3xl p-6 md:p-10 mx-auto w-full max-w-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-2xl p-12 transition-all hover:bg-primary/5 hover:border-primary/50 cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-inner">
                  <UploadCloud className="text-primary w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Drag & Drop Image</h3>
                <p className="text-muted-foreground text-sm">or click to browse from your device</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center"
              >
                <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl mb-8 group">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={reset} className="text-xs bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white/90 hover:bg-black/70 flex items-center gap-1.5 transition-colors">
                      <RefreshCw size={12} /> Replace Image
                    </button>
                  </div>
                </div>

                {!result ? (
                  <button
                    onClick={handleClassify}
                    disabled={isUploading}
                    className="w-full relative group overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-8 rounded-xl transition-all shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="animate-spin" size={20} /> Analyzing Tensor...
                      </>
                    ) : (
                      <>
                        <Scan size={20} /> Classify Image
                      </>
                    )}
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700" />
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full text-left space-y-4"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle2 className="text-green-400 w-6 h-6" />
                      <h3 className="text-xl font-medium text-foreground">Classification Complete</h3>
                    </div>
                    
                    <div className="bg-background/40 border border-border/50 rounded-xl p-5 backdrop-blur-md">
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Predicted Class</p>
                          <p className="text-2xl font-bold capitalize text-primary drop-shadow-sm">{result.class_name.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-light">{(result.confidence * 100).toFixed(1)}<span className="text-lg text-muted-foreground">%</span></p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-secondary/50 rounded-full h-3 overflow-hidden shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                          className="bg-gradient-to-r from-primary to-purple-400 h-full rounded-full"
                        />
                      </div>
                    </div>
                    
                    <button
                      onClick={reset}
                      className="w-full bg-secondary/50 hover:bg-secondary/80 text-foreground font-medium py-3 px-8 rounded-xl transition-colors border border-border/50 flex items-center justify-center gap-2"
                    >
                      <Layers size={18} /> Analyze Another
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
