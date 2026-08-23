from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
import torch
import torchvision.transforms as transforms
import torchvision.models as models
from PIL import Image
import io
import json

app = FastAPI(title="AI Image Classification System API")

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load a pre-trained model (ResNet50)
model = models.resnet50(pretrained=True)
model.eval()

# Load ImageNet labels
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
    class_id: str
    class_name: str
    confidence: float

@app.post("/predict", response_model=PredictionResult)
async def predict_image(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        input_tensor = preprocess(image)
        input_batch = input_tensor.unsqueeze(0)
        
        with torch.no_grad():
            output = model(input_batch)
        
        probabilities = torch.nn.functional.softmax(output[0], dim=0)
        confidence, class_idx = torch.max(probabilities, 0)
        
        class_id = str(class_idx.item())
        class_name = imagenet_classes.get(class_id, ["Unknown", "Unknown"])[1]
        
        return PredictionResult(
            class_id=class_id,
            class_name=class_name,
            confidence=confidence.item()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/train")
async def train_custom_dataset(file: UploadFile = File(...)):
    # ponytail: Simulated training loop. Ceiling: Does not actually train a model. Upgrade: Implement a real PyTorch DataLoader and fine-tuning loop in a background worker (e.g., Celery) to prevent blocking the API.
    return {"message": "Training job started (Simulated)", "status": "running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
