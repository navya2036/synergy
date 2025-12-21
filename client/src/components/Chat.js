import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './Chat.css';

const Chat = ({ projectId, userId, username }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null); // Keep socket reference stable

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const connectSocket = async () => {
      try {
        console.log('Initializing socket connection...', { projectId, userId });
        
        // Get JWT token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please login again.');
          return;
        }

        // Create socket connection with JWT in auth
        const newSocket = io('https://synergy-ut87.onrender.com', {
          query: { projectId },
          auth: { token }, // Send JWT token in handshake
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000
        });

        socketRef.current = newSocket;

        // Socket event handlers
        newSocket.on('connect', () => {
          console.log('Socket connected successfully');
          setIsConnected(true);
          setError(null);
        });

        newSocket.on('connected', (data) => {
          console.log('Received connection confirmation:', data);
        });

        newSocket.on('error', (err) => {
          console.error('Socket error:', err);
          setError(err.message || 'Chat connection error');
          setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setError('Failed to connect to chat server');
          setIsConnected(false);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          setIsConnected(false);
        });

        // Message handling
        newSocket.on('message', (message) => {
          console.log('Received new message:', message);
          setMessages(prevMessages => {
            // Avoid duplicates
            if (prevMessages.some(m => m._id === message._id)) {
              return prevMessages;
            }
            return [...prevMessages, message];
          });
        });

        setSocket(newSocket);

        // Load existing messages
        try {
          console.log('Fetching messages for project:', projectId);
          const response = await fetch(`/api/messages/projects/${projectId}/messages`, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-auth-token': token
            }
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch messages');
          }
          
          const data = await response.json();
          console.log('Loaded existing messages:', data);
          setMessages(Array.isArray(data) ? data : []);
          setError(null); // Clear any existing error
        } catch (err) {
          console.error('Error loading messages:', err);
          setError(err.message || 'Failed to load messages');
          setMessages([]); // Set empty array on error
        }
      } catch (err) {
        console.error('Error setting up chat:', err);
        setError('Failed to initialize chat');
      }
    };

    connectSocket();

    // Cleanup
    return () => {
      console.log('Cleaning up chat component...');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [projectId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();
    
    if (!trimmedMessage) {
      return;
    }

    if (!socket?.connected) {
      console.error('Socket is not connected');
      setError('Chat is disconnected. Please refresh the page.');
      return;
    }

    try {
      // Only send message content, server will use authenticated user info
      const messageData = {
        content: trimmedMessage
      };

      console.log('Sending message:', messageData);

      // Emit with acknowledgment
      socket.emit('message', messageData, (response) => {
        if (response.success) {
          console.log('Message sent successfully:', response.messageId);
        } else {
          console.error('Failed to send message:', response.error);
          setError('Failed to send message. Please try again.');
        }
      });

      // Clear input
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="chat-container">
      {error && (
        <div className="chat-error">
          <span>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
            {error}
          </span>
          <div className="error-actions">
            <button onClick={async () => {
              setError(null);
              try {
                const response = await fetch(`/api/messages/projects/${projectId}/messages`, {
                  headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('token') && {
                      'x-auth-token': localStorage.getItem('token')
                    })
                  }
                });
                if (!response.ok) throw new Error('Failed to fetch messages');
                const data = await response.json();
                setMessages(Array.isArray(data) ? data : []);
              } catch (err) {
                setError('Failed to load messages. Please try again.');
              }
            }}>
              <i className="fas fa-sync-alt" style={{ marginRight: '4px' }}></i>
              Try Again
            </button>
          </div>
        </div>
      )}
      
      <div className="chat-status">
        {isConnected ? (
          <span className="status-connected">●</span>
        ) : (
          <span className="status-disconnected">●</span>
        )}
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>

      <div className="messages-container">
        {Array.isArray(messages) && messages.map((message) => (
          <div
            key={message._id || `${message.timestamp}-${message.userId}`}
            className={`message ${message.userId === userId ? 'my-message' : 'other-message'}`}
          >
            <div className="message-header">
              <span className="username">{message.username}</span>
              <span className="timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
        {(!Array.isArray(messages) || messages.length === 0) && (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="message-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="message-input"
          disabled={!isConnected}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!isConnected || !newMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;