'use server';

import { GoogleGenAI } from '@google/genai';
import { connectToDatabase } from '@/database/mongoose';
import { JournalEntry } from '@/database/models/journal.model';
import { revalidatePath } from 'next/cache';

export async function getUserJournalEntries(userId: string) {
  try {
    await connectToDatabase();
    const entries = await JournalEntry.find({ userId }).sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to get journal entries:', error);
    return [];
  }
}

export async function createJournalEntry(userId: string, entryText: string, ticker?: string) {
  try {
    await connectToDatabase();

    let aiReview = undefined;

    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a rational, experienced trading coach. Review this trade journal entry and identify:
1) Emotional biases present
2) Strength of the investment thesis (1-10)
3) Key risks ignored
4) One improvement suggestion.
Be direct and honest.

Trade Journal Entry: "${entryText}"
Ticker/Asset (if any): "${ticker || 'Unknown'}"

Return the results as a valid JSON object strictly matching this format:
{
  "emotionalBiases": ["Bias 1", "Bias 2"],
  "thesisStrength": number (1-10),
  "keyRisks": ["Risk 1", "Risk 2"],
  "improvement": "Suggestion text here"
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });
        
        const responseText = response.text || "{}";
        const cleanJsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        aiReview = JSON.parse(cleanJsonText);
        
        // Ensure format is correct
        aiReview = {
          emotionalBiases: Array.isArray(aiReview.emotionalBiases) ? aiReview.emotionalBiases : [],
          thesisStrength: typeof aiReview.thesisStrength === 'number' ? aiReview.thesisStrength : 5,
          keyRisks: Array.isArray(aiReview.keyRisks) ? aiReview.keyRisks : [],
          improvement: typeof aiReview.improvement === 'string' ? aiReview.improvement : "Consider a more structured trading plan."
        };
      } catch (err) {
        console.error("Gemini failed to analyze journal entry:", err);
        // Leave undefined so the UI knows to show a Retry button
        aiReview = undefined;
      }
    }

    const newEntry = await JournalEntry.create({
      userId,
      entryText,
      ticker: ticker ? ticker.toUpperCase() : undefined,
      aiReview,
    });

    revalidatePath('/journal');
    
    return JSON.parse(JSON.stringify(newEntry));
  } catch (error) {
    console.error('Failed to create journal entry:', error);
    throw new Error('Failed to create journal entry');
  }
}

export async function retryJournalAnalysis(entryId: string) {
  try {
    await connectToDatabase();
    const entry = await JournalEntry.findById(entryId);
    
    if (!entry) throw new Error("Journal entry not found");
    if (!process.env.GEMINI_API_KEY) throw new Error("No Gemini API Key");

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are a rational, experienced trading coach. Review this trade journal entry and identify:
1) Emotional biases present
2) Strength of the investment thesis (1-10)
3) Key risks ignored
4) One improvement suggestion.
Be direct and honest.

Trade Journal Entry: "${entry.entryText}"
Ticker/Asset (if any): "${entry.ticker || 'Unknown'}"

Return the results as a valid JSON object strictly matching this format:
{
  "emotionalBiases": ["Bias 1", "Bias 2"],
  "thesisStrength": number (1-10),
  "keyRisks": ["Risk 1", "Risk 2"],
  "improvement": "Suggestion text here"
}`;

    let aiReview = undefined;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    const responseText = response.text || "{}";
    const cleanJsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    aiReview = JSON.parse(cleanJsonText);
    
    aiReview = {
      emotionalBiases: Array.isArray(aiReview.emotionalBiases) ? aiReview.emotionalBiases : [],
      thesisStrength: typeof aiReview.thesisStrength === 'number' ? aiReview.thesisStrength : 5,
      keyRisks: Array.isArray(aiReview.keyRisks) ? aiReview.keyRisks : [],
      improvement: typeof aiReview.improvement === 'string' ? aiReview.improvement : "Consider a more structured trading plan."
    };

    entry.aiReview = aiReview;
    await entry.save();

    revalidatePath('/journal');
    return JSON.parse(JSON.stringify(entry));
  } catch (error) {
    console.error("Gemini retry failed:", error);
    throw new Error("Gemini API Rate Limit Exceeded or Failed to Analyze");
  }
}
