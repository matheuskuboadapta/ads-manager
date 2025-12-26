# Atualizações de Responsividade Mobile

## Visão Geral

O sistema foi adaptado para funcionar de forma responsiva em dispositivos móveis, com foco especial na aba de campanhas que agora apresenta uma interface otimizada para telas pequenas.

## Principais Mudanças

### 1. Hook de Detecção Mobile
- **Arquivo**: `src/hooks/use-mobile.tsx`
- **Função**: `useIsMobile()` - detecta quando o usuário está em um dispositivo móvel (largura < 768px)

### 2. Componentes Mobile para Campanhas

#### MobileCampaignsList
- **Arquivo**: `src/components/ads-manager/mobile/MobileCampaignsList.tsx`
- **Funcionalidades**:
  - Lista de campanhas em formato de cards
  - Exibição das métricas principais (CTR, CPA, Gasto, Vendas)
  - Switch para alterar status da campanha
  - Botão para editar orçamento (quando em modo de edição)

#### MobileCampaignDetailDialog
- **Arquivo**: `src/components/ads-manager/mobile/MobileCampaignDetailDialog.tsx`
- **Funcionalidades**:
  - Dialog popup que abre ao clicar em uma campanha
  - Duas abas: Conjuntos e Anúncios
  - Permite alterar status e orçamento de conjuntos e anúncios
  - Exibe métricas detalhadas de cada item

### 3. Menu Mobile
- **Local**: `src/pages/Index.tsx`
- **Funcionalidades**:
  - Menu lateral (drawer) acessível através do botão hambúrguer
  - Navegação entre todas as abas do sistema
  - Informações do usuário e opções de logout/upload

### 4. Hook de Detalhes da Campanha
- **Arquivo**: `src/hooks/useCampaignDetails.ts`
- **Função**: Busca dados agregados de conjuntos e anúncios de uma campanha específica

### 5. Estilos Responsivos
- **Arquivo**: `src/index.css`
- **Adições**:
  - Media queries para dispositivos móveis
  - Ajustes de padding e espaçamento
  - Otimizações para scroll e visualização

## Como Usar

### Desktop
- A interface continua funcionando normalmente com a tabela completa
- Todas as funcionalidades existentes são mantidas

### Mobile
1. **Navegação**: Use o menu hambúrguer no canto superior esquerdo
2. **Campanhas**: 
   - Visualize a lista de campanhas em formato de cards
   - Toque em uma campanha para ver detalhes
   - Use os switches para ativar/desativar
   - No modo de edição, toque no ícone de lápis para editar orçamentos
3. **Detalhes da Campanha**:
   - Navegue entre as abas "Conjuntos" e "Anúncios"
   - Altere status e orçamentos conforme necessário

## Considerações Técnicas

- O breakpoint mobile é definido em 768px
- O chat lateral é automaticamente oculto em dispositivos móveis
- As tabelas são substituídas por cards para melhor visualização
- O sistema mantém todas as funcionalidades, apenas com uma interface adaptada

## Próximos Passos

Para expandir a responsividade para outras abas (Contas, Conjuntos, Anúncios, Regras), siga o mesmo padrão:
1. Crie componentes mobile específicos em `src/components/ads-manager/mobile/`
2. Use o hook `useIsMobile()` para detectar e alternar entre interfaces
3. Mantenha a consistência visual com cards e layouts verticais
4. Preserve todas as funcionalidades essenciais
