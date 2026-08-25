import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUBJECTS: Record<string, string> = {
  'feg-02': 'FEG-02 Foundation Course in English-2 (IGNOU BCA)',
  'mcs-201': 'MCS-201 Programming in C and Python (IGNOU BCA)',
  'mcs-202': 'MCS-202 Computer Organisation (IGNOU BCA)',
  'mcs-203': 'MCS-203 Operating Systems (IGNOU BCA)',
  'mcsl-204': 'MCSL-204 Windows and Linux Lab (IGNOU BCA)',
  'mcsl-205': 'MCSL-205 C and Python Lab (IGNOU BCA)',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const title = String(body?.title ?? '').slice(0, 300).trim();
    const subjectId = String(body?.subjectId ?? '').slice(0, 40);
    if (!title) {
      return new Response(JSON.stringify({ error: 'title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const subject = SUBJECTS[subjectId] ?? 'IGNOU BCA Semester 2 computer science';
    const prompt = `You are an exam coach for ${subject}.
A student just watched a lecture titled: "${title}".
Create exactly 5 multiple-choice questions that test understanding of the concepts in that lecture.
Rules:
- Each question has exactly 4 options, only one correct.
- Keep questions exam-oriented and concise.
- "topic" must be a short 2-4 word concept name (used to flag weak topics).
- "explanation" must be one short sentence.
Return ONLY JSON: {"questions":[{"question":"","options":["","","",""],"answerIndex":0,"topic":"","explanation":""}]}`;

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const status = res.status === 429 || res.status === 402 ? res.status : 500;
      return new Response(JSON.stringify({ error: 'Quiz generate nahi ho paaya. Dobara try karein.' }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const json = await res.json();
    let parsed: any = {};
    try {
      parsed = JSON.parse(json?.choices?.[0]?.message?.content ?? '{}');
    } catch {
      parsed = {};
    }

    const questions = (Array.isArray(parsed?.questions) ? parsed.questions : [])
      .filter((q: any) => typeof q?.question === 'string' && Array.isArray(q?.options) && q.options.length === 4)
      .slice(0, 5)
      .map((q: any) => ({
        question: String(q.question),
        options: q.options.map((o: any) => String(o)),
        answerIndex: Math.max(0, Math.min(3, Number(q.answerIndex) || 0)),
        topic: String(q.topic ?? 'General'),
        explanation: String(q.explanation ?? ''),
      }));

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'An error occurred. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
