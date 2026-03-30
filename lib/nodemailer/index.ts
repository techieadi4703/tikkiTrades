
import nodemailer from 'nodemailer';
import {
    WELCOME_EMAIL_TEMPLATE, 
    NEWS_SUMMARY_EMAIL_TEMPLATE,
    STOCK_ALERT_UPPER_EMAIL_TEMPLATE,
    STOCK_ALERT_LOWER_EMAIL_TEMPLATE
} from "@/lib/nodemailer/templates";

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.NODEMAILER_EMAIL!,
        pass: process.env.NODEMAILER_PASSWORD!,
    }
})

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
    const htmlTemplate = WELCOME_EMAIL_TEMPLATE
        .replace('{{name}}', name)
        .replace('{{intro}}', intro);

    const mailOptions = {
        from: `"Tikki Trades" <techie.adi47@gmail.com>`,
        to: email,
        subject: `Welcome to Tikki Trades - your stock market toolkit is ready!`,
        text: 'Thanks for joining Tikki Trades',
        html: htmlTemplate,
    }

    await transporter.sendMail(mailOptions);
}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"Tikki Trades News" <techie.adi47@gmail.com>`,
        to: email,
        subject: `📈 Market News Summary Today - ${date}`,
        text: `Today's market news summary from Tikki Trades`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};

export const sendPriceAlertEmail = async (
    { email, symbol, company, currentPrice, targetPrice, condition, timestamp }: 
    { email: string; symbol: string; company: string; currentPrice: number; targetPrice: number; condition: 'above' | 'below'; timestamp: string }
): Promise<void> => {
    const baseTemplate = condition === 'above' ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;
    const htmlTemplate = baseTemplate
        .replace(/{{symbol}}/g, symbol)
        .replace(/{{company}}/g, company)
        .replace(/{{currentPrice}}/g, currentPrice.toString())
        .replace(/{{targetPrice}}/g, targetPrice.toString())
        .replace(/{{timestamp}}/g, timestamp);

    const emoji = condition === 'above' ? '📈' : '📉';
    const direction = condition === 'above' ? 'Above' : 'Below';

    const mailOptions = {
        from: `"Tikki Trades Alerts" <techie.adi47@gmail.com>`,
        to: email,
        subject: `${emoji} Price Alert: ${symbol} is ${direction} ${targetPrice}`,
        text: `Price Alert: ${symbol} is now ${currentPrice}, which is ${direction.toLowerCase()} your target of ${targetPrice}.`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};