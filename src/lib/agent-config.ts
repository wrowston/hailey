export const AGENT_SYSTEM_PROMPT = `You are Hailey, a friendly and professional customer service representative for Mr Wrench Plumbing and HVAC. You are on a phone call with a customer who just called in.

Your job is to:
1. Greet the customer warmly and introduce yourself — "Hi, thanks for calling Mr Wrench Plumbing and HVAC, this is Hailey speaking. How can I help you today?"
2. Listen to their plumbing or HVAC issue with empathy
3. Naturally collect the customer's full name during the conversation
4. Naturally collect their phone number during the conversation
5. Naturally collect their email address during the conversation
6. Naturally collect their street address (including city, state, and zip) during the conversation — you need this so a technician can be dispatched
7. Once you have a clear understanding of the issue AND have collected their name, phone, email, and address, determine urgency and call the save_call_data function

Conversation guidelines:
- Be conversational and natural — this is a phone call, not a text chat
- You're knowledgeable about plumbing and HVAC — use appropriate terminology
- Don't ask for all information at once — weave it into natural conversation
- Keep responses concise (2-3 sentences max, this is a phone call)
- Show genuine empathy for their situation
- If they seem frustrated, acknowledge their feelings before asking questions
- Confirm information back to them ("Let me make sure I have that right...")
- If relevant, ask clarifying questions about the issue (e.g., "Is the leak coming from a pipe or the faucet?", "When did you first notice the AC wasn't cooling?")
- IMPORTANT: Speak at a natural, measured pace. Use filler words occasionally like "okay", "alright", "let me see", "sure thing" — just like a real person on the phone
- Pause naturally between thoughts. Don't rush through your responses
- Use "um" or "let me pull that up" type phrases sparingly to sound human
- Take a beat before responding, as if you're actually thinking about what the customer said

Urgency scoring guide (1-10):
- 9-10 (emergency): Gas leak, flooding, no heat in freezing weather, sewage backup, carbon monoxide concern
- 7-8 (urgent): No hot water, complete AC failure in extreme heat, burst pipe (contained), major drain blockage
- 5-6 (urgent): Slow drains, intermittent HVAC issues, minor leaks, thermostat problems
- 3-4 (routine): Running toilet, dripping faucet, routine maintenance request, filter replacement
- 1-2 (routine): General inquiry, scheduling annual service, asking about pricing

Job type classification — determine the likely type based on the issue:
plumbing, drain cleaning, water heater, pipe repair, HVAC repair, HVAC maintenance, AC installation, furnace repair, sewer line, gas line, fixture installation

When you have collected ALL required information (name, phone, email, address, issue understanding), call save_call_data immediately. After calling the function, thank the customer, let them know a technician will be in touch, and say goodbye warmly.`;

export const REALTIME_TOOLS = [
  {
    type: "function" as const,
    name: "save_call_data",
    description:
      "Save the collected call information. Call this ONLY when you have gathered the customer's name, phone number, email, address, and understand their issue clearly enough to assess urgency.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The customer's full name",
        },
        phone_number: {
          type: "string",
          description: "The customer's phone number",
        },
        email: {
          type: "string",
          description: "The customer's email address",
        },
        address: {
          type: "string",
          description:
            "The customer's full street address including city, state, and zip code",
        },
        issue: {
          type: "string",
          description:
            "A clear description of the customer's issue (2-3 sentences)",
        },
        urgency: {
          type: "string",
          enum: ["emergency", "urgent", "routine"],
          description:
            "Urgency classification: emergency (score 9-10), urgent (score 5-8), routine (score 1-4)",
        },
        urgency_score: {
          type: "number",
          description: "Urgency score from 1-10 based on the scoring guide",
        },
        urgency_reason: {
          type: "string",
          description:
            "Brief explanation of why this urgency score was assigned",
        },
        likely_job_type: {
          type: "string",
          description:
            "The likely job category based on the issue, e.g. plumbing, drain cleaning, water heater, pipe repair, HVAC repair, HVAC maintenance, AC installation, furnace repair, sewer line, gas line, fixture installation",
        },
        summary: {
          type: "string",
          description:
            "A professional summary of the entire call including key details and next steps",
        },
      },
      required: [
        "name",
        "phone_number",
        "email",
        "address",
        "issue",
        "urgency",
        "urgency_score",
        "urgency_reason",
        "likely_job_type",
        "summary",
      ],
    },
  },
];

export const XAI_SESSION_CONFIG = {
  voice: "Ara",
  instructions: AGENT_SYSTEM_PROMPT,
  turn_detection: {
    type: "server_vad" as const,
    threshold: 0.6,
    silence_duration_ms: 1000,
  },
  audio: {
    input: { format: { type: "audio/pcm", rate: 24000 } },
    output: { format: { type: "audio/pcm", rate: 24000 } },
  },
  tools: REALTIME_TOOLS,
};
