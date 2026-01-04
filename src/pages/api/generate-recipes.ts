import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    let items;
    try {
        const body = await request.json();
        items = body.items;
    } catch (e: any) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body', details: e.message }), { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return new Response(JSON.stringify({ error: 'No items provided' }), { status: 400 });
    }

    console.log('API: Received request with items:', items.length);

    const apiKey = import.meta.env.CLAUDE_API_KEY;
    if (!apiKey) {
        console.error('API: Missing CLAUDE_API_KEY');
        return new Response(JSON.stringify({ error: 'Server configuration error: Missing API Key' }), { status: 500 });
    }

    const anthropic = new Anthropic({
        apiKey: apiKey,
    });

    const pantryList = items.map((i: any) =>
        `- ${i.name} ${i.quantity ? `(${i.quantity})` : ''} ${i.expiration_date ? `[Expires: ${i.expiration_date}]` : ''}`
    ).join('\n');

    const prompt = `
    I have the following ingredients in my pantry:
    ${pantryList}

    Please generate 3 creative and healthy recipes that I can make with these ingredients. 
    You can assume I have basic staples like oil, salt, pepper, and water.
    
    IMPORTANT: Return ONLY a raw JSON array of objects. Do not wrap it in markdown code blocks.
    
    The JSON structure must be:
    [
      {
        "name": "Recipe Name",
        "calories": "Approx calories",
        "macros": "Protein/Carbs/Fat",
        "ingredients": ["Item 1", "Item 2"],
        "instructions": ["Step 1", "Step 2"]
      }
    ]
  `;

    try {
        console.log('API: Calling Anthropic Claude Haiku 4.5...');

        const stream = await anthropic.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: 2048,
            messages: [{ role: "user", content: prompt }],
            stream: true,
        });

        console.log('API: Claude stream created successfully');

        // Create a ReadableStream to send back to the client
        const customStream = new ReadableStream({
            async start(controller) {
                console.log('API: Starting stream to client');
                // Removed manual 'Thinking...' packet to keep JSON clean.

                try {
                    for await (const chunk of stream) {
                        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                            const content = chunk.delta.text;
                            if (content) {
                                console.log(`API: Chunk received (${content.length} chars)`);
                                controller.enqueue(new TextEncoder().encode(content));
                            }
                        }
                    }
                } catch (err) {
                    console.error('API: Stream Error:', err);
                    controller.enqueue(new TextEncoder().encode("\n\n**Error in stream processing**"));
                }
                console.log('API: Stream finished');
                controller.close();
            },
        });

        return new Response(customStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('AI Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
