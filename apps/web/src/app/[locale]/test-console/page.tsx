'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Tabs, TabsList, TabsTrigger, TabsContent } from '@wattweiser/ui';
import { Send, Bot, User, Settings, Play, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function TestConsolePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { data: assistants } = useQuery({
    queryKey: ['assistants'],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/agents`, {
        credentials: 'include',
      });
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
  });

  const handleSend = async () => {
    if (!input.trim() || !selectedAssistant) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: input,
          agentId: selectedAssistant,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || 'Keine Antwort erhalten',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Test Console</h1>
          <p className="mt-2 text-lg text-gray-600">
            Testen Sie Ihre Assistants und Agenten in Echtzeit
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg">Konfiguration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Assistant auswählen
                  </label>
                  <select
                    value={selectedAssistant}
                    onChange={(e) => setSelectedAssistant(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Wählen Sie einen Assistant --</option>
                    {assistants?.map((assistant: any) => (
                      <option key={assistant.id} value={assistant.id}>
                        {assistant.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Settings className="h-4 w-4" />
                    Einstellungen
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card variant="elevated" className="flex h-[calc(100vh-12rem)] flex-col">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg">Chat</CardTitle>
                <CardDescription>
                  {selectedAssistant
                    ? `Chat mit ${assistants?.find((a: any) => a.id === selectedAssistant)?.name || 'Assistant'}`
                    : 'Wählen Sie einen Assistant aus, um zu beginnen'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Bot className="mx-auto h-12 w-12 mb-4" />
                        <p>Keine Nachrichten. Beginnen Sie eine Unterhaltung.</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100">
                            <Bot className="h-4 w-4 text-primary-600" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="mt-1 text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString('de-DE')}
                          </p>
                        </div>
                        {message.role === 'user' && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex gap-4 justify-start">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100">
                        <Bot className="h-4 w-4 text-primary-600" />
                      </div>
                      <div className="rounded-2xl bg-gray-100 px-4 py-3">
                        <div className="flex gap-1">
                          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 p-4">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Nachricht eingeben..."
                      disabled={!selectedAssistant || isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || !selectedAssistant || isLoading}
                      size="lg"
                      className="gap-2"
                    >
                      <Send className="h-5 w-5" />
                      Senden
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
