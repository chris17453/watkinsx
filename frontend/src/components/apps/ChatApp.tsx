import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { chatAPI, ChatMember, ChatMessage, ChatChannel } from '../../services/api';
import { playICQMessageSound, playICQSentSound, playICQUserOnlineSound } from '../../utils/sounds';

const ChatAppContainer = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
`;

const ChatSidebar = styled.div`
  width: 280px;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SidebarSection = styled.div`
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
`;

const SectionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const UserList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const UserItem = styled.div<{ status?: string; selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: ${props => props.selected ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.selected ? 'white' : 'var(--sidebar-text)'};
  margin-bottom: 0.25rem;

  &:hover {
    background-color: ${props => props.selected ? 'var(--primary-hover)' : 'var(--sidebar-hover)'};
  }
`;

const StatusDot = styled.div<{ status?: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => {
    switch (props.status) {
      case 'online': return '#10b981';
      case 'away': return '#f59e0b';
      case 'busy': return '#ef4444';
      default: return '#6b7280';
    }
  }};
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserStatus = styled.div`
  font-size: 0.75rem;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const AppHeader = styled.div`
  height: 60px;
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
`;

const AppTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StatusSelector = styled.select`
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--surface-color);
  color: var(--text-primary);
  font-size: 0.875rem;
`;

const ChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--background-color);
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Message = styled.div<{ isOwn?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.isOwn ? 'flex-end' : 'flex-start'};
  max-width: 70%;
  ${props => props.isOwn ? 'margin-left: auto;' : 'margin-right: auto;'}
`;

const MessageBubble = styled.div<{ isOwn?: boolean }>`
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background-color: ${props => props.isOwn ? 'var(--primary-color)' : 'var(--surface-color)'};
  color: ${props => props.isOwn ? 'white' : 'var(--text-primary)'};
  border: ${props => props.isOwn ? 'none' : '1px solid var(--border-color)'};
  word-wrap: break-word;
`;

const MessageInfo = styled.div`
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
`;

const MessageInput = styled.div`
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  background-color: var(--surface-color);
`;

const InputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
`;

const TextInput = styled.textarea`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--background-color);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 0.875rem;
  resize: none;
  min-height: 40px;
  max-height: 120px;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const SendButton = styled.button`
  padding: 0.75rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--primary-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WelcomeMessage = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-muted);
`;

const CreateChannelButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-bottom: 0.5rem;

  &:hover {
    background-color: var(--primary-hover);
  }
`;

const NewChatButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: var(--surface-color);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;

  &:hover {
    background-color: var(--sidebar-hover);
    border-color: var(--primary-color);
  }
`;

const ChannelItem = styled.div<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: ${props => props.selected ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.selected ? 'white' : 'var(--sidebar-text)'};
  margin-bottom: 0.25rem;

  &:hover {
    background-color: ${props => props.selected ? 'var(--primary-hover)' : 'var(--sidebar-hover)'};
  }
`;

const UserCheckbox = styled.input.attrs({ type: 'checkbox' })`
  margin-right: 0.5rem;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 80%;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-md);
  
  &:hover {
    background-color: var(--sidebar-hover);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--background-color);
  color: var(--text-primary);
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.variant === 'primary' ? `
    background-color: var(--primary-color);
    color: white;
    border: none;
    
    &:hover {
      background-color: var(--primary-hover);
    }
  ` : `
    background-color: var(--surface-color);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    
    &:hover {
      background-color: var(--sidebar-hover);
    }
  `}
`;


