# Análise de requisitos

## 1. Visão Geral

O sistema visa automatizar a operação da empresa X Salgados, substituindo o fluxo manual via WhatsApp por um portal B2B. A plataforma gerencia desde o pedido do cliente até a roteirização otimizada para vans e caminhões, focando em eficiência logística, controle de estoque de produtos acabados e rentabilidade financeira.

## 2. Escopo do Projeto

### 2.1. Inclusões

- **Portal do Comprador:** Cadastro de conta, pedidos via site e histórico.
- **Gestão de Identidade (RBAC):** Níveis de acesso para Admin, Motorista e Comprador.
- **Logística de Janelas:** "Horário de Corte" e "Agenda Regional" por bairro.
- **Gestão de Frota Avançada:** Controle de consumo, autonomia e capacidade em caixas.
- **Dashboard Financeiro:** Cálculo de custo de combustível e lucro por rota.
- **Roteirização:** Clusterização (K-Means) e Sequenciamento (Vizinho Mais Próximo).

### 2.2. Exclusões

- Leitura automatizada de mensagens de WhatsApp.
- Acompanhamento de chão de fábrica (produção) e insumos (matéria-prima).

---

## 3. Requisitos Funcionais (RF)

### RF01: Portal do Comprador e Autenticação

- **Cadastro/Login:** O comprador deve criar uma conta com CNPJ/CPF e endereço.
- **Geocodificação Preventiva:** O endereço do cliente deve ser validado e transformado em coordenadas no momento do cadastro.
- **Realização de Pedidos:** Interface para seleção de salgados (apenas prontos em estoque) e escolha da data de entrega baseada na **Agenda Regional**.

### RF02: Gestão de Estoque e Produtos

- **Estoque de Prontos:** Controle de saldo em "caixas padrão".
- **Bloqueio de Venda:** Impedir pedidos de produtos sem saldo (Estoque Bloqueante).

### RF03: Roteirização e Despacho

- **Horário de Corte:** Processamento de rotas em lote após horário fixo.
- **Clusterização Inteligente:** Uso de K-Means para dividir pedidos entre os veículos ativos do dia.
- **Sequenciamento Real:** Ordenação via Vizinho Mais Próximo usando distâncias reais de ruas.
- **Integração de GPS:** Botão para abrir a navegação (Google Maps/Waze) ponto a ponto para o motorista.

### RF04: Gestão de Frota e Finanças

- **Perfil do Veículo:** Registro de consumo médio (km/l), autonomia e tipo de combustível.
- **Dashboard de Lucratividade:** Exibir valor total da rota (-) custo estimado de combustível.

---

## 4. Papéis de Usuário (RBAC)

| **Papel**         | **Responsabilidades Principais**                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| **Administrador** | Gestão de preços, entrada de estoque, cadastro de frota, fechamento de rotas e análise financeira. |
| **Comprador**     | Realização de pedidos, gestão de perfil e consulta ao status da entrega.                           |
| **Motorista**     | Visualização da rota atribuída, carga total do veículo e navegação via GPS.                        |

---

## 5. Regras de Negócio (RN)

- **RN01 (Capacidade de Carga):** O sistema não deve exceder o limite de "caixas padrão" de cada veículo.
- **RN02 (Prioridade de Entrega):** Pedidos mais antigos no sistema têm prioridade de encaixe no primeiro carregamento.
- **RN03 (Agenda Regional):** O cliente só pode selecionar datas de entrega em que o veículo esteja escalado para sua zona/bairro.
- **RN04 (PMO - Ocupação Mínima):** Alerta ao Admin se um veículo for despachado com menos de X% de ocupação.
- **RN05 (Viabilidade de Autonomia):** O sistema deve validar se a quilometragem da rota é compatível com a autonomia do veículo (margem de segurança de 20%).
- **RN06 (Custo de Combustível):** O custo da rota é calculado como: `(Distância Total / Consumo Médio) * Preço Combustível`.

---

## 6. Arquitetura Técnica e Estrutura

### Estrutura Monorepo (Isolada)

- **`/backend`:** Node.js (Vanilla JS/Express), PostgreSQL, Knex.
- **`/frontend`:** React (Vite)(Vanilla JS), Shadcn, Tailwind CSS, Axios, TanStack Query.
- **`/docs`:** Documentação e este arquivo de requisitos.

### Modelo de Dados Expandido

- **Users:** `id, email, password, role, lat, lng, bairro_id`.
- **Produtos:** `id, nome, qtd_estoque, caixas_por_unidade`.
- **Veículos:** `id, tipo, capacidade_caixas, consumo_medio, autonomia_max`.
- **Pedidos:** `id, cliente_id, total_caixas, status, data_entrega, rota_id`.
- **AgendaRegional:** `id, bairro_id, dia_semana`.

---

## 7. Critérios de Sucesso

1. **Acurácia Geográfica:** 100% dos pedidos geocodificados no ato do cadastro.
2. **Eficiência de Carga:** Aumento da taxa de ocupação dos caminhões/vans através da Agenda Regional.
3. **Transparência Financeira:** Visibilidade imediata do lucro líquido de cada rota despachada.
