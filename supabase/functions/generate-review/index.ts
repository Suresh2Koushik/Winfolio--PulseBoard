import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activities, dateRange, executiveSummary } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Group activities by category
    const categorizedActivities: Record<string, any[]> = {};
    activities.forEach((activity: any) => {
      if (!categorizedActivities[activity.category]) {
        categorizedActivities[activity.category] = [];
      }
      categorizedActivities[activity.category].push(activity);
    });

    // Group activities by quarter
    const quarterActivities: Record<string, any[]> = {};
    activities.forEach((activity: any) => {
      const quarter = activity.quarter || `Q${Math.floor(new Date(activity.date).getMonth() / 3) + 1}`;
      const year = new Date(activity.date).getFullYear();
      const key = `${quarter} ${year}`;
      if (!quarterActivities[key]) {
        quarterActivities[key] = [];
      }
      quarterActivities[key].push(activity);
    });

    const systemPrompt = `You are an expert performance review writer. Create a comprehensive, professional performance review that highlights achievements, impact, and contributions. 

Organize the review into clear sections:
1. Executive Summary (if provided)
2. Overview Statistics
3. Category-wise Analysis (for each category, describe achievements and impact)
4. Quarter-wise Progress (show progression and achievements across quarters)
5. Key Highlights and Impact
6. Collaboration and Cross-functional Work

Use professional language, quantify achievements when possible, and highlight business impact. Make it compelling and suitable for performance evaluations.`;

    const prompt = `Generate a detailed performance review based on the following data:

**Date Range:** ${dateRange}
**Total Activities:** ${activities.length}
${executiveSummary ? `**Executive Summary:** ${executiveSummary}\n` : ''}

**Activities by Category:**
${Object.entries(categorizedActivities).map(([category, acts]) => `
### ${category} (${acts.length} activities)
${(acts as any[]).map(a => `- ${a.title}${a.impactNotes ? ` | Impact: ${a.impactNotes}` : ''}${a.description ? ` | ${a.description}` : ''}`).join('\n')}
`).join('\n')}

**Activities by Quarter:**
${Object.entries(quarterActivities).map(([quarter, acts]) => `
### ${quarter} (${acts.length} activities)
${(acts as any[]).map(a => `- ${a.title}${a.impactNotes ? ` | Impact: ${a.impactNotes}` : ''}`).join('\n')}
`).join('\n')}

**Teams Involved:**
${Array.from(new Set(activities.flatMap((a: any) => a.teams))).join(', ')}

Create a comprehensive, professional performance review that would be impressive in a performance evaluation. Focus on impact, achievements, and growth.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const detailedReport = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ detailedReport }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-review function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
