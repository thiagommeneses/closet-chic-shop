import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShippingRequest {
  cepDestino: string;
  peso: number; // em gramas
  comprimento: number; // em cm
  altura: number; // em cm
  largura: number; // em cm
}

interface ShippingOption {
  servico: string;
  servicoNome: string;
  valor: number;
  prazoEntrega: number;
  erro?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cepDestino, peso, comprimento, altura, largura }: ShippingRequest = await req.json();

    console.log("Calculating shipping:", { cepDestino, peso, comprimento, altura, largura });

    if (!cepDestino || !peso || !comprimento || !altura || !largura) {
      throw new Error("Parâmetros obrigatórios faltando");
    }

    const cepOrigem = "29060670"; // CEP da loja
    const cepDestinoLimpo = cepDestino.replace(/\D/g, "");

    // Validar CEP de destino usando ViaCEP
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepDestinoLimpo}/json/`);
    const viaCepData = await viaCepResponse.json();

    if (viaCepData.erro) {
      throw new Error("CEP de destino inválido");
    }

    const shippingOptions: ShippingOption[] = [];

    // Serviços dos Correios
    const services = [
      { codigo: "04014", nome: "SEDEX" },
      { codigo: "04510", nome: "PAC" }
    ];

    for (const service of services) {
      try {
        // Usando a API pública dos Correios (simulação, pois a API real requer credenciais)
        // Na implementação real, você precisaria das credenciais dos Correios
        const correiosUrl = `https://ws.correios.com.br/calculador/v1/calcular-prazo-preco`;
        
        // Como a API real requer autenticação, vou simular valores baseados no serviço
        let valor: number;
        let prazo: number;
        
        if (service.codigo === "04014") { // SEDEX
          valor = Math.round((peso * 0.02 + 15) * 100) / 100; // Fórmula simplificada
          prazo = 2;
        } else { // PAC
          valor = Math.round((peso * 0.015 + 10) * 100) / 100;
          prazo = 5;
        }

        // Ajustar preço baseado na distância (simulação)
        const distanceFactor = cepDestinoLimpo.startsWith("29") ? 1 : 1.5;
        valor = Math.round(valor * distanceFactor * 100) / 100;

        shippingOptions.push({
          servico: service.codigo,
          servicoNome: service.nome,
          valor: valor,
          prazoEntrega: prazo
        });

        console.log(`${service.nome}: R$ ${valor}, ${prazo} dias`);
      } catch (error) {
        console.error(`Erro ao calcular ${service.nome}:`, error);
        shippingOptions.push({
          servico: service.codigo,
          servicoNome: service.nome,
          valor: 0,
          prazoEntrega: 0,
          erro: "Erro ao calcular frete"
        });
      }
    }

    // Adicionar endereço de destino na resposta
    const endereco = {
      cep: cepDestinoLimpo,
      logradouro: viaCepData.logradouro,
      bairro: viaCepData.bairro,
      cidade: viaCepData.localidade,
      uf: viaCepData.uf
    };

    return new Response(JSON.stringify({
      success: true,
      endereco,
      opcoes: shippingOptions
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error calculating shipping:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});