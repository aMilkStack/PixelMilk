# Structured Outputs in Gemini API

## Overview
Structured Outputs enable Gemini models to generate responses adhering to a provided JSON Schema, ensuring "predictable and parsable results" and "format and type-safety."

## Key Applications
- **Data extraction:** Pull specific information from unstructured text
- **Structured classification:** Categorize content into predefined categories with labels
- **Agentic workflows:** Generate data for calling other tools or APIs

## Configuration

Set two parameters in generation config:
- `response_mime_type`: `"application/json"`
- `response_json_schema`: Valid JSON Schema object describing output format

## Supported JSON Schema Types
- `string`, `number`, `integer`, `boolean`
- `object` (with `properties`, `required`, `additionalProperties`)
- `array` (with `items`, `minItems`, `maxItems`)
- `null` (include in type array for optional properties)

## Descriptive Properties
- `title`: Short property description
- `description`: Detailed guidance for the model
- `enum`: Restrict to specific values
- `format`: Syntax specifications (date-time, date, time)

## Model Support
Structured Outputs work on:
- Gemini 3 Pro/Flash Preview
- Gemini 2.5 Pro/Flash/Flash-Lite
- Gemini 2.0 Flash/Flash-Lite

## Best Practices
"Use the description field in your schema to provide clear instructions" and employ specific types whenever possible. "Always validate the final output in your application code before using it" since the feature guarantees syntactic correctness, not semantic accuracy.

## Limitations
Not all JSON Schema features are supported; "very large or deeply nested schemas" may be rejected.
