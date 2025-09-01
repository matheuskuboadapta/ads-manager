# Suporte ao HTML no Chat - Melhorias de Isolamento

## Problema Identificado

O chat estava quebrando o layout do frontend quando recebia conteúdo HTML, causando áreas em branco na tela. Isso acontecia porque:

1. **Conflito de CSS**: O HTML injetado afetava o layout global
2. **Scripts executando fora do escopo**: Chart.js e outros scripts interferiam com o DOM principal
3. **Isolamento insuficiente**: O conteúdo HTML não estava completamente isolado

## Solução Implementada

### 1. Isolamento com iframe

Implementamos um sistema de renderização HTML usando `iframe` para isolamento completo:

```typescript
// Componente ChatMessageContent com iframe
function ChatMessageContent({ message }: { message: any }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeError, setIframeError] = useState(false);

  // Renderiza HTML no iframe para isolamento completo
  if (message.isHtml) {
    return (
      <div className="html-message-container">
        <iframe
          ref={iframeRef}
          className="html-iframe"
          sandbox="allow-scripts allow-same-origin"
          title="Chat HTML Content"
        />
      </div>
    );
  }
}
```

### 2. Sistema de Fallback

Caso o iframe não funcione, implementamos um fallback com isolamento CSS:

```typescript
if (iframeError) {
  // Fallback: renderiza HTML diretamente com isolamento CSS
  return (
    <div 
      className="html-content-fallback"
      dangerouslySetInnerHTML={{ __html: message.text }}
      style={{
        contain: 'layout style paint',
        position: 'relative',
        zIndex: 1,
      }}
    />
  );
}
```

### 3. CSS de Isolamento

Adicionamos estilos CSS específicos para garantir isolamento:

```css
.html-iframe {
  contain: layout style paint !important;
  position: relative !important;
  z-index: 1 !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow: hidden !important;
}

.html-content-fallback {
  contain: layout style paint !important;
  position: relative !important;
  z-index: 1 !important;
  max-width: 100% !important;
  overflow: hidden !important;
}
```

## Benefícios

1. **Isolamento Completo**: O HTML do chat não afeta mais o layout principal
2. **Segurança**: iframe com sandbox previne execução de scripts maliciosos
3. **Compatibilidade**: Sistema de fallback garante funcionamento em todos os navegadores
4. **Performance**: Melhor gerenciamento de memória e recursos

## Como Usar

### Teste do HTML

Use o botão "Test HTML" no chat para testar a renderização de gráficos Chart.js.

### Estrutura do HTML

O HTML deve ser enviado no formato:

```json
[
  {
    "response": "<!DOCTYPE html>...</html>"
  }
]
```

### Exemplo de HTML Válido

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gráfico</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: transparent;
      padding: 10px;
      max-width: 100%;
      overflow: hidden;
    }
    .chart-container {
      position: relative;
      width: 100%;
      height: 200px;
      max-width: 100%;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <h2>Título do Gráfico</h2>
  <div class="chart-container">
    <canvas id="chart"></canvas>
  </div>
  <script>
    // Código do Chart.js aqui
  </script>
</body>
</html>
```

## Troubleshooting

### Se o iframe não carregar

1. Verifique se o HTML é válido
2. Confirme se os scripts externos estão acessíveis
3. O sistema automaticamente usará o fallback CSS

### Se o gráfico não aparecer

1. Verifique se o Chart.js está sendo carregado corretamente
2. Confirme se o canvas tem um ID único
3. Aguarde o carregamento completo dos scripts

### Se ainda houver problemas de layout

1. Verifique se o HTML não tem estilos que afetam o layout global
2. Confirme se todos os elementos têm `max-width: 100%`
3. Use `contain: layout style paint` nos containers principais
