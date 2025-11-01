import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingButton } from '@/components/ui/loading-button';
import { useFunnelOptions } from '@/hooks/useFunnelOptions';
import { useActorOptions } from '@/hooks/useActorOptions';

export default function UploadAds() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { data: funnelOptions, isLoading: isLoadingFunnels, error: funnelError } = useFunnelOptions();
  const { data: actorOptions, isLoading: isLoadingActors, error: actorError } = useActorOptions();
  const [formData, setFormData] = useState({
    groupName: '',
    funnel: '',
    customFunnel: '',
    actor: '',
    customActor: '',
    adLinks: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.groupName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do grupo de anúncios é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!formData.funnel && !formData.customFunnel.trim()) {
      toast({
        title: "Erro",
        description: "Funil é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!formData.actor && !formData.customActor.trim()) {
      toast({
        title: "Erro",
        description: "Ator é obrigatório",
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
      // Processar links - dividir por quebra de linha e filtrar vazios
      const linksArray = formData.adLinks
        .split('\n')
        .map(link => link.trim())
        .filter(link => link.length > 0);

      // Preparar dados para envio
      const payload = {
        groupName: formData.groupName.trim(),
        funnel: formData.funnel === 'custom' ? formData.customFunnel.trim() : formData.funnel,
        actor: formData.actor === 'custom' ? formData.customActor.trim() : formData.actor,
        adLinks: linksArray
      };

      // Enviar via webhook
      const response = await fetch('https://mkthooks.adaptahub.org/webhook/db09b37c-53d0-4783-a8b9-76e9c9e04479', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Dados enviados com sucesso",
        });
        
        // Limpar formulário
        setFormData({
          groupName: '',
          funnel: '',
          customFunnel: '',
          actor: '',
          customActor: '',
          adLinks: ''
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

                {/* Funil */}
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
                      <SelectItem value="custom">Outro (escrever)</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.funnel === 'custom' && (
                    <Input
                      value={formData.customFunnel}
                      onChange={(e) => handleInputChange('customFunnel', e.target.value)}
                      placeholder="Digite o nome do funil"
                    />
                  )}
                  {funnelError && (
                    <p className="text-sm text-red-500">
                      Erro ao carregar opções de funil. Usando opções padrão.
                    </p>
                  )}
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
                      <SelectItem value="custom">Outro (escrever)</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.actor === 'custom' && (
                    <Input
                      value={formData.customActor}
                      onChange={(e) => handleInputChange('customActor', e.target.value)}
                      placeholder="Digite o nome do ator"
                    />
                  )}
                  {actorError && (
                    <p className="text-sm text-red-500">
                      Erro ao carregar opções de ator. Usando opções padrão.
                    </p>
                  )}
                </div>

                {/* Links dos anúncios */}
                <div className="space-y-2">
                  <Label htmlFor="adLinks">Links dos anúncios *</Label>
                  <Textarea
                    id="adLinks"
                    value={formData.adLinks}
                    onChange={(e) => handleInputChange('adLinks', e.target.value)}
                    placeholder="Cole os links do drive aqui, um por linha:&#10;https://drive.google.com/file/d/1abc...&#10;https://drive.google.com/file/d/2def...&#10;https://drive.google.com/file/d/3ghi..."
                    rows={6}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Cole os links do Google Drive, um por linha. Cada link será processado separadamente.
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
