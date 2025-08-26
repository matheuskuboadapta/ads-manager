import { useState, useRef, useEffect } from 'react';
import { Loader2, MessageCircle, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/hooks/useChat';
import { wrapText } from '@/utils/formatters';

interface ChatSidebarProps {
  onToggle: (isOpen: boolean) => void;
  onWidthChange: (width: number) => void;
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
          className="fixed inset-y-0 right-0 bg-background border-l shadow-lg z-50 flex flex-col"
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
            <h2 className="text-lg font-semibold">Chat de Suporte</h2>
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
                      }`}
                    >
                      {message.isUser ? message.text : wrapText(message.text, 60)}
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
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
                disabled={isLoading}
                className="min-h-[60px] max-h-[120px] resize-none"
                rows={2}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 