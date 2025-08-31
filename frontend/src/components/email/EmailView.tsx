import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { format } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { emailAPI, EmailMessage, EmailAccount } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';

const EmailViewContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--background-color);
  overflow: hidden;
  height: 100%;
`;

const EmailHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--surface-color);
`;

const EmailToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const ToolbarButton = styled.button`
  padding: 0.5rem 0.75rem;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--border-color);
  }
`;

const BackButton = styled(Link)`
  padding: 0.5rem 0.75rem;
  background-color: var(--secondary-color);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const EmailSubject = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  line-height: 1.3;
`;

const EmailMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

const MetaLabel = styled.span`
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 60px;
`;

const MetaValue = styled.span`
  color: var(--text-primary);
`;

const EmailDate = styled.div`
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
`;

const EmailContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
`;

const ZoomControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-left: auto;
`;

const ZoomButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--border-color);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ZoomLevel = styled.span`
  font-size: 0.75rem;
  color: var(--text-secondary);
  min-width: 40px;
  text-align: center;
`;

const EmailBodyContainer = styled.div<{ zoom: number }>`
  /* CSS Protection for email content */
  position: relative;
  overflow: hidden;
  font-size: ${props => props.zoom}%;
  
  /* Reset any potential email CSS that could break our layout */
  * {
    /* Prevent emails from breaking our flexbox layout */
    position: static !important;
    z-index: auto !important;
    
    /* Prevent fixed positioning that could cover our UI */
    &[style*="position: fixed"],
    &[style*="position: absolute"] {
      position: relative !important;
    }
    
    /* Prevent emails from being too wide */
    max-width: 100% !important;
    
    /* Prevent margin/padding from breaking layout */
    box-sizing: border-box !important;
  }
  
  /* Prevent CSS injection attacks */
  script {
    display: none !important;
  }
  
  /* Prevent iframe abuse */
  iframe {
    max-width: 100% !important;
    max-height: 400px !important;
    border: 1px solid var(--border-color) !important;
  }
`;

const EmailBody = styled.div`
  line-height: 1.6;
  color: var(--text-primary);
  word-wrap: break-word;
  overflow-wrap: break-word;

  /* Style for HTML content */
  img {
    max-width: 100% !important;
    height: auto !important;
    border-radius: var(--radius-sm);
  }

  a {
    color: var(--primary-color) !important;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  blockquote {
    border-left: 4px solid var(--border-color);
    margin: 1rem 0;
    padding-left: 1rem;
    color: var(--text-secondary);
    background-color: var(--surface-color);
    border-radius: var(--radius-md);
  }

  pre, code {
    background-color: var(--surface-color) !important;
    padding: 0.5rem !important;
    border-radius: var(--radius-sm) !important;
    overflow-x: auto;
    font-family: 'Courier New', monospace !important;
    font-size: 0.875em !important;
    color: var(--text-primary) !important;
  }

  table {
    border-collapse: collapse !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 1rem 0 !important;
    background-color: var(--background-color) !important;
  }

  th, td {
    border: 1px solid var(--border-color) !important;
    padding: 0.5rem !important;
    text-align: left !important;
    vertical-align: top !important;
    background-color: var(--surface-color) !important;
    color: var(--text-primary) !important;
  }

  th {
    background-color: var(--header-bg) !important;
    font-weight: 600 !important;
  }

  /* Protect against malicious CSS */
  * {
    /* Prevent colors that could hide malicious content */
    &[style*="color: transparent"],
    &[style*="opacity: 0"] {
      opacity: 1 !important;
      color: var(--text-primary) !important;
    }
    
    /* Prevent invisible text attacks */
    &[style*="font-size: 0"] {
      font-size: inherit !important;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--error-color);
  text-align: center;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--text-muted);
  text-align: center;
`;

interface EmailViewProps {
  currentAccount: EmailAccount | null;
  message?: EmailMessage | null;
  messageId?: string;
  onBack?: () => void;
  onReply?: (message: EmailMessage) => void;
  onForward?: (message: EmailMessage) => void;
}

