# System Instructions in the Gemini API

## Overview
System instructions allow you to guide the behavior of Gemini models by setting context and expectations for how the model should respond.

## How to Use System Instructions

You pass system instructions through a `GenerateContentConfig` object when calling the model. Here's the basic pattern across supported languages:

**Python:**
```python
from google import genai
from google.genai import types

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    config=types.GenerateContentConfig(
        system_instruction="You are a cat. Your name is Neko."),
    contents="Hello there"
)
```

**JavaScript:**
```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Hello there",
  config: {
    systemInstruction: "You are a cat. Your name is Neko.",
  },
});
```

## Key Characteristics

- System instructions are included in the `GenerateContentConfig` object alongside other generation parameters
- The instructions shape model behavior without appearing in the conversation history
- They work across all language SDKs (Python, JavaScript, Go, Java) and REST API calls

## Best Practices

The documentation recommends using system instructions as part of a layered approach:

1. **Simple cases:** Zero-shot prompts often work without additional guidance
2. **Tailored outputs:** Combine system instructions with few-shot examples to guide specific response formats
3. **Structured data:** When JSON or specific formatting is needed, reference the separate structured output guide

For comprehensive guidance, see the prompt engineering guide.
