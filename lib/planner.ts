import { openai } from './openai';
import { TestPlan, TestPlanSchema } from './schemas';

export async function generateTestPlan(
  url: string,
  task: string,
  expectedResult?: string
): Promise<TestPlan> {
  const normalizedUrl = url.toLowerCase();
  const normalizedTask = task.toLowerCase();
  
  const isDemoSite = normalizedUrl.includes('/demo-site') || 
                     (normalizedUrl.includes('localhost') || normalizedUrl.includes('127.0.0.1')) && 
                     normalizedTask.includes('contact');

  const hasApiKey = process.env.OPENAI_API_KEY && 
                    process.env.OPENAI_API_KEY !== 'your_api_key_here' && 
                    process.env.OPENAI_API_KEY !== 'placeholder-api-key';

  // Deterministic plan for demo site or fallback when API key is missing
  if (isDemoSite || !hasApiKey) {
    const isHappy = normalizedUrl.includes('bug=false') || normalizedTask.includes('happypath');
    return {
      goal: task || "Submit the contact form and verify the success message",
      steps: [
        {
          id: "step-1",
          action: "navigate",
          target: isHappy ? "/demo-site/contact?bug=false" : "/demo-site/contact",
          description: "Open the contact page"
        },
        {
          id: "step-2",
          action: "fill",
          field: "name",
          value: isHappy ? "HappyPath" : "Test User",
          description: "Fill the name field"
        },
        {
          id: "step-3",
          action: "fill",
          field: "email",
          value: "test@example.com",
          description: "Fill the email field"
        },
        {
          id: "step-4",
          action: "click",
          target: "Submit",
          description: "Submit the contact form"
        },
        {
          id: "step-5",
          action: "verify",
          target: "Message sent successfully",
          description: "Verify that the success message is visible"
        }
      ]
    };
  }

  const systemPrompt = `You are a web test planning assistant for ShipCheck.
Your job is to convert a natural-language website task into a safe, structured sequence of browser steps.
The only supported actions you can use are:
1. "navigate": Open a URL path or full URL. If targeting the same site, use a path starting with "/" (e.g. "/contact").
2. "click": Click on a button, link, or visible element. Set "target" to the visible text, aria-label, or simple CSS selector.
3. "fill": Enter text into an input field. Set "field" to the field's label text, name, placeholder, or ID, and "value" to the text to insert.
4. "verify": Verify that text or a visible UI state exists. Set "target" to the exact text or visible message expected.

RULES:
- Maximum 10 steps.
- Use only the supported actions.
- Prefer visible labels and text over brittle selectors.
- If the task asks to fill out a form (e.g. a contact or connect form) but does not specify the individual fields, you should proactively generate separate "fill" steps for all standard fields (such as "Name", "Email", "Subject", "Message", etc.) instead of generating a single generic "fill the required fields" step. This ensures the runner can find and fill each input.
- For login/sign-in portals, you are allowed to generate steps to fill mock/placeholder credentials (e.g. username: "test-user@example.com", password: "password123"). Never request, record, or verify real credentials, real keys, or actual user passwords. Always replace any user-provided passwords with a generic mock placeholder value in your step output.
- NEVER request credit card numbers, payment information, or destructive actions (such as delete account).
- If the task is ambiguous, unsafe, or asks for unsupported actions, reject it by throwing an error (or return an empty list of steps).
- Keep the original goal as part of the plan description.`;

  const userPrompt = `Target Website: ${url}
Task Description: ${task}
Expected Result: ${expectedResult || 'None specified'}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt + '\nIMPORTANT: You must return valid raw JSON that conforms to this schema:\n{\n  "goal": "string",\n  "steps": [\n    {\n      "id": "string",\n      "action": "navigate" | "click" | "fill" | "verify",\n      "target": "string (optional)",\n      "field": "string (optional)",\n      "value": "string (optional)",\n      "description": "string"\n    }\n  ]\n}' },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('Empty response from OpenAI.');
    }

    const parsed = JSON.parse(responseContent);
    const plan = TestPlanSchema.parse(parsed);

    // Enforce limits and validate actions
    if (plan.steps.length > 10) {
      plan.steps = plan.steps.slice(0, 10);
    }

    const allowedActions = ['navigate', 'click', 'fill', 'verify'];
    for (const step of plan.steps) {
      if (!allowedActions.includes(step.action)) {
        throw new Error(`Unsupported action generated by AI: ${step.action}`);
      }

      // Safety check: filter out sensitive billing or destructive words
      const suspectKeywords = ['credit card', 'cvv', 'card number', 'delete account', 'purchase', 'buy now'];
      const textToCheck = `${step.field || ''} ${step.value || ''} ${step.target || ''} ${step.description}`.toLowerCase();
      for (const keyword of suspectKeywords) {
        if (textToCheck.includes(keyword)) {
          throw new Error(`Safety Violation: Task contains keyword "${keyword}" which is not allowed in MVP.`);
        }
      }
    }

    return plan;
  } catch (error: any) {
    console.error('Error generating test plan:', error);
    throw new Error(`Test planning failed: ${error.message || error}`);
  }
}
