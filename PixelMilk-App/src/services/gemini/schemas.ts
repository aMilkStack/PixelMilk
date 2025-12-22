import { Type, Schema } from '@google/genai';

export const pixelDataSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'Asset name' },
    width: { type: Type.INTEGER, description: 'Canvas width in pixels' },
    height: { type: Type.INTEGER, description: 'Canvas height in pixels' },
    palette: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: 'Hex code #RRGGBB' },
      description: 'Array of unique colors used',
    },
    pixels: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: 'Hex code #RRGGBB or \"transparent\"' },
      description: 'Row-major pixel array, length = width * height',
    },
    normalMap: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: 'Hex code #RRGGBB' },
      description: 'Optional normal map',
    },
  },
  required: ['name', 'width', 'height', 'palette', 'pixels'],
};

export const characterIdentitySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    physicalDescription: {
      type: Type.OBJECT,
      properties: {
        bodyType: { type: Type.STRING },
        heightStyle: { type: Type.STRING },
        silhouette: { type: Type.STRING },
      },
      required: ['bodyType', 'heightStyle', 'silhouette'],
    },
    colourPalette: {
      type: Type.OBJECT,
      properties: {
        primary: { type: Type.STRING },
        secondary: { type: Type.STRING },
        accent: { type: Type.STRING },
        skin: { type: Type.STRING },
        hair: { type: Type.STRING },
        outline: { type: Type.STRING },
      },
      required: ['primary', 'secondary', 'accent', 'skin', 'hair', 'outline'],
    },
    distinctiveFeatures: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    styleParameters: {
      type: Type.OBJECT,
      properties: {
        outlineStyle: { type: Type.STRING },
        shadingStyle: { type: Type.STRING },
        detailLevel: { type: Type.STRING },
        canvasSize: { type: Type.INTEGER },
        paletteMode: { type: Type.STRING },
        viewType: { type: Type.STRING },
      },
      required: [
        'outlineStyle',
        'shadingStyle',
        'detailLevel',
        'canvasSize',
        'paletteMode',
        'viewType',
      ],
    },
    angleNotes: {
      type: Type.OBJECT,
      description: 'Brief visibility hints (under 50 chars each) for 4 cardinal directions',
      properties: {
        S: { type: Type.STRING, description: 'Front view hint, e.g. "face and chest visible"' },
        N: { type: Type.STRING, description: 'Back view hint, e.g. "cape flows behind"' },
        E: { type: Type.STRING, description: 'Right profile hint, e.g. "sword on right hip"' },
        W: { type: Type.STRING, description: 'Left profile hint, e.g. "shield on left arm"' },
      },
    },
  },
  required: [
    'id',
    'name',
    'description',
    'physicalDescription',
    'colourPalette',
    'distinctiveFeatures',
    'angleNotes',
  ],
};

export const promptSuggestionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    optimizedPrompt: { type: Type.STRING, description: 'Improved prompt text' },
    explanation: { type: Type.STRING, description: 'Why these changes help' },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Additional tips',
    },
  },
  required: ['optimizedPrompt', 'explanation'],
};
