# Como vender o Amplitude CRM para outra empresa

## Criar a conta do cliente

1. Entre no CRM da Amplitude e abra **Empresas**.
2. Preencha nome, segmento e plano. A InfiniteTag do cliente é opcional.
3. Clique em **Criar CRM e gerar convite** e mande o link ao cliente. Ele funciona uma vez, por 7 dias.
4. O cliente escolhe o próprio e-mail e senha e entra em `crm/app/?empresa=<slug>`.
5. Em **Equipe e acesso**, ele confere a InfiniteTag e cadastra os planos e serviços que vende.

Mudar de plano: em **Empresas**, troque o plano na linha do cliente. O cliente não consegue mudar sozinho.

## O que cada plano libera

| Recurso | Essencial | Pro | White-label |
|---|---|---|---|
| Funil, clientes e agenda | sim | sim | sim |
| Orçamento do site entrando no funil | sim | sim | sim |
| Propostas e WhatsApp a um toque | sim | sim | sim |
| Histórico de exclusões e alterações | sim | sim | sim |
| Link de pagamento e aviso de pagante | | sim | sim |
| Financeiro e fluxo de caixa | | sim | sim |
| Radar de leads e estudo de mercado | | sim | sim |
| Pontuação, reativação e modelos de mensagem | | sim | sim |
| Relatórios, meta do mês e CSV | | sim | sim |
| Painel sem a marca Amplitude | | | sim |
| Domínio próprio, configurado à mão | | | sim |
| Pessoas na conta | 2 | 5 | sem limite |

As regras de financeiro, pagamento, Radar e número de pessoas ficam no banco ou no servidor. As demais ficam na tela. O domínio próprio ainda exige configuração manual na Cloudflare.

## Radar de leads

- Ordem das fontes: servidor com `GEOAPIFY_KEY` ou `GOOGLE_PLACES_KEY`, depois Overpass, depois Nominatim por quadrantes.
- Sem chave, a busca roda no navegador de quem usa, respeitando 1 pedido por segundo no Nominatim.
- Os servidores públicos do OpenStreetMap são gratuitos e para uso leve. Com muitos clientes usando o Radar, contrate uma fonte com chave.
- A cobertura varia por bairro. "Sem site" significa sem site registrado no mapa.

## Antes de vender

- Assinar o Supabase Pro: o plano grátis pausa após 7 dias sem uso e não tem backup automático.
- Ter contrato de tratamento de dados: a Amplitude é operadora e o cliente é controlador (LGPD).
- A cobrança mensal do próprio cliente ainda é feita à mão, gerando um link por mês.
