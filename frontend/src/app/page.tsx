"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, CheckCircle2, Scan, RefreshCw, Layers, Camera, Database, ChevronDown } from "lucide-react";

type ModelType = "resnet50" | "mobilenet_v2" | "efficientnet_b0";

interface PredictionResult {
  model_name: string;
  class_name: string;
  confidence: number;
  latency_ms: number;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>("resnet50");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      stopCamera();
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      stopCamera();
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setResult(null);
    }
  };

  const handleClassify = async (imageFile: File = file!) => {
    if (!imageFile) return;
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("model_name", selectedModel);
      
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

  const startCamera = async () => {
    setIsCameraActive(true);
    reset();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const capturedFile = new File([blob], "capture.jpg", { type: "image/jpeg" });
            setFile(capturedFile);
            setPreview(URL.createObjectURL(capturedFile));
            stopCamera();
            handleClassify(capturedFile);
          }
        }, "image/jpeg");
      }
    }
  };

  const simulateTraining = () => {
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
      alert("Simulated training complete! Model weights updated.");
    }, 3000);
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
        className="w-full max-w-5xl text-center space-y-6 z-10"
      >
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium shadow-sm backdrop-blur-md">
            <Scan size={16} /> Lumina Engine v2.0
          </div>
          <button 
            onClick={simulateTraining}
            disabled={isTraining}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors border border-border text-foreground text-sm font-medium shadow-sm backdrop-blur-md disabled:opacity-50"
          >
            {isTraining ? <RefreshCw className="animate-spin" size={16} /> : <Database size={16} />}
            {isTraining ? "Training..." : "Custom Train Dataset"}
          </button>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
          AI Image Classification
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light">
          Upload an image or use real-time camera detection. Compare multiple CNN architectures instantly.
        </p>

        {/* Model Selector */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <span className="text-sm font-medium text-muted-foreground">Active Model:</span>
          <div className="relative">
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as ModelType)}
              className="appearance-none bg-background/50 border border-border/50 text-foreground py-2 pl-4 pr-10 rounded-xl backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
            >
              <option value="resnet50">ResNet-50</option>
              <option value="mobilenet_v2">MobileNet V2</option>
              <option value="efficientnet_b0">EfficientNet B0</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Main Interface */}
        <div className="mt-8 glass rounded-3xl p-6 md:p-10 mx-auto w-full max-w-3xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!preview && !isCameraActive ? (
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
                <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-6 shadow-inner">
                  <UploadCloud className="text-foreground w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Drag & Drop Image</h3>
                <p className="text-muted-foreground text-sm mb-6">or click to browse from your device</p>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); startCamera(); }}
                  className="bg-secondary/50 hover:bg-secondary border border-border/50 px-6 py-2.5 rounded-full flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <Camera size={16} /> Open Camera
                </button>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </motion.div>
            ) : isCameraActive ? (
              <motion.div
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="relative w-full h-80 bg-black rounded-2xl overflow-hidden mb-6 shadow-2xl">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex gap-4 w-full">
                  <button onClick={stopCamera} className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground py-3 rounded-xl font-medium transition-colors">
                    Cancel
                  </button>
                  <button onClick={captureFrame} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-medium transition-colors shadow-lg shadow-primary/25 flex justify-center items-center gap-2">
                    <Scan size={18} /> Capture & Classify
                  </button>
                </div>
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
                  <img src={preview!} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={reset} className="text-xs bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white/90 hover:bg-black/70 flex items-center gap-1.5 transition-colors">
                      <RefreshCw size={12} /> Replace Image
                    </button>
                  </div>
                </div>

                {!result ? (
                  <button
                    onClick={() => handleClassify(file!)}
                    disabled={isUploading}
                    className="w-full relative group overflow-hidden bg-foreground hover:bg-foreground/90 text-background font-semibold py-4 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
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
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="text-green-400 w-6 h-6" />
                        <h3 className="text-xl font-medium text-foreground">Classification Complete</h3>
                      </div>
                      <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-md">
                        Latency: {result.latency_ms}ms
                      </div>
                    </div>
                    
                    <div className="bg-background/40 border border-border/50 rounded-xl p-5 backdrop-blur-md">
                      <div className="flex justify-between items-end mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                            Predicted Class ({result.model_name})
                          </p>
                          <p className="text-2xl font-bold capitalize text-foreground drop-shadow-sm">{result.class_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-light">{(result.confidence * 100).toFixed(1)}<span className="text-lg text-muted-foreground">%</span></p>
                        </div>
                      </div>
                      
                      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.confidence * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                          className="bg-foreground h-full rounded-full"
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
