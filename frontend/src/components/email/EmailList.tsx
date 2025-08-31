import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { format } from 'date-fns';
import { emailAPI, EmailMessage, EmailAccount } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';

const EmailListContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--surface-color);
  height: 100%;
  overflow: hidden;
`;

const EmailListHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--header-bg);
`;

const FolderTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

const MessageCount = styled.div`
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const EmailListContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const EmailItem = styled.div<{ isRead: boolean; isSelected: boolean }>`
  display: block;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: ${props => {
    if (props.isSelected) return 'var(--primary-color-light, rgba(37, 99, 235, 0.1))';
    return props.isRead ? 'transparent' : 'var(--background-color)';
  }};
  border-left: ${props => props.isSelected ? '3px solid var(--primary-color)' : '3px solid transparent'};

  &:hover {
    background-color: ${props => props.isSelected ? 'var(--primary-color-light, rgba(37, 99, 235, 0.15))' : 'var(--border-color)'};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const EmailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
`;

const SenderName = styled.div<{ isRead: boolean }>`
  font-weight: ${props => props.isRead ? 'normal' : '600'};
  color: var(--text-primary);
  font-size: 0.875rem;
`;

const EmailDate = styled.div`
  font-size: 0.75rem;
  color: var(--text-secondary);
`;

const EmailSubject = styled.div<{ isRead: boolean }>`
  font-size: 0.875rem;
  font-weight: ${props => props.isRead ? 'normal' : '600'};
  color: var(--text-primary);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmailPreview = styled.div`
  font-size: 0.75rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmailMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
`;

const AttachmentIcon = styled.span`
  font-size: 0.75rem;
  color: var(--text-secondary);
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-muted);
  text-align: center;
`;

interface EmailListProps {
  currentAccount: EmailAccount | null;
  folder?: string;
  onMessageSelect?: (message: EmailMessage) => void;
  selectedMessageId?: string;
}

const EmailList: React.FC<EmailListProps> = ({ 
  currentAccount, 
  folder: propFolder, 
  onMessageSelect,
  selectedMessageId 
}) => {
  const { folder: paramFolder } = useParams<{ folder: string }>();
  const folder = propFolder || paramFolder || 'INBOX';
  
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentAccount) {
      loadMessages();
    }
  }, [currentAccount, folder]);

  const loadMessages = async () => {
    if (!currentAccount) return;

    setIsLoading(true);
    setError(null);

    try {
      const messagesData = await emailAPI.getMessages(currentAccount.id, folder);
      setMessages(messagesData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return format(date, 'HH:mm');
    } else if (diffDays <= 7) {
      return format(date, 'EEE');
    } else if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'MMM d');
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const getSenderName = (sender: string) => {
    const match = sender.match(/^(.+?)\s*<.+>$/);
    return match ? match[1].trim() : sender;
  };

  const getEmailPreview = (message: EmailMessage) => {
    if (message.body_text) {
      return message.body_text.substring(0, 100).replace(/\n/g, ' ');
    }
    if (message.body_html) {
      // Simple HTML strip
      const text = message.body_html.replace(/<[^>]*>/g, '');
      return text.substring(0, 100).replace(/\n/g, ' ');
    }
    return 'No preview available';
  };

  if (isLoading) {
    return (
      <EmailListContainer>
        <LoadingContainer>
          <LoadingSpinner />
        </LoadingContainer>
      </EmailListContainer>
    );
  }

  if (error) {
    return (
      <EmailListContainer>
        <EmptyState>
          <div>Error loading emails</div>
          <div style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>{error}</div>
          <button 
            onClick={loadMessages}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
          >
            Retry
          </button>
        </EmptyState>
      </EmailListContainer>
    );
  }

  return (
    <EmailListContainer>
      <EmailListHeader>
        <FolderTitle>{folder.charAt(0).toUpperCase() + folder.slice(1)}</FolderTitle>
        <MessageCount>{messages.length} messages</MessageCount>
      </EmailListHeader>

      <EmailListContent>
        {messages.length === 0 ? (
          <EmptyState>
            <div>No messages in this folder</div>
          </EmptyState>
        ) : (
          messages.map((message) => (
            <EmailItem
              key={message.id}
              isRead={message.is_read}
              isSelected={selectedMessageId === message.id}
              onClick={() => onMessageSelect?.(message)}
            >
              <EmailHeader>
                <SenderName isRead={message.is_read}>
                  {getSenderName(message.sender)}
                </SenderName>
                <EmailDate>{formatDate(message.date)}</EmailDate>
              </EmailHeader>
              
              <EmailSubject isRead={message.is_read}>
                {message.subject || '(No subject)'}
              </EmailSubject>
              
              <EmailPreview>
                {getEmailPreview(message)}
              </EmailPreview>
              
              <EmailMeta>
                {message.has_attachments && (
                  <AttachmentIcon>📎</AttachmentIcon>
                )}
              </EmailMeta>
            </EmailItem>
          ))
        )}
      </EmailListContent>
    </EmailListContainer>
  );
};

export default EmailList;