import { useState } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isHtml?: boolean; // Indica se a mensagem contém HTML
}

// Função para detectar se uma string contém HTML
function containsHtml(text: string): boolean {
  const htmlRegex = /<[^>]*>/;
  return htmlRegex.test(text);
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const sendMessage = async (text: string) => {
    if (!user?.email) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send message and get response from single webhook
      const params = new URLSearchParams({
        email: user.email,
        message: text,
      });
      
      const response = await fetch(`https://mkthooks.adaptahub.org/webhook/ads-manager/chat-to-traffic-answer?${params}`);
      const data = await response.json();

      // Lidar com diferentes formatos de resposta
      let responseText = 'Resposta não disponível';
      
      if (Array.isArray(data) && data.length > 0) {
        // Formato: [{ "response": "..." }]
        responseText = data[0].response || 'Resposta não disponível';
      } else if (data.response) {
        // Formato: { "response": "..." }
        responseText = data.response;
      } else {
        // Formato direto ou outro
        responseText = typeof data === 'string' ? data : JSON.stringify(data);
      }

      const isHtml = containsHtml(responseText);

      // Add bot response
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
        isHtml,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Erro no chat",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };



  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}