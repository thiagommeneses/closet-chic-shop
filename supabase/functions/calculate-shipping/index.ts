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

// Função auxiliar para valores simulados (fallback)
function getSimulatedShipping(service: any, peso: number, comprimento: number, altura: number, largura: number, uf: string) {
  let distanceFactor = 1.0;
  
  switch (uf) {
    case 'ES': distanceFactor = 1.0; break;
    case 'RJ': case 'MG': case 'BA': distanceFactor = 1.3; break;
    case 'SP': case 'PR': case 'SC': case 'RS': distanceFactor = 1.6; break;
    case 'GO': case 'DF': case 'MS': case 'MT': distanceFactor = 1.8; break;
    case 'AL': case 'CE': case 'MA': case 'PB': case 'PE': case 'PI': case 'RN': case 'SE': distanceFactor = 2.0; break;
    case 'AC': case 'AM': case 'AP': case 'PA': case 'RO': case 'RR': case 'TO': distanceFactor = 2.5; break;
    default: distanceFactor = 1.5;
  }

  const pesoKg = peso / 1000;
  const volume = (comprimento * altura * largura) / 1000;
  const pesoCubico = volume / 6; // Peso cúbico dos Correios
  const pesoFinal = Math.max(pesoKg, pesoCubico);

  const precoBase = service.codigo === "03220" ? 15.50 : 10.80;
  const multiplicadorPeso = service.codigo === "03220" ? 2.5 : 1.8;
  const diasBase = service.codigo === "03220" ? 2 : 5;

  const preco = (precoBase + (pesoFinal * multiplicadorPeso)) * distanceFactor;
  const dias = Math.ceil(diasBase + (distanceFactor - 1) * (service.codigo === "03220" ? 2 : 3));

  return {
    valor: Math.round(preco * 100) / 100,
    prazo: dias,
  };
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

    const cepOrigem = "29060670"; // CEP da loja em Vitória/ES
    const cepDestinoLimpo = cepDestino.replace(/\D/g, "");

    // Validar CEP de destino usando ViaCEP
    const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cepDestinoLimpo}/json/`);
    const viaCepData = await viaCepResponse.json();

    if (viaCepData.erro) {
      throw new Error("CEP de destino inválido");
    }

    const shippingOptions: ShippingOption[] = [];

    // Serviços dos Correios no modo SEM CONTRATO (à vista)
    const services = [
      { codigo: "03220", nome: "SEDEX" },
      { codigo: "03298", nome: "PAC" }
    ];

    for (const service of services) {
      try {
        // API dos Correios para consulta de preços sem contrato (modo à vista)
        const correiosUrl = new URL('https://www.correios.com.br/preco/v1/nacional');
        correiosUrl.searchParams.append('cepOrigem', cepOrigem);
        correiosUrl.searchParams.append('cepDestino', cepDestinoLimpo);
        correiosUrl.searchParams.append('psObjeto', peso.toString());
        correiosUrl.searchParams.append('tpObjeto', '1'); // Envelope/Pacote
        correiosUrl.searchParams.append('comprimento', comprimento.toString());
        correiosUrl.searchParams.append('altura', altura.toString());
        correiosUrl.searchParams.append('largura', largura.toString());
        correiosUrl.searchParams.append('servicoPostagem', service.codigo);
        correiosUrl.searchParams.append('tipoServico', '1'); // Sem contrato (à vista)

        const response = await fetch(correiosUrl.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (compatible; ecommerce-shipping-calculator)',
          },
        });

        let valor: number;
        let prazo: number;

        if (response.ok) {
          const data = await response.json();
          console.log(`Resposta API Correios para ${service.nome}:`, data);
          
          if (data && data.pcFinal && data.prazoEntrega) {
            valor = parseFloat(data.pcFinal);
            prazo = parseInt(data.prazoEntrega);
            console.log(`Valores API real para ${service.nome}: R$ ${valor}, ${prazo} dias`);
          } else {
            // Fallback para valores simulados se a API não retornar dados válidos
            console.log(`Usando valores simulados para ${service.nome} - API não retornou dados válidos`);
            const fallbackData = getSimulatedShipping(service, peso, comprimento, altura, largura, viaCepData.uf);
            valor = fallbackData.valor;
            prazo = fallbackData.prazo;
          }
        } else {
          // Fallback para valores simulados se a API falhar
          console.log(`Usando valores simulados para ${service.nome} - API retornou erro ${response.status}`);
          const fallbackData = getSimulatedShipping(service, peso, comprimento, altura, largura, viaCepData.uf);
          valor = fallbackData.valor;
          prazo = fallbackData.prazo;
        }

        shippingOptions.push({
          servico: service.codigo,
          servicoNome: service.nome,
          valor: valor,
          prazoEntrega: prazo
        });

        console.log(`${service.nome} final: R$ ${valor}, ${prazo} dias`);
      } catch (error) {
        console.error(`Erro ao calcular ${service.nome}:`, error);
        // Em caso de erro, usar valores simulados
        const fallbackData = getSimulatedShipping(service, peso, comprimento, altura, largura, viaCepData.uf);
        shippingOptions.push({
          servico: service.codigo,
          servicoNome: service.nome,
          valor: fallbackData.valor,
          prazoEntrega: fallbackData.prazo
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