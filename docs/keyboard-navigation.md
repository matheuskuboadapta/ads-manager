# Navegação por Teclado

## Visão Geral

O sistema de navegação por teclado permite que você navegue rapidamente entre as abas do Ads Manager usando as teclas **A** e **D**, similar à navegação de voltar/avançar do navegador.

## Teclas de Atalho

| Tecla | Ação | Descrição |
|-------|------|-----------|
| **A** | Navegar para a esquerda | Move para a aba anterior na sequência |
| **D** | Navegar para a direita | Move para a próxima aba na sequência |

## Ordem das Abas

A navegação segue a seguinte ordem:

1. **Home** - Dashboard principal
2. **Contas** - Visualização de contas
3. **Campanhas** - Gerenciamento de campanhas
4. **Conjuntos** - Gerenciamento de conjuntos de anúncios
5. **Anúncios** - Gerenciamento de anúncios individuais
6. **Regras** - Configuração de regras de automação

## Exemplos de Uso

### Navegando da Esquerda para a Direita

- Estou em **Campanhas** → Pressiono **D** → Vou para **Conjuntos**
- Estou em **Conjuntos** → Pressiono **D** → Vou para **Anúncios**

### Navegando da Direita para a Esquerda

- Estou em **Anúncios** → Pressiono **A** → Vou para **Conjuntos**
- Estou em **Conjuntos** → Pressiono **A** → Vou para **Campanhas**

## Comportamento

### Quando a Navegação Está Ativa

- As teclas funcionam em qualquer lugar da página
- A navegação é instantânea e suave
- Logs de navegação são exibidos no console do navegador

### Quando a Navegação Está Desabilitada

A navegação por teclado é automaticamente desabilitada quando você está:

- Digitando em um campo de texto (`<input>`)
- Digitando em uma área de texto (`<textarea>`)
- Editando conteúdo em elementos com `contenteditable`

Isso evita conflitos quando você está preenchendo formulários ou editando dados.

### Limites de Navegação

- Na primeira aba (**Home**), a tecla **A** não faz nada
- Na última aba (**Regras**), a tecla **D** não faz nada

## Indicador Visual

Um badge com ícone de teclado é exibido no header mostrando:

- As teclas disponíveis para navegação
- Um tooltip com informações sobre as próximas abas disponíveis
- Animação de destaque na primeira vez que você acessa o sistema

## Implementação Técnica

### Hook Customizado

O sistema é implementado através do hook `useKeyboardNavigation`:

```typescript
const { tabOrder } = useKeyboardNavigation({
  currentTab: activeTab,
  onTabChange: handleTabChange,
  enabled: true,
});
```

### Componente Visual

O componente `KeyboardHint` fornece feedback visual:

```typescript
<KeyboardHint currentTab={activeTab} tabOrder={tabOrder} />
```

## Acessibilidade

- As teclas A e D foram escolhidas por serem próximas às teclas WASD comuns em jogos
- O sistema respeita o contexto do usuário (não interfere em campos de entrada)
- Feedback visual claro sobre as opções de navegação disponíveis
- Tooltip informativo para novos usuários

## Personalização

Para desabilitar a navegação por teclado, altere o parâmetro `enabled`:

```typescript
useKeyboardNavigation({
  currentTab: activeTab,
  onTabChange: handleTabChange,
  enabled: false, // Desabilita a navegação
});
```

Para alterar a ordem das abas, edite o array `TAB_ORDER` em `src/hooks/useKeyboardNavigation.ts`:

```typescript
const TAB_ORDER = ['home', 'accounts', 'campaigns', 'adsets', 'ads', 'rules'];
```

## Compatibilidade

- ✅ Funciona em todos os navegadores modernos
- ✅ Compatível com mobile (embora menos útil em dispositivos touch)
- ✅ Não interfere com outros atalhos do navegador
- ✅ Funciona com teclados QWERTY e similares

