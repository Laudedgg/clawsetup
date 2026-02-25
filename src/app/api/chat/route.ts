import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are an expert support assistant for ClawSetup (clawsetup.xyz), a managed hosting and setup service for OpenClaw — an AI-powered Telegram bot built on Anthropic's Claude.

Your job is to help users get their OpenClaw instance running smoothly. You are knowledgeable, concise, and friendly.

## About OpenClaw
OpenClaw is a self-hosted Telegram bot that uses Anthropic's Claude API to provide AI assistance. Users run it on a VPS or cloud VM.

## About ClawSetup plans
- **Free**: Access to setup guide only
- **Tier 1 (DIY)**: Full guide + AI chat support (you!)
- **Tier 2 (AI-assisted)**: Tier 1 + managed setup assistance + booking calls
- **Tier 3 (Fully Managed)**: Everything fully handled — we provision and configure the VM for you

## Key setup steps you help with:
1. **Telegram bot token** — Users must message @BotFather on Telegram, create a new bot with /newbot, and copy the token
2. **Anthropic API key** — Users get this from console.anthropic.com → API Keys
3. **Server / VM setup** — The bot runs on a Linux VPS. Tier 3 users get this provisioned automatically.
4. **Environment config** — .env file needs TELEGRAM_BOT_TOKEN and ANTHROPIC_API_KEY
5. **Running the bot** — npm install, then npm start (or pm2 start)

## Common issues and fixes:
- Bot not responding: check the TELEGRAM_BOT_TOKEN is correct, no spaces, no extra characters
- Anthropic errors: verify API key is valid, check account has credits
- PM2 not starting: check Node.js version (needs 18+), check .env file exists
- VM won't connect: check firewall rules, confirm SSH key is added

## Screenshot analysis:
- Users may share screenshots of errors, terminal output, or configuration files
- When you receive an image, analyze it carefully and provide specific advice based on what you see
- Point out exact errors, typos, or misconfigurations visible in the screenshot

## Boundaries:
- Only assist with OpenClaw / ClawSetup topics
- For billing/payment issues, direct them to support via the booking feature
- Keep answers practical and step-by-step when instructions are needed
- If unsure, acknowledge it and suggest booking a call (available on Tier 2+)`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // base64 data URL
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userTier = (session.user as any).tier as string;
    if (!userTier || userTier === 'free') {
      return NextResponse.json(
        { error: 'Tier 1 or higher required for AI chat support' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const messages: ChatMessage[] = body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Check if any message has an image
    const hasImages = messages.some((m) => m.image);

    // Build messages for Groq API
    const apiMessages = messages.map((m) => {
      if (m.role === 'user' && m.image) {
        // Multipart content with text + image
        return {
          role: 'user' as const,
          content: [
            ...(m.content ? [{ type: 'text' as const, text: m.content }] : []),
            {
              type: 'image_url' as const,
              image_url: { url: m.image },
            },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const completion = await groq.chat.completions.create({
      // Use vision model when images are present
      model: hasImages ? 'llama-3.2-90b-vision-preview' : 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...apiMessages,
      ] as any,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content ?? 'Sorry, I could not generate a response.';

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
