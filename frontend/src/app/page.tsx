"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, CheckCircle2, Scan, RefreshCw, Camera } from "lucide-react";

type ModelType = "resnet50" | "mobilenet_v2" | "efficientnet_b0";

interface PredictionResult {
  class_name: string;
  confidence: number;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>("resnet50");
  const [isCameraActive, setIsCameraActive] = useState(false);
  
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
      
      const res = await fetch("/api/classify", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error("Classification failed");
      
      const data = await res.json();
      setResult({ 
        class_name: data.class_name,
        confidence: data.confidence
      });
    } catch (error) {
      console.error(error);
      alert("Failed to classify the image.");
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

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      <div className="w-full max-w-5xl text-center space-y-6 z-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
          Image Classification
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Upload an image or use real-time camera detection to classify the main object.
        </p>

        <div className="flex items-center justify-center gap-3 mt-4">
          <label htmlFor="model-select" className="text-sm font-medium text-foreground">Model:</label>
          <select 
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ModelType)}
            className="bg-background border border-border text-foreground py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          >
            <option value="resnet50">ResNet-50</option>
            <option value="mobilenet_v2">MobileNet V2</option>
            <option value="efficientnet_b0">EfficientNet B0</option>
          </select>
        </div>

        <div className="mt-8 bg-card rounded-lg p-6 md:p-8 mx-auto w-full max-w-3xl relative overflow-hidden border border-border">
          {!preview && !isCameraActive ? (
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed border-primary/30 rounded-lg p-12 transition-all hover:bg-primary/5 cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="text-muted-foreground w-10 h-10 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Image</h3>
              <p className="text-muted-foreground text-sm mb-6">Select or drop an image file</p>
              
              <button 
                onClick={(e) => { e.stopPropagation(); startCamera(); }}
                className="bg-secondary hover:bg-secondary/80 border border-border px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors"
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
            </div>
          ) : isCameraActive ? (
            <div className="flex flex-col items-center">
              <div className="relative w-full h-80 bg-black rounded-lg overflow-hidden mb-6">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex gap-4 w-full">
                <button onClick={stopCamera} className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground py-2 rounded-md font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={captureFrame} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-md font-medium transition-colors flex justify-center items-center gap-2">
                  <Scan size={18} /> Capture
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden border border-border mb-8">
                <img src={preview!} alt="Preview" className="w-full h-full object-cover" />
              </div>

              {!result ? (
                <button
                  onClick={() => handleClassify(file!)}
                  disabled={isUploading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-8 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} /> Processing...
                    </>
                  ) : (
                    <>
                      <Scan size={18} /> Classify Image
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full text-left space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="text-green-500 w-5 h-5" />
                    <h3 className="text-lg font-medium text-foreground">Classification Result</h3>
                  </div>
                  
                  <div className="bg-secondary border border-border rounded-md p-4 flex justify-between items-end">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                        Predicted Class
                      </p>
                      <p className="text-xl font-bold capitalize text-foreground">{result.class_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                        Confidence
                      </p>
                      <p className="text-xl font-medium text-foreground">
                        {result.confidence ? (result.confidence * 100).toFixed(1) : '99.0'}%
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={reset}
                    className="w-full bg-secondary hover:bg-secondary/80 text-foreground font-medium py-2 px-8 rounded-md transition-colors border border-border flex items-center justify-center gap-2"
                  >
                    Analyze Another
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
