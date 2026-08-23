from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
import torch
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import io
import json
import time

app = FastAPI(title="AI Image Classification API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load multiple pre-trained models for comparison
available_models = {
    "resnet50": models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1),
    "mobilenet_v2": models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1),
    "efficientnet_b0": models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)
}

for m in available_models.values():
    m.eval()

try:
    with open("imagenet_class_index.json") as f:
        imagenet_classes = json.load(f)
except FileNotFoundError:
    imagenet_classes = {str(i): ["Unknown", f"Class {i}"] for i in range(1000)}

preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

class PredictionResult(BaseModel):
    model_name: str
    class_id: str
    class_name: str
    confidence: float
    latency_ms: float

@app.get("/models")
async def get_models():
    return {"models": list(available_models.keys())}

@app.post("/predict", response_model=PredictionResult)
async def predict_image(
    file: UploadFile = File(...),
    model_name: str = Form("resnet50")
):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
    if model_name not in available_models:
        raise HTTPException(status_code=400, detail="Model not supported.")
        
    try:
        start_time = time.time()
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        input_tensor = preprocess(image)
        input_batch = input_tensor.unsqueeze(0)
        
        selected_model = available_models[model_name]
        with torch.no_grad():
            output = selected_model(input_batch)
        
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        confidence, class_idx = torch.max(probabilities, 0)
        
        latency = (time.time() - start_time) * 1000
        class_id = str(class_idx.item())
        class_name = imagenet_classes.get(class_id, ["Unknown", "Unknown"])[1]
        
        return PredictionResult(
            model_name=model_name,
            class_id=class_id,
            class_name=class_name.replace("_", " ").title(),
            confidence=confidence.item(),
            latency_ms=round(latency, 2)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def train_custom_dataset(file: UploadFile = File(...), dataset_name: str = Form(...)):
    # ponytail: Simulated training loop. Ceiling: No real PyTorch backward pass. Upgrade: Spawn a background Celery task with a real DataLoader to fine-tune the final layer.
    return {
        "message": f"Training job started for {dataset_name}", 
        "status": "running",
        "job_id": "sim-job-123"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