const EmailView: React.FC<EmailViewProps> = ({ currentAccount, message: propMessage, messageId: propMessageId, onBack, onReply, onForward }) => {
  const { messageId: paramMessageId } = useParams<{ messageId: string }>();
  const messageId = propMessageId || paramMessageId;
  const [message, setMessage] = useState<EmailMessage | null>(propMessage || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    if (propMessage && (propMessage.body_text || propMessage.body_html)) {
      // We have the full message content
      setMessage(propMessage);
      setIsLoading(false);
      setViewMode(propMessage.body_html ? 'html' : 'text');
    } else if ((propMessage?.id || messageId) && currentAccount) {
      // We need to load the full message content
      loadMessage(propMessage?.id || messageId);
    } else {
      setIsLoading(false);
    }
  }, [messageId, currentAccount, propMessage]);

  const loadMessage = async (msgId?: string) => {
    const idToLoad = msgId || messageId;
    if (!idToLoad || !currentAccount) return;

    setIsLoading(true);
    setError(null);

    try {
      const messageData = await emailAPI.getMessage(idToLoad, currentAccount.id);
      setMessage(messageData);
      
      // Prefer HTML view if available, fallback to text
      setViewMode(messageData.body_html ? 'html' : 'text');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load message');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'PPPP \'at\' p');
  };

  const getSenderName = (sender: string) => {
    const match = sender.match(/^(.+?)\s*<(.+)>$/);
    if (match) {
      return {
        name: match[1].trim(),
        email: match[2].trim()
      };
    }
    return { name: sender, email: sender };
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(200, prev + 10));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(50, prev - 10));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  const handlePrint = () => {
    if (!message) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const sender = getSenderName(message.sender);
    const formattedDate = formatDate(message.date);
    const emailContent = viewMode === 'html' && message.body_html ? message.body_html : message.body_text;
    const isHtml = viewMode === 'html' && message.body_html;

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Email - ${message.subject || 'No Subject'}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 20px;
              color: #333;
              background: white;
            }
            .email-header {
              border-bottom: 2px solid #e0e0e0;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .email-subject {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .email-meta {
              font-size: 14px;
              line-height: 1.6;
            }
            .meta-row {
              margin-bottom: 5px;
            }
            .meta-label {
              font-weight: bold;
              display: inline-block;
              width: 80px;
            }
            .email-date {
              font-size: 12px;
              color: #666;
              margin-top: 10px;
            }
            .email-content {
              font-size: 14px;
              line-height: 1.6;
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .email-content img {
              max-width: 100% !important;
              height: auto !important;
            }
            .email-content table {
              border-collapse: collapse;
              width: 100%;
              margin: 10px 0;
            }
            .email-content th, .email-content td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .email-content th {
              background-color: #f5f5f5;
            }
            @media print {
              body { margin: 0; }
              .email-header { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="email-header">
            <div class="email-subject">${message.subject || '(No subject)'}</div>
            <div class="email-meta">
              <div class="meta-row">
                <span class="meta-label">From:</span>
                <span>${sender.name} &lt;${sender.email}&gt;</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">To:</span>
                <span>${message.recipient.join(', ')}</span>
              </div>
              ${message.has_attachments ? '<div class="meta-row"><span class="meta-label">📎</span><span>Has attachments</span></div>' : ''}
            </div>
            <div class="email-date">${formattedDate}</div>
          </div>
          <div class="email-content">
            ${isHtml ? emailContent : `<pre style="font-family: inherit; white-space: pre-wrap; margin: 0;">${emailContent || 'No content available'}</pre>`}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Fallback to dashboard if no onBack handler provided
      window.history.back();
    }
  };

  const handleReply = () => {
    if (message && onReply) {
      onReply(message);
    }
  };

  const handleForward = () => {
    if (message && onForward) {
      onForward(message);
    }
  };

  if (!messageId && !propMessage) {
    return (
      <EmailViewContainer>
        <EmptyState>
          <div>Select an email to view</div>
        </EmptyState>
      </EmailViewContainer>
    );
  }

  if (isLoading) {
    return (
      <EmailViewContainer>
        <LoadingContainer>
          <LoadingSpinner />
        </LoadingContainer>
      </EmailViewContainer>
    );
  }

  if (error || !message) {
    return (
      <EmailViewContainer>
        <ErrorContainer>
          <div>Failed to load email</div>
          {error && <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</div>}
          <button 
            onClick={() => loadMessage()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
          >
            Retry
          </button>
        </ErrorContainer>
      </EmailViewContainer>
    );
  }

  const sender = getSenderName(message.sender);

  return (
    <EmailViewContainer>
      <EmailHeader>
        <EmailToolbar>
          <ToolbarButton onClick={handleBack}>
            <FontAwesomeIcon icon="arrow-left" /> Back
          </ToolbarButton>
          <ToolbarButton onClick={handlePrint}>
            <FontAwesomeIcon icon="file" /> Print
          </ToolbarButton>
          {message.body_html && message.body_text && (
            <ToolbarButton
              onClick={() => setViewMode(viewMode === 'html' ? 'text' : 'html')}
            >
              View {viewMode === 'html' ? 'Plain Text' : 'HTML'}
            </ToolbarButton>
          )}
          <ToolbarButton onClick={handleReply} disabled={!onReply}>
            <FontAwesomeIcon icon="reply" /> Reply
          </ToolbarButton>
          <ToolbarButton onClick={handleForward} disabled={!onForward}>
            <FontAwesomeIcon icon="share" /> Forward
          </ToolbarButton>
          
          <ZoomControls>
            <ZoomButton 
              onClick={handleZoomOut}
              disabled={zoomLevel <= 50}
              title="Zoom Out"
            >
              <FontAwesomeIcon icon="minus" />
            </ZoomButton>
            <ZoomLevel onClick={handleZoomReset} title="Reset Zoom">
              {zoomLevel}%
            </ZoomLevel>
            <ZoomButton 
              onClick={handleZoomIn}
              disabled={zoomLevel >= 200}
              title="Zoom In"
            >
              <FontAwesomeIcon icon="plus" />
            </ZoomButton>
          </ZoomControls>
        </EmailToolbar>

        <EmailSubject>{message.subject || '(No subject)'}</EmailSubject>

        <EmailMeta>
          <MetaRow>
            <MetaLabel>From:</MetaLabel>
            <MetaValue>{sender.name} &lt;{sender.email}&gt;</MetaValue>
          </MetaRow>
          
          <MetaRow>
            <MetaLabel>To:</MetaLabel>
            <MetaValue>{message.recipient.join(', ')}</MetaValue>
          </MetaRow>

          {message.has_attachments && (
            <MetaRow>
              <MetaLabel><FontAwesomeIcon icon="paperclip" /></MetaLabel>
              <MetaValue>Has attachments</MetaValue>
            </MetaRow>
          )}
        </EmailMeta>

        <EmailDate>{formatDate(message.date)}</EmailDate>
      </EmailHeader>

      <EmailContent>
        <EmailBodyContainer zoom={zoomLevel}>
          <EmailBody>
            {viewMode === 'html' && message.body_html ? (
              <div dangerouslySetInnerHTML={{ __html: message.body_html }} />
            ) : (
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                {message.body_text || 'No content available'}
              </pre>
            )}
          </EmailBody>
        </EmailBodyContainer>
      </EmailContent>
    </EmailViewContainer>
  );
};

export default EmailView;