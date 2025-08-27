import React, { useState, useRef, useEffect } from 'react';
import { getAuthHeaders } from '../utils/auth';

const Chatbot = ({ isOpen, onClose, user }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: user 
        ? `안녕하세요 ${user.name}님! 찍고갈래 AI 어시스턴트입니다. 관광지나 서비스에 대해 궁금한 것이 있으시면 언제든 물어보세요! 😊`
        : '안녕하세요! 찍고갈래 AI 어시스턴트입니다. 관광지나 서비스에 대해 궁금한 것이 있으시면 언제든 물어보세요! 😊',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 사용자가 변경되면 환영 메시지 업데이트
  useEffect(() => {
    if (user) {
      setMessages([{
        role: 'assistant',
        content: `안녕하세요 ${user.name}님! 찍고갈래 AI 어시스턴트입니다. 관광지나 서비스에 대해 궁금한 것이 있으시면 언제든 물어보세요! 😊`,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [user]);

  // 메시지가 추가될 때마다 스크롤을 맨 아래로
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 메시지 전송
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    // 사용자 메시지 추가
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 대화 히스토리 준비 (시스템 메시지 제외)
      const conversationHistory = messages.filter(msg => msg.role !== 'system');

      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: getAuthHeaders(), // 인증 헤더 사용
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: conversationHistory,
          user: user // 사용자 정보 전달
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.message || '챗봇 응답 오류');
      }
    } catch (error) {
      console.error('챗봇 오류:', error);
      const errorMessage = {
        role: 'assistant',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enter 키로 메시지 전송
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      width: '350px',
      height: '500px',
      backgroundColor: '#fff',
      borderRadius: '15px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      border: '1px solid #e0e0e0'
    }}>
      {/* 헤더 */}
      <div style={{
        backgroundColor: '#4CAF50',
        color: 'white',
        padding: '15px 20px',
        borderRadius: '15px 15px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px' }}>찍고갈래 AI</h3>
          <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>관광 가이드 어시스턴트</p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          ×
        </button>
      </div>

      {/* 메시지 영역 */}
      <div style={{
        flex: 1,
        padding: '15px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              maxWidth: '80%',
              padding: '10px 15px',
              borderRadius: '15px',
              backgroundColor: message.role === 'user' ? '#4CAF50' : '#f5f5f5',
              color: message.role === 'user' ? 'white' : '#333',
              fontSize: '14px',
              lineHeight: '1.4',
              wordBreak: 'break-word'
            }}>
              {message.content}
            </div>
          </div>
        ))}
        
        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start'
          }}>
            <div style={{
              padding: '10px 15px',
              borderRadius: '15px',
              backgroundColor: '#f5f5f5',
              fontSize: '14px'
            }}>
              <div style={{
                display: 'flex',
                gap: '4px',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#999',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#999',
                  animation: 'pulse 1.5s ease-in-out 0.1s infinite'
                }}></div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#999',
                  animation: 'pulse 1.5s ease-in-out 0.2s infinite'
                }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div style={{
        padding: '15px',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        gap: '10px'
      }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력하세요..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '10px 15px',
            border: '1px solid #ddd',
            borderRadius: '20px',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: isLoading ? '#f5f5f5' : 'white'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
          style={{
            padding: '10px 15px',
            backgroundColor: (!inputMessage.trim() || isLoading) ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: (!inputMessage.trim() || isLoading) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            minWidth: '60px'
          }}
        >
          {isLoading ? '...' : '전송'}
        </button>
      </div>

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes pulse {
          0%, 60%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          30% {
            transform: scale(0.8);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default Chatbot;
