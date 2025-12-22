/**
 * Gemini Co-Drawing Reference
 * Interactive drawing with Gemini image generation
 * Key patterns from the co-drawing implementation
 */

import { GoogleGenAI, Modality, Content } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Model options for drawing
const DRAWING_MODELS = {
  flash25: 'gemini-2.5-flash-image',
  flash20: 'gemini-2.0-flash-preview-image-generation',
};

/**
 * Key pattern: Multi-turn content structure for image editing
 * The drawing is sent as an image, followed by the edit prompt
 */
async function generateFromDrawing(
  drawingData: string,  // base64 PNG data
  prompt: string,
  selectedModel: string = 'gemini-2.5-flash-image'
): Promise<{ imageData: string; message?: string }> {

  // Key pattern: Structure content as multiple role parts
  let contents: Content[] = [
    {
      role: 'USER',
      parts: [
        {
          text: prompt,
        },
      ],
    },
  ];

  // When drawing data exists, send image first, then prompt
  if (drawingData) {
    contents = [
      {
        role: 'USER',
        parts: [{ inlineData: { data: drawingData, mimeType: 'image/png' } }],
      },
      {
        role: 'USER',
        parts: [
          {
            // Key pattern: Style preservation instruction
            text: `${prompt}. Keep the same minimal line drawing style.`,
          },
        ],
      },
    ];
  }

  const response = await ai.models.generateContent({
    model: selectedModel,
    contents,
    config: {
      // Key pattern: Request both text and image modalities
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const data = {
    success: true,
    message: '',
    imageData: null as string | null,
    error: undefined,
  };

  // Key pattern: Parse response for both text and image parts
  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      data.message = part.text;
    } else if (part.inlineData) {
      data.imageData = part.inlineData.data;
    }
  }

  return data;
}

/**
 * Canvas to base64 helper
 * Important: Add white background for proper image generation
 */
function canvasToBase64(canvas: HTMLCanvasElement): string {
  // Create a temporary canvas to add white background
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d');

  // Fill with white background - CRITICAL for image generation
  tempCtx.fillStyle = '#FFFFFF';
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Draw the original canvas content on top
  tempCtx.drawImage(canvas, 0, 0);

  // Return base64 without data URL prefix
  return tempCanvas.toDataURL('image/png').split(',')[1];
}

/**
 * Key patterns for co-drawing:
 *
 * 1. CONTENT STRUCTURE
 *    - Send drawing image first as separate USER part
 *    - Follow with text prompt as second USER part
 *    - Use responseModalities: [TEXT, IMAGE] to get both
 *
 * 2. STYLE PRESERVATION
 *    - Add instruction to "keep the same style"
 *    - For line drawings: "Keep the same minimal line drawing style"
 *    - For pixel art: would be "Keep the same pixel art style with clean edges"
 *
 * 3. BACKGROUND HANDLING
 *    - Always add white background before sending to Gemini
 *    - Transparent backgrounds can cause issues
 *
 * 4. ITERATIVE EDITING
 *    - Each generation becomes the new background
 *    - User can draw on top of generated image
 *    - Next prompt uses the combined canvas
 *
 * 5. MODEL SELECTION
 *    - gemini-2.5-flash-image: Faster, good for iterative work
 *    - gemini-2.0-flash-preview-image-generation: Alternative option
 */

export { generateFromDrawing, canvasToBase64, DRAWING_MODELS };
