# Complete Prompt Design Guide for Gemini API

## Core Principles

**Definition**: "Prompt design is the process of creating prompts, or natural language requests, that elicit accurate, high quality responses from a language model."

### Clear and Specific Instructions

Effective prompts require three components:

1. **Input Types**:
   - Question input (model answers)
   - Task input (model performs actions)
   - Entity input (model operates on data)
   - Completion input (model continues partial content)

2. **Constraints**: Specify limitations on response length, format, and scope.

3. **Response Format**: Explicitly request desired output structure (tables, lists, JSON, etc.).

## Prompting Strategies

### Few-Shot vs Zero-Shot

Few-shot prompts with examples significantly outperform zero-shot approaches. The guide emphasizes: "We recommend to always include few-shot examples in your prompts."

**Best practices for examples**:
- Use 2-5 consistent, varied examples
- Show positive patterns rather than anti-patterns
- Maintain identical formatting across examples
- Avoid overfitting with too many examples

### Adding Context

Include necessary background information and constraints rather than assuming model knowledge. This customizes responses for specific scenarios.

### Using Prefixes

Structure prompts with semantic markers:
- **Input prefix**: "English:" or "French:" to demarcate content types
- **Output prefix**: "JSON:" to signal format expectations
- **Example prefix**: Labels for clarity in few-shot examples

### Breaking Down Complexity

For intricate tasks:
- Create one prompt per instruction
- Chain sequential prompts where output feeds into next prompt
- Aggregate parallel operations on different data sections

## Model Parameters

Control response generation through:

1. **Max Output Tokens**: Limits response length (100 tokens ~ 60-80 words)

2. **Temperature**: Controls randomness in token selection
   - 0 = deterministic (always highest probability)
   - Higher values = more creative/diverse
   - **Gemini 3 note**: Keep default 1.0 to avoid unexpected behavior

3. **TopK**: Selects from top K probable tokens

4. **TopP**: Samples tokens until probability sum reaches threshold (default 0.95)

5. **Stop Sequences**: Tells model when to halt generation

## Iteration Strategies

When prompts underperform:

1. **Rephrase**: Try different wording expressing the same concept
2. **Analogous tasks**: Reformulate as similar but differently-framed problem
3. **Reorder content**: Change arrangement of examples, context, and instructions

## Gemini 3 Optimization

### Core Principles
- Be precise and direct; avoid persuasive language
- Use consistent structural delimiters (XML tags or Markdown)
- Explicitly define ambiguous parameters
- Control output verbosity with clear requests
- Place critical instructions first or in system prompt
- Supply large context blocks before specific questions

### Advanced Strategies

**For time-sensitive queries**: Add clause specifying 2025 as current year and knowledge cutoff as January 2025.

**For grounded responses**: Instruct model to rely strictly on provided context, rejecting external knowledge.

**For complex reasoning**: Prompt explicit planning steps before final answers and self-critique reviews.

## Agentic Workflows

Configure these behavior dimensions:

- **Reasoning**: Logical decomposition, problem diagnosis depth, information exhaustiveness
- **Execution**: Adaptability to new data, persistence in error recovery, risk assessment
- **Interaction**: Ambiguity handling, verbosity level, precision requirements

The guide provides a detailed system instruction template emphasizing methodical planning, dependency analysis, and abductive reasoning for agent tasks.

## Things to Avoid

- Relying on models for factual accuracy
- Using with minimal caution for math/logic problems

## Key Takeaway

Prompt engineering requires iteration. Start with guidelines, test responses, refine based on observed outputs, and experiment with parameters for your specific use cases.
