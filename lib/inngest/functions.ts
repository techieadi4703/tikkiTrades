import {inngest} from "@/lib/inngest/client";
import {NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT} from "@/lib/inngest/prompts";
import {sendNewsSummaryEmail, sendWelcomeEmail, sendPriceAlertEmail} from "@/lib/nodemailer";
import {getAllUsersForNewsEmail, UserForNewsEmail, getUsersByIds} from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews, getQuote } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";
import { getActiveAlerts, markAlertTriggered } from "@/lib/actions/alert.actions";
import { createNotification } from "@/lib/actions/notification.actions";

export const sendSignUpEmail = inngest.createFunction(
    { id: 'sign-up-email' },
    { event: 'app/user.created'},
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile)

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
            body: {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt }
                        ]
                    }]
            }
        })

        await step.run('send-welcome-email', async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null) ||'Thanks for joining Tikki Trades. You now have the tools to track markets and make smarter moves.'

            const { data: { email, name } } = event;

            return await sendWelcomeEmail({ email, name, intro: introText });
        })

        return {
            success: true,
            message: 'Welcome email sent successfully'
        }
    }
)

export const sendDailyNewsSummary = inngest.createFunction(
    { id: 'daily-news-summary' },
    [ { event: 'app/send.daily.news' }, { cron: '0 12 * * *' } ],
    async ({ step }) => {
        // Step #1: Get all users for news delivery
        const users = await step.run('get-all-users', getAllUsersForNewsEmail)

        if(!users || users.length === 0) return { success: false, message: 'No users found for news email' };

        // Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
        const results = await step.run('fetch-user-news', async () => {
            const perUser: Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }> = [];
            for (const user of users as UserForNewsEmail[]) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols);
                    // Enforce max 6 articles per user
                    articles = (articles || []).slice(0, 6);
                    // If still empty, fallback to general
                    if (!articles || articles.length === 0) {
                        articles = await getNews();
                        articles = (articles || []).slice(0, 6);
                    }
                    perUser.push({ user, articles });
                } catch (e) {
                    console.error('daily-news: error preparing user news', user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }
            return perUser;
        });

        // Step #3: (placeholder) Summarize news via AI
        const userNewsSummaries: { user: UserForNewsEmail; newsContent: string | null }[] = [];

        for (const { user, articles } of results) {
                try {
                    const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles, null, 2));

                    const response = await step.ai.infer(`summarize-news-${user.email}`, {
                        model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
                        body: {
                            contents: [{ role: 'user', parts: [{ text:prompt }]}]
                        }
                    });

                    const part = response.candidates?.[0]?.content?.parts?.[0];
                    const newsContent = (part && 'text' in part ? part.text : null) || 'No market news.'

                    userNewsSummaries.push({ user, newsContent });
                } catch (e) {
                    console.error('Failed to summarize news for : ', user.email);
                    userNewsSummaries.push({ user, newsContent: null });
                }

                // Add sleep to stay safely under Gemini 15 RPM limit on free tier (~60 seconds)
                await step.sleep(`rate-limit-sleep-${user.email}`, '60000ms');
            }

        // Step #4: (placeholder) Send the emails
        await step.run('send-news-emails', async () => {
                await Promise.all(
                    userNewsSummaries.map(async ({ user, newsContent}) => {
                        if(!newsContent) return false;

                        return await sendNewsSummaryEmail({ email: user.email, date: getFormattedTodayDate(), newsContent })
                    })
                )
            })

        return { success: true, message: 'Daily news summary emails sent successfully' }
    }
)

export const checkPriceAlerts = inngest.createFunction(
    { id: 'check-price-alerts' },
    [ { event: 'app/check.price.alerts' }, { cron: '*/15 * * * *' } ],
    async ({ step }) => {
        // Step #1: Get all active alerts
        const activeAlerts = await step.run('get-active-alerts', getActiveAlerts);
        
        if (!activeAlerts || activeAlerts.length === 0) {
            return { success: true, message: 'No active alerts to check' };
        }

        // Step #2: Extract unique tickers and fetch current prices
        const uniqueTickers = [...new Set(activeAlerts.map(a => a.ticker))];
        
        const prices = await step.run('fetch-current-prices', async () => {
            const priceMap: Record<string, number> = {};
            // For rate limiting reasons, process sequentially or in small batches
            for (const ticker of uniqueTickers) {
                try {
                    const quote = await getQuote(ticker);
                    if (quote && quote.c) { // 'c' is current price in Finnhub
                        priceMap[ticker] = quote.c;
                    }
                } catch (e) {
                    console.error(`Failed to fetch quote for ${ticker}:`, e);
                }
            }
            return priceMap;
        });

        // Step #3: Evaluate conditions and collect triggered alerts
        const triggeredAlerts = activeAlerts.filter(alert => {
            const currentPrice = prices[alert.ticker];
            if (!currentPrice) return false;
            
            if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
                return true;
            }
            if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
                return true;
            }
            return false;
        });

        if (triggeredAlerts.length === 0) {
            return { success: true, message: 'No alerts triggered' };
        }

        // Step #4: Get users mapped with their details
        const userIds = [...new Set(triggeredAlerts.map(a => a.userId))];
        const users = await step.run('fetch-alert-users', async () => {
            return getUsersByIds(userIds);
        });

        const userMap: Record<string, any> = {};
        users.forEach(u => { userMap[u.id] = u; });

        // Step #5: Process each triggered alert (mark as triggered, notify, send email)
        await step.run('process-triggered-alerts', async () => {
            for (const alert of triggeredAlerts) {
                const user = userMap[alert.userId];
                const currentPrice = prices[alert.ticker];
                
                // Mark alert as triggered
                await markAlertTriggered(alert._id);
                
                if (user && user.email) {
                    // Send Email
                    try {
                        await sendPriceAlertEmail({
                            email: user.email,
                            symbol: alert.ticker,
                            company: alert.ticker, // Could fetch company profile if needed, fallback to ticker
                            currentPrice,
                            targetPrice: alert.targetPrice,
                            condition: alert.condition as 'above' | 'below',
                            timestamp: new Date().toLocaleString()
                        });
                    } catch (e) {
                        console.error(`Failed to send email to ${user.email} for alert ${alert._id}`, e);
                    }
                    
                    // Add in-app notification
                    const directionText = alert.condition === 'above' ? 'exceeded' : 'dropped below';
                    const message = `Price Alert: ${alert.ticker} has ${directionText} your target of $${alert.targetPrice} (Current: $${currentPrice})`;
                    try {
                        await createNotification(alert.userId, message);
                    } catch (e) {
                        console.error(`Failed to create notification for ${alert.userId}`, e);
                    }
                }
            }
        });

        return { 
            success: true, 
            message: `Processed ${triggeredAlerts.length} triggered alerts`
        };
    }
)