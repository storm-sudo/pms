import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { platform } = await request.json();
        
        if (!platform || !['slack', 'discord'].includes(platform)) {
            return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        const response = await fetch(`${supabaseUrl}/functions/v1/dispatch-webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({
                platform,
                event_type: 'approval_request_received',
                payload: {
                    taskName: 'Clinical Test Pulse',
                    projectName: 'System Maintenance',
                    requesterName: 'Admin System',
                    projectId: '00000000-0000-0000-0000-000000000000',
                    taskId: '00000000-0000-0000-0000-000000000000'
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json({ error: `Edge Function error: ${errorText}` }, { status: response.status });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Test Pulse Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
