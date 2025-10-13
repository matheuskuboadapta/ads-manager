# Componentes de Loading

Este documento descreve os componentes de loading implementados para melhorar a experiência do usuário durante operações assíncronas.

## Componentes Disponíveis

### 1. LoadingSpinner

Um componente de spinner de loading reutilizável com diferentes tamanhos e variantes.

```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Uso básico
<LoadingSpinner />

// Com tamanho personalizado
<LoadingSpinner size="lg" />

// Com texto
<LoadingSpinner text="Carregando dados..." />

// Como overlay
<LoadingSpinner variant="overlay" text="Processando..." />
```

**Props:**
- `size`: "sm" | "md" | "lg" | "xl" (padrão: "md")
- `className`: string - classes CSS adicionais
- `text`: string - texto opcional para mostrar
- `variant`: "default" | "overlay" (padrão: "default")

### 2. LoadingButton

Um botão com estado de loading integrado.

```tsx
import { LoadingButton } from '@/components/ui/loading-button';

<LoadingButton
  loading={isLoading}
  loadingText="Salvando..."
  onClick={handleSave}
>
  Salvar
</LoadingButton>
```

**Props:**
- `loading`: boolean - estado de loading
- `loadingText`: string - texto mostrado durante loading
- Todas as props do componente Button

### 3. LoadingOverlay

Um overlay de loading que cobre toda a tela.

```tsx
import { LoadingOverlay } from '@/components/ui/loading-overlay';

<LoadingOverlay 
  isVisible={isLoading} 
  text="Atualizando dados..." 
/>
```

**Props:**
- `isVisible`: boolean - controla a visibilidade
- `text`: string - texto a ser exibido
- `className`: string - classes CSS adicionais

## Hook useLoading

Um hook personalizado para gerenciar estados de loading de forma consistente.

```tsx
import { useLoading } from '@/hooks/useLoading';

const MyComponent = () => {
  const { loading, setLoading, withLoading, startLoading, stopLoading } = useLoading();

  // Uso básico
  const handleAction = async () => {
    setLoading(true);
    try {
      await someAsyncOperation();
    } finally {
      setLoading(false);
    }
  };

  // Uso com withLoading (recomendado)
  const handleActionWithLoading = withLoading(async () => {
    await someAsyncOperation();
  });

  return (
    <LoadingButton loading={loading} onClick={handleActionWithLoading}>
      Executar Ação
    </LoadingButton>
  );
};
```

## Exemplos de Uso

### 1. Atualização de Status

```tsx
const { loading: statusUpdateLoading, withLoading: withStatusUpdateLoading } = useLoading();

const handleStatusChange = withStatusUpdateLoading(async (item, newStatus) => {
  await updateItemStatus(item.id, newStatus);
  // O loading é automaticamente gerenciado
});

return (
  <div className="flex items-center space-x-2">
    <Switch
      checked={isActive}
      onCheckedChange={handleStatusChange}
      disabled={statusUpdateLoading}
    />
    {statusUpdateLoading && <LoadingSpinner size="sm" />}
  </div>
);
```

### 2. Operações em Massa

```tsx
const { loading: bulkUpdateLoading, withLoading: withBulkUpdateLoading } = useLoading();

const handleBulkUpdate = withBulkUpdateLoading(async () => {
  await Promise.all(selectedItems.map(item => updateItem(item)));
});

return (
  <LoadingButton
    loading={bulkUpdateLoading}
    loadingText="Atualizando..."
    onClick={handleBulkUpdate}
  >
    Atualizar Selecionados
  </LoadingButton>
);
```

### 3. Loading Global

```tsx
const { loading: globalLoading, withLoading: withGlobalLoading } = useLoading();

const refreshAllData = withGlobalLoading(async () => {
  await queryClient.invalidateQueries();
});

return (
  <>
    <LoadingButton
      loading={globalLoading}
      loadingText="Atualizando..."
      onClick={refreshAllData}
    >
      Atualizar Dados
    </LoadingButton>
    
    <LoadingOverlay 
      isVisible={globalLoading} 
      text="Atualizando dados..." 
    />
  </>
);
```

## Boas Práticas

1. **Use o hook `useLoading`** para gerenciar estados de loading de forma consistente
2. **Prefira `withLoading`** sobre controle manual do estado
3. **Desabilite interações** durante loading para evitar ações duplicadas
4. **Forneça feedback visual** imediato para ações do usuário
5. **Use LoadingSpinner pequeno** para ações individuais
6. **Use LoadingOverlay** para operações que afetam toda a aplicação
7. **Mantenha o texto de loading** informativo e específico

## Implementação Atual

Os componentes de loading foram implementados nos seguintes locais:

- **Chat**: LoadingButton no envio de mensagens
- **AdsTab**: Loading states para atualização de status individual e em massa
- **CampaignsTab**: Loading states para atualização de status individual e em massa
- **Index**: LoadingOverlay global para atualização de dados
- **DetailView**: LoadingSpinner para insights da IA

Isso garante que o usuário sempre tenha feedback visual durante operações assíncronas, melhorando significativamente a experiência do usuário.
