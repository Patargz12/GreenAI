import { createFileRoute } from '@tanstack/react-router'
import React, { useEffect, useRef, useState } from 'react'
import { Bot, Send, Sparkles, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: number
  text: string
  sender: 'user' | 'bot'
  isTyping?: boolean
}

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Array<Message>>([])
  const [input, setInput] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isBotTyping, setIsBotTyping] = useState<boolean>(false)
  const [apiKey, setApiKey] = useState<string>(
    'AIzaSyC87UWjwZezAXu4sY_pcKvYWB1u3533reo',
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Suggestion cards data
  const suggestions = [
    'What can I ask you to do?',
    'Which one of my projects is performing the best?',
    'What projects should I be concerned about right now?',
  ]

  const scrollToBottom = (): void => {
    // Primary method: scroll the end reference into view with smooth behavior
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest',
      })
    }

    // Fallback method: scroll the container to bottom only if primary method fails
    if (messagesContainerRef.current && !messagesEndRef.current) {
      const container = messagesContainerRef.current
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Additional scroll effect for when bot is typing - reduced frequency to prevent shaking
  useEffect(() => {
    if (isBotTyping) {
      const scrollInterval = setInterval(() => {
        scrollToBottom()
      }, 300) // Reduced frequency to prevent shaking

      return () => clearInterval(scrollInterval)
    }
  }, [isBotTyping])

  // Scroll when loading state changes
  useEffect(() => {
    if (isLoading) {
      scrollToBottom()
    }
  }, [isLoading])

  const callGeminiAI = async (message: string): Promise<string> => {
    if (!apiKey) {
      throw new Error('Please enter your Google API key')
    }

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          apiKey: apiKey,
        }),
      })

      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status} ${response.statusText}`,
        )
      }

      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('Fetch error:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'Could not connect to server. Make sure the backend is running on http://localhost:3001',
        )
      }
      throw error
    }
  }

  const sendMessage = async (
    e?: React.MouseEvent | React.KeyboardEvent,
  ): Promise<void> => {
    if (e && 'preventDefault' in e) e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
    }

    setMessages((prev) => [...prev, userMessage])
    const userInput = input // Store input before clearing
    setInput('')
    setIsLoading(true)

    // Immediately scroll to show user's message
    setTimeout(() => scrollToBottom(), 100)

    try {
      const botResponse = await callGeminiAI(userInput)
      setIsLoading(false)

      // Add bot message with typing indicator
      const botMessage: Message = {
        id: Date.now() + 1,
        text: botResponse,
        sender: 'bot',
        isTyping: true,
      }

      setIsBotTyping(true)
      setMessages((prev) => [...prev, botMessage])

      // Scroll to show the new bot message
      setTimeout(() => scrollToBottom(), 100)
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        text:
          error instanceof Error
            ? error.message
            : 'Sorry, something went wrong. Please try again.',
        sender: 'bot',
      }
      setMessages((prev) => [...prev, errorMessage])
      setIsLoading(false)
    }
  }

  // Component for typing bot message
  const TypingBotMessage: React.FC<{ message: Message }> = ({ message }) => {
    const [displayedLength, setDisplayedLength] = useState(0)
    const [isComplete, setIsComplete] = useState(false)

    useEffect(() => {
      if (!message.text) return

      setDisplayedLength(0)
      setIsComplete(false)
      let currentLength = 0

      const timer = setInterval(() => {
        if (currentLength < message.text.length) {
          currentLength += 2 // Type 2 characters at a time for smoother effect
          setDisplayedLength(currentLength)
        } else {
          setIsComplete(true)
          clearInterval(timer)
        }
      }, 15) // Faster interval since we're typing multiple characters

      return () => clearInterval(timer)
    }, [message.text])

    useEffect(() => {
      if (isComplete) {
        // Update the message to remove typing flag when complete
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === message.id ? { ...msg, isTyping: false } : msg,
          ),
        )
        setIsBotTyping(false)
      }
    }, [isComplete, message.id])

    // Scroll as text is being typed - throttled to prevent shaking
    useEffect(() => {
      if (!isComplete && displayedLength > 0) {
        const timeoutId = setTimeout(() => {
          scrollToBottom()
        }, 50) // Debounced scroll to prevent excessive calls

        return () => clearTimeout(timeoutId)
      }
    }, [displayedLength, isComplete])

    // Get the text to display (truncated based on typing progress)
    const textToDisplay = message.text.slice(0, displayedLength)

    return (
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            h1: ({ children }) => (
              <h1 className="text-lg font-bold mb-2">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-md font-bold mb-2">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-bold mb-1">{children}</h3>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-4 mb-2">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-4 mb-2">{children}</ol>
            ),
            li: ({ children }) => <li className="mb-1">{children}</li>,
            code: ({ children, ...props }) => {
              const isInline = !props.className
              return isInline ? (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ) : (
                <code
                  className="block bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto"
                  {...props}
                >
                  {children}
                </code>
              )
            },
            pre: ({ children }) => (
              <pre className="bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto mb-2">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-gray-300 pl-3 italic mb-2">
                {children}
              </blockquote>
            ),
            strong: ({ children }) => (
              <strong className="font-bold">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
          }}
        >
          {textToDisplay}
        </ReactMarkdown>
        {!isComplete && (
          <span className="loading h-4 w-4 loading-spinner text-green-600"></span>
        )}
      </div>
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      sendMessage(e)
    }
  }

  const handleSuggestionClick = (suggestion: string): void => {
    setInput(suggestion)
  }

  const showWelcomeScreen = messages.length === 0 && !isLoading

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      {/* Messages or Welcome Screen */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto">
        {showWelcomeScreen ? (
          // Welcome Screen
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="text-center mb-8">
              {/* Sparkle Icon */}
              <div className="mb-6">
                <Sparkles className="w-12 h-12 text-green-600 mx-auto" />
              </div>

              {/* Main Title */}
              <h1 className="text-3xl font-bold text-gray-800 mb-8">
                Ask our AI anything
              </h1>

              {/* Suggestions */}
              <div className="mb-8">
                <p className="text-green-600 font-medium mb-4">
                  Suggestions on what to ask Our AI
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-4xl">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-3 bg-white/30 backdrop-blur-md border border-white/20 rounded-lg text-gray-800 hover:bg-white/40 hover:border-white/30 transition-all duration-200 text-sm shadow-lg hover:shadow-xl"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Chat Messages
          <div className="p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === `user` ? `justify-end` : `justify-start`}`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-xs lg:max-w-md`}
                  >
                    {message.sender === 'bot' && (
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`px-4 py-2 rounded-lg min-h-[2.5rem] ${
                        message.sender === 'user'
                          ? 'bg-green-600 text-white'
                          : 'bg-white/90 backdrop-blur-sm text-gray-800 border border-green-100 shadow-sm'
                      }`}
                    >
                      {message.sender === 'bot' ? (
                        message.isTyping ? (
                          <TypingBotMessage message={message} />
                        ) : (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0">{children}</p>
                                ),
                                h1: ({ children }) => (
                                  <h1 className="text-lg font-bold mb-2">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-md font-bold mb-2">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-sm font-bold mb-1">
                                    {children}
                                  </h3>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc pl-4 mb-2">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal pl-4 mb-2">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="mb-1">{children}</li>
                                ),
                                code: ({ children, ...props }) => {
                                  const isInline = !props.className
                                  return isInline ? (
                                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                                      {children}
                                    </code>
                                  ) : (
                                    <code
                                      className="block bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto"
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  )
                                },
                                pre: ({ children }) => (
                                  <pre className="bg-gray-100 p-2 rounded text-sm font-mono overflow-x-auto mb-2">
                                    {children}
                                  </pre>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-gray-300 pl-3 italic mb-2">
                                    {children}
                                  </blockquote>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-bold">
                                    {children}
                                  </strong>
                                ),
                                em: ({ children }) => (
                                  <em className="italic">{children}</em>
                                ),
                              }}
                            >
                              {message.text}
                            </ReactMarkdown>
                          </div>
                        )
                      ) : (
                        message.text
                      )}
                    </div>
                    {message.sender === 'user' && (
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm border border-green-100 px-4 py-2 rounded-lg shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-green-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-transparent backdrop-blur-sm p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your projects..."
              disabled={isLoading || isBotTyping}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-3 border text-black border-green-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent disabled:opacity-50 bg-white/90 backdrop-blur-sm"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || isBotTyping || !input.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: ChatBot,
})

export default ChatBot
