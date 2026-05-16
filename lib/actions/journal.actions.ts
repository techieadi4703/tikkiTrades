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

export async function createJournalEntry(
  userId: string, 
  entryText: string, 
  ticker?: string, 
  isWin?: boolean, 
  chartImage?: string
) {
  try {
    await connectToDatabase();

    let aiReview = undefined;
    let emotionalSentiment = undefined;

    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a rational, experienced trading coach. Review this trade journal entry and identify:
1) Emotional biases present
2) Strength of the investment thesis (1-10)
3) Key risks ignored
4) One improvement suggestion.
5) The primary emotional sentiment (e.g., "Fear", "Greed", "Confidence", "Regret", "Discipline", "FOMO", "Revenge Trading")
6) Psychological discipline score (1-10)

Be direct and honest.

Trade Journal Entry: "${entryText}"
Ticker/Asset (if any): "${ticker || 'Unknown'}"
Trade Outcome: "${isWin === true ? 'Win' : isWin === false ? 'Loss' : 'Open/Unknown'}"

Return the results as a valid JSON object strictly matching this format:
{
  "emotionalBiases": ["Bias 1", "Bias 2"],
  "thesisStrength": number,
  "keyRisks": ["Risk 1", "Risk 2"],
  "improvement": "Suggestion text here",
  "primarySentiment": "Single word or short phrase",
  "psychologicalScore": number
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' }
        });
        
        const responseText = response.text || "{}";
        const cleanJsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const rawAiReview = JSON.parse(cleanJsonText);
        
        emotionalSentiment = rawAiReview.primarySentiment || "Neutral";
        
        // Ensure format is correct
        aiReview = {
          emotionalBiases: Array.isArray(rawAiReview.emotionalBiases) ? rawAiReview.emotionalBiases : [],
          thesisStrength: typeof rawAiReview.thesisStrength === 'number' ? rawAiReview.thesisStrength : 5,
          keyRisks: Array.isArray(rawAiReview.keyRisks) ? rawAiReview.keyRisks : [],
          improvement: typeof rawAiReview.improvement === 'string' ? rawAiReview.improvement : "Consider a more structured trading plan.",
          psychologicalScore: typeof rawAiReview.psychologicalScore === 'number' ? rawAiReview.psychologicalScore : 5
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
      isWin,
      emotionalSentiment,
      chartImages: chartImage ? [chartImage] : [],
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
5) The primary emotional sentiment (e.g., "Fear", "Greed", "Confidence", "Regret", "Discipline", "FOMO", "Revenge Trading")
6) Psychological discipline score (1-10)

Be direct and honest.

Trade Journal Entry: "${entry.entryText}"
Ticker/Asset (if any): "${entry.ticker || 'Unknown'}"
Trade Outcome: "${entry.isWin === true ? 'Win' : entry.isWin === false ? 'Loss' : 'Open/Unknown'}"

Return the results as a valid JSON object strictly matching this format:
{
  "emotionalBiases": ["Bias 1", "Bias 2"],
  "thesisStrength": number,
  "keyRisks": ["Risk 1", "Risk 2"],
  "improvement": "Suggestion text here",
  "primarySentiment": "Single word or short phrase",
  "psychologicalScore": number
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    
    const responseText = response.text || "{}";
    const cleanJsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const rawAiReview = JSON.parse(cleanJsonText);
    
    const aiReview = {
      emotionalBiases: Array.isArray(rawAiReview.emotionalBiases) ? rawAiReview.emotionalBiases : [],
      thesisStrength: typeof rawAiReview.thesisStrength === 'number' ? rawAiReview.thesisStrength : 5,
      keyRisks: Array.isArray(rawAiReview.keyRisks) ? rawAiReview.keyRisks : [],
      improvement: typeof rawAiReview.improvement === 'string' ? rawAiReview.improvement : "Consider a more structured trading plan.",
      psychologicalScore: typeof rawAiReview.psychologicalScore === 'number' ? rawAiReview.psychologicalScore : 5
    };

    entry.emotionalSentiment = rawAiReview.primarySentiment || "Neutral";
    entry.aiReview = aiReview;
    await entry.save();

    revalidatePath('/journal');
    return JSON.parse(JSON.stringify(entry));
  } catch (error) {
    console.error("Gemini retry failed:", error);
    throw new Error("Gemini API Rate Limit Exceeded or Failed to Analyze");
  }
}

export async function getJournalPatternAnalysis(userId: string) {
  try {
    await connectToDatabase();
    const entries = await JournalEntry.find({ userId }).sort({ createdAt: -1 });

    if (entries.length < 3) {
      return {
        success: false,
        message: "Not enough entries to detect patterns. Keep journaling! (Minimum 3 required)",
      };
    }

    if (!process.env.GEMINI_API_KEY) {
      return { success: false, message: "No AI key available for analysis." };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Prepare a summarized list of trades to avoid token limits
    const tradeSummary = entries.map(e => ({
      date: e.createdAt,
      ticker: e.ticker || 'Unknown',
      outcome: e.isWin === true ? 'Win' : e.isWin === false ? 'Loss' : 'Unknown',
      sentiment: e.emotionalSentiment || 'Unknown',
      score: e.aiReview?.psychologicalScore || 'N/A',
      noteSnippet: e.entryText.substring(0, 100) + '...'
    }));

    const prompt = `You are an elite trading psychologist and data analyst. Analyze this user's recent trade journal history to find hidden patterns in their behavior, wins, and losses.

Trade History Data:
${JSON.stringify(tradeSummary, null, 2)}

Provide a psychological and statistical analysis matching this JSON schema:
{
  "summary": "A 2-3 sentence overview of their trading psychology and recent performance.",
  "strengths": ["Strength 1", "Strength 2"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "detectedPatterns": [
    "e.g., 'You tend to lose when your sentiment is marked as FOMO.'",
    "e.g., 'Your psychological score drops significantly after a loss.'"
  ],
  "actionableAdvice": "One specific, highly actionable piece of advice to improve their next trade."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const responseText = response.text || "{}";
    const cleanJsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleanJsonText);

    return {
      success: true,
      analysis
    };
  } catch (error) {
    console.error("Failed to generate pattern analysis:", error);
    return { success: false, message: "Failed to generate pattern analysis." };
  }
}

