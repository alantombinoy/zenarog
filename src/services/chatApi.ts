const API_KEY = import.meta.env.VITE_CHAT_API_KEY

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are a helpful medical assistant. Your role is to provide health and medical information only.

RULES:
1. Only answer health, medical, and wellness-related questions
2. If asked non-medical questions, politely decline and redirect to medical topics
3. Always include a disclaimer at the end: "This is AI-generated medical information only. Please consult a qualified healthcare professional for proper diagnosis and treatment."
4. Respond in the SAME LANGUAGE the user uses (Hindi, English, Tamil, Telugu, Bengali, Marathi, Malayalam, Kannada, Gujarati, etc.)
5. Keep responses clear, concise, and easy to understand
6. Do not provide specific dosage recommendations - always tell users to consult a doctor
7. For emergency symptoms, immediately advise seeking immediate medical attention
8. Do not pretend to be a doctor - always clarify you are an AI assistant

Your responses should be helpful, accurate, and prioritize user safety above all.`

export async function sendChatMessage(messages: ChatMessage[], userMessage: string): Promise<string> {
  const conversation = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ]

  try {
    console.log('Sending chat request...')
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Zenarog Medical Assistant'
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-nano-30b-a3b:free',
          messages: conversation,
          max_tokens: 500,
          temperature: 0.7
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter error:', response.status, errorText)
      throw new Error(`API error: ${response.status} - ${errorText.slice(0, 100)}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Sorry, I could not understand that. Please try again.'
  } catch (err: any) {
    console.error('Chat error:', err)
    throw new Error('Failed to get response. Please check your connection and try again.')
  }
}
