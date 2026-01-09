import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { provider } = await req.json();

        const prompt = "create a list of three open ended and engaging question should be separated by '||'. These questions are for an annonymous social messaging platform, like Qooh.me, and should be suitable for diverse audience. Avoid personal or sensitive topics, focusing insteas on universal themes that encourage friendly interaction. For example, your output should be structured like this: 'whats a hobby you have recently started? || If you could have dinner with any historical figure, who would it be? || whats a simple thing that makes you happy?'. Ensure the questions are intriguing, foster curiosity, and constribute to a positive and welcoming conversational environment.";

        const model = provider === 'openai' ? openai('gpt-4o-mini') : google('gemini-2.0-flash-exp');

        const result = await streamText({
            model,
            prompt,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        if (error instanceof Error) {
            console.error("An unexpected error occurred", error);
            return NextResponse.json({ message: error.message }, { status: 500 });
        } else {
            return NextResponse.json({ message: "An unknown error occurred" }, { status: 500 });
        }
    }
}
