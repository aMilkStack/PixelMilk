# Gemini API generateContent Reference

## Method Overview

**models.generateContent** generates model responses from an input `GenerateContentRequest`. It supports multiple modalities and capabilities including images, audio, code, and function calling.

## Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/{model=models/*}:generateContent
```

## Path Parameters

- **model** (string, required): The model identifier in format `models/{model}` (e.g., `models/gemini-2.0-flash`)

## Request Body Structure

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| contents | Content[] | Yes | "The content of the current conversation with the model" |
| tools | Tool[] | No | External tools for function calling and code execution |
| toolConfig | ToolConfig | No | Configuration for tools specified in request |
| safetySettings | SafetySetting[] | No | Safety filter thresholds for harmful content |
| systemInstruction | Content | No | "Developer set system instruction(s). Currently, text only" |
| generationConfig | GenerationConfig | No | Model generation and output configuration |
| cachedContent | string | No | Cached content reference for context |

## GenerationConfig Options

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| maxOutputTokens | integer | Model-dependent | Maximum tokens in response |
| temperature | number | Model-dependent | Randomness control (0.0-2.0) |
| topP | number | Model-dependent | Cumulative probability sampling |
| topK | integer | Model-dependent | Maximum tokens to consider |
| candidateCount | integer | 1 | Number of response candidates |
| stopSequences | string[] | - | Stop generation at these sequences |
| responseMimeType | string | text/plain | Output format (text/plain, application/json) |
| responseSchema | Schema | - | JSON schema for structured output |
| seed | integer | Random | Decoding seed for reproducibility |
| presencePenalty | number | - | Discourage reused tokens |
| frequencyPenalty | number | - | Penalize tokens by usage frequency |

## Response Structure

The response contains a `GenerateContentResponse` object with:

- **candidates**: Response candidate objects containing generated content
- **promptFeedback**: Safety feedback on input prompt
- **usageMetadata**: Token usage statistics
- **modelVersion**: Model identifier used for generation
- **responseId**: Unique response identifier

### Candidate Fields

- **content**: Generated text/multimodal output
- **finishReason**: Reason generation stopped (STOP, MAX_TOKENS, SAFETY, etc.)
- **safetyRatings**: Safety classification ratings
- **tokenCount**: Token count for this candidate
- **groundingMetadata**: Sources and citations (when grounding enabled)

## FinishReason Enum

Common completion reasons: `STOP` (natural end), `MAX_TOKENS` (limit reached), `SAFETY` (filtered), `RECITATION` (copyrighted content), `BLOCKLIST` (forbidden terms)

## SafetySetting Categories

Supported harm categories: HARM_CATEGORY_HATE_SPEECH, HARM_CATEGORY_HARASSMENT, HARM_CATEGORY_SEXUALLY_EXPLICIT, HARM_CATEGORY_DANGEROUS_CONTENT, HARM_CATEGORY_CIVIC_INTEGRITY

## Streaming Alternative

**models.streamGenerateContent** provides identical request/response structure but returns streamed `GenerateContentResponse` instances for real-time output.
