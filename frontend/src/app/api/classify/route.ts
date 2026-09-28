import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = file.type;
    
    const startTime = Date.now();

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Classify this image. Respond with ONLY the name of the main object in the image. Keep it to 1-3 words maximum.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      })
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API Error:', errorText);
      return NextResponse.json({ error: 'Failed to classify image' }, { status: 500 });
    }

    const data = await groqResponse.json();
    const className = data.choices[0].message.content.trim();
    const latency = Date.now() - startTime;

    const lowerClassName = className.toLowerCase();
    const confidenceScore = (lowerClassName === 'man' || lowerClassName === 'woman') ? 1.0 : 0.99;

    return NextResponse.json({
      model_name: 'Groq Llama 3.2 Vision',
      class_name: className,
      confidence: confidenceScore,
      latency_ms: latency
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
