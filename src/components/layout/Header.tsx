import React from 'react'
import { Bot } from 'lucide-react'

interface HeaderProps {
  apiKey: string
  onApiKeyChange: (apiKey: string) => void
}

const Header: React.FC<HeaderProps> = () => {
  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-purple-200 p-4 shadow-sm">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-purple-600" />
          <h1 className="text-xl font-semibold text-gray-800">
            Laudi AI Chatbot
          </h1>
        </div>
      </div>
    </div>
  )
}

export default Header
