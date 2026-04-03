'use server';

import OpenAI from 'openai';
import { WATCHLIST_ASSISTANT_PROMPT } from '@/lib/chatbot/prompts';

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

export async function getWatchlistAIResponse(
  userQuery: string,
  watchlistData: any[],
  history: ChatMessage[] = []
) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not defined in environment variables.');
    }

    const groq = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const formattedWatchlist = watchlistData.map(item => ({
      symbol: item.symbol,
      company: item.company,
      price: item.price,
      change: item.change,
      changePercent: item.changePercent,
      volume: item.volume
    }));

    const systemPrompt = WATCHLIST_ASSISTANT_PROMPT.replace(
      '{{watchlistData}}',
      JSON.stringify(formattedWatchlist, null, 2)
    );

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map(msg => ({
        role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: userQuery }
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const text = completion.choices[0]?.message?.content || "";

    return {
      success: true,
      content: text
    };
  } catch (error: any) {
    console.error('getWatchlistAIResponse error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get AI response'
    };
  }
}
