# Gemini Thinking/Reasoning Mode Documentation

## Overview
Gemini 3 and 2.5 series models feature internal "thinking processes" that "significantly improves their reasoning and multi-step planning abilities" for complex tasks like coding, mathematics, and data analysis.

## Accessing Thinking

To enable thinking, specify a compatible model (gemini-2.5-pro, gemini-3-flash-preview, etc.) and optionally configure thinking parameters through the API.

## Thought Summaries

These are synthesized summaries of the model's internal reasoning. Enable them by setting `includeThoughts` to `true` in your request configuration. The API returns thought summaries alongside standard responses, viewable by checking the `thought` boolean flag on response parts.

## Controlling Thinking Behavior

### Gemini 3 Models: Thinking Levels
Set `thinkingLevel` to control reasoning depth:
- **low**: Minimizes latency/cost; best for simple tasks
- **high** (default): Maximizes reasoning; slower first token but more thorough

Gemini 3 Flash additionally supports:
- **medium**: Balanced approach for most tasks
- **minimal**: Minimal thinking; doesn't guarantee thinking is disabled

### Gemini 2.5 Models: Thinking Budgets
Use `thinkingBudget` to specify token allocation (128-32768 tokens depending on model). Set to -1 for dynamic thinking or 0 to disable (Flash models only).

## Best Practices

**Task Complexity Matching**:
- Simple retrieval/classification: minimal or no thinking needed
- Medium complexity: default dynamic settings
- Complex math/coding: maximize thinking budget or use "high" level

**Optimization**: Review thought summaries to debug unexpected outputs and provide guidance to constrain thinking when lengthy responses are required.

## Pricing & Token Counting

Response costs include both output and thinking tokens. Access thinking token counts via `thoughtsTokenCount` in usage metadata. The model generates full thoughts internally, then outputs summaries.

## Tool Compatibility

Thinking features work with all Gemini tools and capabilities, enabling models to incorporate external information into their reasoning process.
