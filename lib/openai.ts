import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('Warning: OPENAI_API_KEY is not defined. OpenAI requests will fail.');
}

export const openai = new OpenAI({
  apiKey: apiKey || 'placeholder-api-key',
});
