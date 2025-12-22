# Gemini Models Overview

## Current Generation Models

### Gemini 3 Series (Latest)

**Gemini 3 Pro**
- Described as "the best model in the world for multimodal understanding" with advanced reasoning capabilities
- Supports: Text, Image, Video, Audio, PDF input; Text output
- Token limits: 1,048,576 input / 65,536 output
- Knowledge cutoff: January 2025
- Key features: Function calling, structured outputs, thinking, search grounding, code execution

**Gemini 3 Flash**
- Positioned as "most intelligent model built for speed" with frontier intelligence
- Same multimodal input support as Pro
- Identical token limits and knowledge cutoff
- Strong emphasis on search and grounding capabilities

**Gemini 3 Pro Image**
- Specialized for image understanding and generation
- Supports image generation (unlike text-only variants)
- Reduced token limits: 65,536 input / 32,768 output

### Gemini 2.5 Series

**Gemini 2.5 Flash** - Described as offering "well-rounded capabilities" with excellent price-performance, suited for large-scale processing and agentic use cases

**Gemini 2.5 Flash-Lite** - "Fastest flash model optimized for cost-efficiency and high throughput"

**Gemini 2.5 Pro** - "State-of-the-art thinking model" for complex reasoning in code, math, and STEM domains

## Capability Matrix

Supported features vary significantly. Common capabilities across flagship models include:
- Batch API processing
- Context caching
- Code execution
- File search
- Function calling
- Structured outputs

**Notable limitations**: Image and audio generation aren't supported in most text-focused variants; Live API support is limited to specific audio models.

## Use Case Recommendations

- **High-volume, cost-sensitive tasks**: Gemini 2.5 Flash-Lite
- **Complex reasoning problems**: Gemini 2.5 Pro
- **Multimodal understanding**: Gemini 3 Pro
- **Speed-focused applications**: Gemini 3 Flash
