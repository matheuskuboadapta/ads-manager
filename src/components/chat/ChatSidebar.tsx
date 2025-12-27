import { useState, useRef, useEffect } from 'react';
import { Loader2, MessageCircle, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/hooks/useChat';
import { wrapText } from '@/utils/formatters';

// Declaração do tipo Chart para TypeScript
declare global {
  interface Window {
    Chart: any;
  }
}

interface ChatSidebarProps {
  onToggle: (isOpen: boolean) => void;
  onWidthChange: (width: number) => void;
}

// Componente para renderizar mensagens com HTML usando iframe para isolamento completo
function ChatMessageContent({ message }: { message: any }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    if (message.isHtml && iframeRef.current && !iframeError) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        try {
          // Escreve o HTML completo no iframe
          doc.open();
          doc.write(message.text);
          doc.close();
          
          // Ajusta a altura do iframe baseado no conteúdo
          const resizeObserver = new ResizeObserver(() => {
            if (iframe.contentWindow?.document.body) {
              const height = iframe.contentWindow.document.body.scrollHeight;
              iframe.style.height = `${Math.min(height + 20, 400)}px`;
            }
          });
          
          if (iframe.contentWindow?.document.body) {
            resizeObserver.observe(iframe.contentWindow.document.body);
          }
          
          return () => resizeObserver.disconnect();
        } catch (error) {
          console.error('Erro ao carregar iframe:', error);
          setIframeError(true);
        }
      }
    }
  }, [message.isHtml, message.text, iframeError]);

  if (message.isHtml) {
    if (iframeError) {
      // Fallback: renderiza HTML diretamente com isolamento CSS
      return (
        <div 
          className="html-content-fallback"
          dangerouslySetInnerHTML={{ __html: message.text }}
          style={{
            maxWidth: '100%',
            overflow: 'hidden',
            wordWrap: 'break-word',
            contain: 'layout style paint',
            position: 'relative',
            zIndex: 1,
            backgroundColor: 'transparent',
            padding: '10px',
            borderRadius: '8px',
          }}
        />
      );
    }

    return (
      <div className="html-message-container">
        <iframe
          ref={iframeRef}
          className="html-iframe"
          style={{
            width: '100%',
            height: '300px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            overflow: 'hidden',
          }}
          sandbox="allow-scripts allow-same-origin"
          title="Chat HTML Content"
          onError={() => setIframeError(true)}
        />
      </div>
    );
  }
  
  return <span>{message.isUser ? message.text : wrapText(message.text, 60)}</span>;
}

export function ChatSidebar({ onToggle, onWidthChange }: ChatSidebarProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [chatWidth, setChatWidth] = useState(400); // Default width (2 columns)
  const { messages, isLoading, sendMessage } = useChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && isOpen) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isOpen]);

  // Handle resize functionality
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
        // Limit width between 300px and 800px
        const clampedWidth = Math.max(300, Math.min(800, newWidth));
        setChatWidth(clampedWidth);
        onWidthChange(clampedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, onWidthChange]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle(newState);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <>
      {/* Chat Button */}
      <Button 
        onClick={handleToggle} 
        variant="outline" 
        size="sm"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Chat
      </Button>

      {/* Chat Sidebar */}
      {isOpen && (
        <div 
          className="fixed inset-y-0 right-0 bg-background border-l shadow-lg z-50 flex flex-col chat-sidebar"
          style={{ width: `${chatWidth}px` }}
        >
          {/* Resize Handle */}
          <div
            ref={resizeRef}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors"
            onMouseDown={handleResizeStart}
          >
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/50">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Chat de Suporte</h2>
            </div>
            <Button
              onClick={handleToggle}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Chat Content */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* Messages Area */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 py-4 min-h-0">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Olá! Como posso ajudá-lo hoje?</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                        message.isUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      } ${message.isHtml ? 'html-message' : ''}`}
                      style={{
                        ...(message.isHtml && {
                          maxWidth: '100%',
                          width: '100%',
                          overflow: 'hidden',
                        })
                      }}
                    >
                      <ChatMessageContent message={message} />
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-muted-foreground rounded-lg px-4 py-3 text-sm flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Digitando...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t p-6 flex-shrink-0 bg-muted/30">
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
                  disabled={isLoading}
                  className="min-h-[60px] max-h-[120px] resize-none flex-1"
                  rows={2}
                />
                <LoadingButton
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  loading={isLoading}
                  loadingText=""
                  size="sm"
                  className="self-end"
                >
                  Enviar
                </LoadingButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 