const ChatApp: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [selectedUser, setSelectedUser] = useState<ChatMember | null>(null);
  const [messageText, setMessageText] = useState('');
  const [userStatus, setUserStatus] = useState('ONLINE');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [users, setUsers] = useState<ChatMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadChannels();
    loadUsers();
    updateUserPresence(userStatus);
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      loadChannelMessages(selectedChannel.id);
    }
  }, [selectedChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChannels = async () => {
    try {
      const channelsData = await chatAPI.getChannels();
      setChannels(channelsData);
    } catch (error) {
      console.error('Failed to load channels:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const domainUsers = await chatAPI.getDomainUsers();
      setUsers(domainUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadChannelMessages = async (channelId: number) => {
    try {
      setLoading(true);
      const messagesData = await chatAPI.getChannelMessages(channelId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserPresence = async (status: string) => {
    try {
      await chatAPI.updatePresence(status);
    } catch (error) {
      console.error('Failed to update presence:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChannel) return;

    try {
      const newMessage = await chatAPI.sendMessage(selectedChannel.id, {
        content: messageText,
        message_type: 'TEXT'
      });
      
      setMessages([...messages, newMessage]);
      setMessageText('');

      // Play ICQ-style sound
      await playICQSentSound();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const createNewChannel = async () => {
    if (!newChannelName.trim()) return;

    try {
      setLoading(true);
      const newChannel = await chatAPI.createChannel({
        name: newChannelName,
        channel_type: 'PUBLIC',
        member_ids: selectedUsers
      });
      
      setChannels([...channels, newChannel]);
      setSelectedChannel(newChannel);
      setNewChannelName('');
      setSelectedUsers([]);
      setShowNewChannel(false);
      await loadChannels();
    } catch (error) {
      console.error('Failed to create channel:', error);
    } finally {
      setLoading(false);
    }
  };

  const startDirectMessage = async (user: ChatMember) => {
    try {
      // Create a private channel for direct messaging
      const dmChannel = await chatAPI.createChannel({
        name: `DM with ${user.username}`,
        channel_type: 'PRIVATE',
        member_ids: [user.id]
      });
      
      setChannels([...channels, dmChannel]);
      setSelectedChannel(dmChannel);
      setSelectedUser(user);
      setShowNewChat(false);
    } catch (error) {
      console.error('Failed to start direct message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const playICQSound = async (soundType: string) => {
    switch (soundType) {
      case 'message_received':
        await playICQMessageSound();
        break;
      case 'user_online':
        await playICQUserOnlineSound();
        break;
      default:
        console.log(`🔊 ICQ ${soundType} Sound`);
    }
  };

  const handleChannelClick = (channel: ChatChannel) => {
    setSelectedChannel(channel);
    setSelectedUser(null);
    playICQSound('message_received');
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <ChatAppContainer>
      <ChatSidebar>
        <SidebarSection>
          <CreateChannelButton onClick={() => setShowNewChannel(true)}>
            <FontAwesomeIcon icon="plus" />
            New Channel
          </CreateChannelButton>
          <NewChatButton onClick={() => setShowNewChat(true)}>
            <FontAwesomeIcon icon="envelope" />
            New Chat
          </NewChatButton>
          <SectionTitle>Conversations</SectionTitle>
        </SidebarSection>

        <UserList>
          {channels.map((channel) => (
            <ChannelItem
              key={channel.id}
              selected={selectedChannel?.id === channel.id}
              onClick={() => handleChannelClick(channel)}
            >
              <FontAwesomeIcon 
                icon={channel.channel_type === 'PRIVATE' ? 'envelope' : 'comments'} 
              />
              <UserInfo>
                <UserName>{channel.name}</UserName>
                <UserStatus>
                  {channel.member_count} member{channel.member_count !== 1 ? 's' : ''}
                </UserStatus>
              </UserInfo>
              {channel.unread_count > 0 && (
                <span style={{
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  fontSize: '0.75rem',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '9999px',
                  minWidth: '1rem',
                  textAlign: 'center'
                }}>
                  {channel.unread_count}
                </span>
              )}
            </ChannelItem>
          ))}
        </UserList>
      </ChatSidebar>
      
      <MainContent>
        <AppHeader>
          <AppTitle>
            <FontAwesomeIcon icon="comments" />
            {selectedChannel ? selectedChannel.name : 'WatkinsX Chat'}
          </AppTitle>
          <StatusSelector 
            value={userStatus} 
            onChange={(e) => {
              setUserStatus(e.target.value);
              updateUserPresence(e.target.value);
            }}
          >
            <option value="ONLINE">🟢 Online</option>
            <option value="AWAY">🟡 Away</option>
            <option value="BUSY">🔴 Busy</option>
            <option value="OFFLINE">⚫ Offline</option>
          </StatusSelector>
        </AppHeader>
        
        <ChatArea>
          {selectedChannel ? (
            <>
              <MessagesContainer>
                {messages.map((message) => (
                  <Message key={message.id} isOwn={message.username === 'You'}>
                    <MessageBubble isOwn={message.username === 'You'}>
                      {message.content}
                    </MessageBubble>
                    <MessageInfo>
                      {message.username} • {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </MessageInfo>
                  </Message>
                ))}
                <div ref={messagesEndRef} />
              </MessagesContainer>
              
              <MessageInput>
                <InputContainer>
                  <TextInput
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message ${selectedChannel.name}...`}
                    rows={1}
                  />
                  <SendButton 
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || loading}
                  >
                    <FontAwesomeIcon icon={loading ? "spinner" : "paper-plane"} />
                    {loading ? 'Sending...' : 'Send'}
                  </SendButton>
                </InputContainer>
              </MessageInput>
            </>
          ) : (
            <WelcomeMessage>
              <FontAwesomeIcon 
                icon="comments" 
                size="3x" 
                style={{ marginBottom: '1rem', opacity: 0.5 }}
              />
              <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                Welcome to WatkinsX Chat!
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                Select a user from the sidebar to start chatting.<br/>
                Create channels for group conversations.
              </div>
            </WelcomeMessage>
          )}
        </ChatArea>
      </MainContent>

      {/* New Channel Modal */}
      {showNewChannel && (
        <ModalOverlay onClick={() => setShowNewChannel(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Create New Channel</ModalTitle>
              <CloseButton onClick={() => setShowNewChannel(false)}>
                <FontAwesomeIcon icon="times" />
              </CloseButton>
            </ModalHeader>
            
            <FormGroup>
              <Label>Channel Name</Label>
              <Input
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Enter channel name..."
              />
            </FormGroup>

            <FormGroup>
              <Label>Add Members</Label>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {users.map((user) => (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0' }}>
                    <UserCheckbox
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                    />
                    <span>{user.full_name || user.username}</span>
                  </div>
                ))}
              </div>
            </FormGroup>

            <ButtonGroup>
              <Button onClick={() => setShowNewChannel(false)}>Cancel</Button>
              <Button variant="primary" onClick={createNewChannel} disabled={!newChannelName.trim()}>
                Create Channel
              </Button>
            </ButtonGroup>
          </Modal>
        </ModalOverlay>
      )}

      {/* New Chat Modal */}
      {showNewChat && (
        <ModalOverlay onClick={() => setShowNewChat(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Start New Chat</ModalTitle>
              <CloseButton onClick={() => setShowNewChat(false)}>
                <FontAwesomeIcon icon="times" />
              </CloseButton>
            </ModalHeader>
            
            <FormGroup>
              <Label>Select User to Chat With</Label>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {users.map((user) => (
                  <UserItem
                    key={user.id}
                    status={user.status}
                    onClick={() => startDirectMessage(user)}
                  >
                    <StatusDot status={user.status} />
                    <UserInfo>
                      <UserName>{user.full_name || user.username}</UserName>
                      <UserStatus>
                        {user.status === 'ONLINE' ? 'Online' : 
                         user.status === 'AWAY' ? 'Away' : 
                         user.status === 'BUSY' ? 'Busy' : 'Offline'}
                      </UserStatus>
                    </UserInfo>
                  </UserItem>
                ))}
              </div>
            </FormGroup>
          </Modal>
        </ModalOverlay>
      )}
    </ChatAppContainer>
  );
};

export default ChatApp;