import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { level, id, name } = await req.json();

    console.log('Recebendo requisição AI Insights:', { level, id, name });

    // Construir URL com query parameters para GET request
    // Usar o nome da campanha ao invés do ID
    const webhookUrl = new URL('https://mkthooks.adaptahub.org/webhook/ai-insights-for-ads');
    webhookUrl.searchParams.set('level', level);
    webhookUrl.searchParams.set('id', name); // Usar o nome ao invés do ID

    console.log('Enviando para webhook externo (GET):', webhookUrl.toString());

    const response = await fetch(webhookUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.text();
    console.log('Resposta do webhook:', result);

    // Processar a resposta JSON para extrair o texto
    let processedInsights = result;
    try {
      const parsedResult = JSON.parse(result);
      // Verificar se o resultado contém a propriedade "text"
      if (parsedResult && parsedResult.text) {
        processedInsights = parsedResult.text;
      }
    } catch (parseError) {
      console.log('Resposta não é JSON válido, usando texto original');
    }

    return new Response(JSON.stringify({ insights: processedInsights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na edge function ai-insights:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro ao buscar insights da IA',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});