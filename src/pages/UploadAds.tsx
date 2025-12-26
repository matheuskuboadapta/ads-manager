import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingButton } from '@/components/ui/loading-button';
import { useFunnelOptions } from '@/hooks/useFunnelOptions';
import { useActorOptions } from '@/hooks/useActorOptions';
import { getNextAdsetGroupName, getLastAdsetGroupName, saveLastAdsetGroupName } from '@/utils/formatters';

export default function UploadAds() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [platform, setPlatform] = useState<'meta' | 'youtube'>('meta');
  const { data: funnelOptions, isLoading: isLoadingFunnels, error: funnelError } = useFunnelOptions();
  const { data: actorOptions, isLoading: isLoadingActors, error: actorError } = useActorOptions();
  const [formData, setFormData] = useState({
    groupName: '',
    funnel: '',
    actor: '',
    adAccount: 'act_371216193594378',
    adLinks: '',
    budget: '500',
    startDate: 'tomorrow'
  });

  // Carregar o próximo valor do grupo de anúncios quando o componente montar
  useEffect(() => {
    if (platform === 'meta') {
      const lastValue = getLastAdsetGroupName();
      const nextValue = getNextAdsetGroupName(lastValue);
      setFormData(prev => ({
        ...prev,
        groupName: nextValue
      }));
    }
  }, [platform]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (platform === 'meta') {
      if (!formData.groupName.trim()) {
        toast({
          title: "Erro",
          description: "Nome do grupo de anúncios é obrigatório",
          variant: "destructive"
        });
        return;
      }

      if (!formData.actor) {
        toast({
          title: "Erro",
          description: "Ator é obrigatório",
          variant: "destructive"
        });
        return;
      }

      if (!formData.adAccount) {
        toast({
          title: "Erro",
          description: "Conta de anúncios é obrigatória",
          variant: "destructive"
        });
        return;
      }

      if (!formData.budget || parseInt(formData.budget) < 1) {
        toast({
          title: "Erro",
          description: "Orçamento deve ser maior que zero",
          variant: "destructive"
        });
        return;
      }

      if (!formData.startDate) {
        toast({
          title: "Erro",
          description: "Data de início é obrigatória",
          variant: "destructive"
        });
        return;
      }
    }

    if (!formData.funnel) {
      toast({
        title: "Erro",
        description: "Funil é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!formData.adLinks.trim()) {
      toast({
        title: "Erro",
        description: "Links dos anúncios são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let endpoint: string;
      let headers: HeadersInit;
      let body: string | FormData;

      if (platform === 'youtube') {
        // Processar links - dividir por quebra de linha e filtrar vazios
        const linksArray = formData.adLinks
          .split('\n')
          .map(link => link.trim())
          .filter(link => link.length > 0);

        // Endpoint do Youtube
        endpoint = 'https://hooks.adaptaops.org/rota/7a4bf8e0-df75-4026-8604-8aea95cbb697';
        
        // Usar FormData para formulário HTML
        const formDataToSend = new FormData();
        formDataToSend.append('link do video no drive', linksArray.join('\n'));
        formDataToSend.append('funil', formData.funnel);
        
        body = formDataToSend;
        headers = {}; // FormData define o Content-Type automaticamente com boundary
      } else {
        // Processar links - dividir por quebra de linha e filtrar vazios
        const linksArray = formData.adLinks
          .split('\n')
          .map(link => link.trim())
          .filter(link => link.length > 0);

        // Endpoint do Meta
        endpoint = 'https://mkthooks.adaptahub.org/webhook/db09b37c-53d0-4783-a8b9-76e9c9e04479';
        
        // Payload para Meta (JSON)
        const payload = {
          platform: platform,
          funnel: formData.funnel,
          adLinks: linksArray,
          groupName: formData.groupName.trim(),
          actor: formData.actor,
          adAccount: formData.adAccount,
          budget: parseInt(formData.budget),
          startDate: formData.startDate
        };
        
        body = JSON.stringify(payload);
        headers = {
          'Content-Type': 'application/json',
        };
      }

      // Enviar via webhook
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: body
      });

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Dados enviados com sucesso",
        });
        
        // Salvar o valor do grupo de anúncios usado (apenas para Meta)
        if (platform === 'meta' && formData.groupName.trim()) {
          saveLastAdsetGroupName(formData.groupName.trim());
        }
        
        // Limpar formulário e gerar próximo valor
        const lastValue = platform === 'meta' ? formData.groupName.trim() : null;
        const nextGroupName = platform === 'meta' ? getNextAdsetGroupName(lastValue) : '';
        
        setFormData({
          groupName: nextGroupName,
          funnel: '',
          actor: '',
          adAccount: 'act_371216193594378',
          adLinks: '',
          budget: '500',
          startDate: 'tomorrow'
        });
      } else {
        throw new Error('Erro ao enviar dados');
      }
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            <div className="bg-primary p-2 rounded-lg">
              <Upload className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Upload de Ads</h1>
              <p className="text-muted-foreground text-sm">
                Envie seus anúncios para processamento
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-2xl mx-auto">
          {/* Platform Switch */}
          <div className="mb-6 flex justify-center">
            <ToggleGroup 
              type="single" 
              value={platform} 
              onValueChange={(value) => {
                if (value) setPlatform(value as 'meta' | 'youtube');
              }}
              className="inline-flex h-10 items-center justify-center rounded-full border border-input bg-card p-0.5 gap-0 shadow-sm"
            >
              <ToggleGroupItem
                value="meta"
                aria-label="Meta"
                className={platform === 'meta' 
                  ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary rounded-l-full border-r border-input px-4 font-medium transition-colors" 
                  : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground rounded-l-full border-r border-input px-4 transition-colors"
                }
              >
                Meta
              </ToggleGroupItem>
              <ToggleGroupItem
                value="youtube"
                aria-label="Youtube"
                className={platform === 'youtube' 
                  ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary rounded-r-full px-4 font-medium transition-colors" 
                  : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground rounded-r-full px-4 transition-colors"
                }
              >
                Youtube
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Formulário de Upload</span>
              </CardTitle>
              <CardDescription>
                Preencha os dados abaixo para enviar seus anúncios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {platform === 'meta' && (
                  <>
                    {/* Nome do grupo de anúncios */}
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Nome do grupo de anúncios *</Label>
                      <Input
                        id="groupName"
                        value={formData.groupName}
                        onChange={(e) => handleInputChange('groupName', e.target.value)}
                        placeholder="Digite o nome do grupo de anúncios"
                        required
                      />
                    </div>

                    {/* Ator */}
                    <div className="space-y-2">
                      <Label htmlFor="actor">Ator *</Label>
                      <Select value={formData.actor} onValueChange={(value) => handleInputChange('actor', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingActors ? "Carregando opções..." : "Selecione um ator"} />
                        </SelectTrigger>
                        <SelectContent>
                          {actorOptions?.map((actor) => (
                            <SelectItem key={actor} value={actor}>
                              {actor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {actorError && (
                        <p className="text-sm text-red-500">
                          Erro ao carregar opções de ator. Usando opções padrão.
                        </p>
                      )}
                    </div>

                    {/* Conta de anúncios */}
                    <div className="space-y-2">
                      <Label htmlFor="adAccount">Conta de anúncios *</Label>
                      <Select value={formData.adAccount} onValueChange={(value) => handleInputChange('adAccount', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma conta de anúncios" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="act_905921799754775">Conta 1</SelectItem>
                          <SelectItem value="act_371216193594378">Conta 3</SelectItem>
                          <SelectItem value="act_2076696925768157">Conta 4</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Selecione a conta de anúncios do Meta
                      </p>
                    </div>

                    {/* Orçamento */}
                    <div className="space-y-2">
                      <Label htmlFor="budget">Orçamento *</Label>
                      <Input
                        id="budget"
                        type="number"
                        value={formData.budget}
                        onChange={(e) => handleInputChange('budget', e.target.value)}
                        placeholder="Digite o orçamento"
                        min="1"
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        Defina o orçamento para a campanha
                      </p>
                    </div>

                    {/* Data de início */}
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Data de início *</Label>
                      <Select value={formData.startDate} onValueChange={(value) => handleInputChange('startDate', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Hoje</SelectItem>
                          <SelectItem value="tomorrow">Amanhã</SelectItem>
                          <SelectItem value="dayAfterTomorrow">Depois de amanhã</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Selecione quando a campanha deve começar
                      </p>
                    </div>
                  </>
                )}

                {/* Funil - sempre visível */}
                <div className="space-y-2">
                  <Label htmlFor="funnel">Funil *</Label>
                  <Select value={formData.funnel} onValueChange={(value) => handleInputChange('funnel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingFunnels ? "Carregando opções..." : "Selecione um funil"} />
                    </SelectTrigger>
                    <SelectContent>
                      {funnelOptions?.map((funnel) => (
                        <SelectItem key={funnel} value={funnel}>
                          {funnel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {funnelError && (
                    <p className="text-sm text-red-500">
                      Erro ao carregar opções de funil. Usando opções padrão.
                    </p>
                  )}
                </div>

                {/* Links dos anúncios - sempre visível */}
                <div className="space-y-2">
                  <Label htmlFor="adLinks">Link dos anúncios *</Label>
                  <Textarea
                    id="adLinks"
                    value={formData.adLinks}
                    onChange={(e) => handleInputChange('adLinks', e.target.value)}
                    placeholder={platform === 'meta' 
                      ? "Cole os links do drive aqui, um por linha:&#10;https://drive.google.com/file/d/1abc...&#10;https://drive.google.com/file/d/2def...&#10;https://drive.google.com/file/d/3ghi..."
                      : "Cole os links dos anúncios aqui, um por linha"
                    }
                    rows={6}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    {platform === 'meta' 
                      ? "Cole os links do Google Drive, um por linha. Cada link será processado separadamente."
                      : "Cole os links dos anúncios, um por linha."
                    }
                  </p>
                </div>

                {/* Botões */}
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/')}
                  >
                    Cancelar
                  </Button>
                  <LoadingButton
                    type="submit"
                    loading={isLoading}
                    loadingText="Enviando..."
                    className="flex items-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Enviar Dados</span>
                  </LoadingButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
