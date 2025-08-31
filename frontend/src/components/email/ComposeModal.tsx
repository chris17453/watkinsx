import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { EmailAccount, emailAPI } from '../../services/api';

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
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background-color: var(--surface-color);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: var(--background-color);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--border-color);
  }
`;

const ModalContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const FormSection = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
`;

const FormRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  min-width: 80px;
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--background-color);
  color: var(--text-primary);
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const EditorSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const EditorToolbar = styled.div`
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--background-color);
`;

const ToolbarButton = styled.button<{ active?: boolean }>`
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background-color: ${props => props.active ? 'var(--primary-color)' : 'var(--surface-color)'};
  color: ${props => props.active ? 'white' : 'var(--text-primary)'};
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.active ? 'var(--primary-hover)' : 'var(--border-color)'};
  }
`;

const EditorContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TextEditor = styled.textarea`
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  background-color: var(--background-color);
  color: var(--text-primary);
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: none;
  outline: none;
`;

const HtmlEditor = styled.div`
  flex: 1;
  padding: 1rem 1.5rem;
  background-color: var(--background-color);
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-y: auto;
  outline: none;
  cursor: text;

  &[contenteditable] {
    min-height: 300px;
  }

  img {
    max-width: 100%;
    height: auto;
  }
`;

const AttachmentsSection = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  background-color: var(--background-color);
`;

const AttachmentList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const AttachmentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
`;

const RemoveButton = styled.button`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: none;
  background-color: var(--error-color);
  color: white;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FileInput = styled.input`
  display: none;
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${props => props.variant === 'primary' ? 'var(--primary-color)' : 'var(--border-color)'};
  background-color: ${props => props.variant === 'primary' ? 'var(--primary-color)' : 'var(--surface-color)'};
  color: ${props => props.variant === 'primary' ? 'white' : 'var(--text-primary)'};

  &:hover {
    background-color: ${props => props.variant === 'primary' ? 'var(--primary-hover)' : 'var(--border-color)'};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

interface Attachment {
  file: File;
  id: string;
}

interface ComposeModalProps {
  currentAccount: EmailAccount | null;
  onClose: () => void;
  mode?: 'compose' | 'reply' | 'forward';
  originalMessage?: {
    id: string;
    subject: string;
    sender: string;
    recipient: string[];
    date: string;
    body_text?: string;
    body_html?: string;
  };
}

const ComposeModal: React.FC<ComposeModalProps> = ({ currentAccount, onClose, mode = 'compose', originalMessage }) => {
  // Initialize fields based on mode
  const getInitialTo = () => {
    if (mode === 'reply' && originalMessage) return originalMessage.sender;
    return '';
  };
  
  const getInitialSubject = () => {
    if (mode === 'reply' && originalMessage) return originalMessage.subject.startsWith('Re:') ? originalMessage.subject : `Re: ${originalMessage.subject}`;
    if (mode === 'forward' && originalMessage) return originalMessage.subject.startsWith('Fwd:') ? originalMessage.subject : `Fwd: ${originalMessage.subject}`;
    return '';
  };
  
  const getInitialContent = () => {
    if (!originalMessage) return { text: '', html: '' };
    
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    });
    
    if (mode === 'reply') {
      const textQuote = `\n\nOn ${formatDate(originalMessage.date)}, ${originalMessage.sender} wrote:\n> ${(originalMessage.body_text || '').split('\n').join('\n> ')}\n`;
      const htmlQuote = `<br><br><blockquote>On ${formatDate(originalMessage.date)}, ${originalMessage.sender} wrote:<br><br>${originalMessage.body_html || originalMessage.body_text || ''}</blockquote>`;
      return { text: textQuote, html: htmlQuote };
    }
    
    if (mode === 'forward') {
      const textForward = `\n\n---------- Forwarded message ----------\nFrom: ${originalMessage.sender}\nTo: ${originalMessage.recipient.join(', ')}\nDate: ${formatDate(originalMessage.date)}\nSubject: ${originalMessage.subject}\n\n${originalMessage.body_text || ''}`;
      const htmlForward = `<br><br><hr><p><strong>---------- Forwarded message ----------</strong><br>From: ${originalMessage.sender}<br>To: ${originalMessage.recipient.join(', ')}<br>Date: ${formatDate(originalMessage.date)}<br>Subject: ${originalMessage.subject}</p><br>${originalMessage.body_html || originalMessage.body_text || ''}`;
      return { text: textForward, html: htmlForward };
    }
    
    return { text: '', html: '' };
  };

  const initialContent = getInitialContent();
  
  const [to, setTo] = useState(getInitialTo());
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(getInitialSubject());
  const [editorMode, setEditorMode] = useState<'text' | 'html'>('html');
  const [textContent, setTextContent] = useState(initialContent.text);
  const [htmlContent, setHtmlContent] = useState(initialContent.html);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  const htmlEditorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleHtmlContentChange = useCallback(() => {
    if (htmlEditorRef.current) {
      setHtmlContent(htmlEditorRef.current.innerHTML);
    }
  }, []);

  const formatText = (command: string, value?: string) => {
    if (editorMode === 'html' && htmlEditorRef.current) {
      htmlEditorRef.current.focus();
      document.execCommand(command, false, value);
      handleHtmlContentChange();
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      formatText('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      formatText('insertImage', url);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newAttachments: Attachment[] = Array.from(files).map(file => ({
        file,
        id: Math.random().toString(36).substr(2, 9)
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSend = async () => {
    if (!currentAccount || !to.trim()) {
      alert('Please enter a recipient email address.');
      return;
    }

    setIsSending(true);
    try {
      await emailAPI.sendMessage(currentAccount.id, {
        to: to.split(',').map(email => email.trim()),
        cc: cc ? cc.split(',').map(email => email.trim()) : undefined,
        bcc: bcc ? bcc.split(',').map(email => email.trim()) : undefined,
        subject: subject,
        body_text: editorMode === 'text' ? textContent : undefined,
        body_html: editorMode === 'html' ? htmlContent : undefined
      });

      alert('Message sent successfully!');
      onClose();
    } catch (error: any) {
      alert(`Failed to send message: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>
            {mode === 'reply' ? 'Reply' : mode === 'forward' ? 'Forward Message' : 'Compose Message'}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FontAwesomeIcon icon="times" />
          </CloseButton>
        </ModalHeader>

        <ModalContent>
          <FormSection>
            <FormRow>
              <Label htmlFor="to">To:</Label>
              <Input
                id="to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                required
              />
              <Button
                type="button"
                onClick={() => setShowCc(!showCc)}
                style={{ marginLeft: '0.5rem' }}
              >
                Cc
              </Button>
              <Button
                type="button"
                onClick={() => setShowBcc(!showBcc)}
                style={{ marginLeft: '0.5rem' }}
              >
                Bcc
              </Button>
            </FormRow>

            {showCc && (
              <FormRow>
                <Label htmlFor="cc">Cc:</Label>
                <Input
                  id="cc"
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                />
              </FormRow>
            )}

            {showBcc && (
              <FormRow>
                <Label htmlFor="bcc">Bcc:</Label>
                <Input
                  id="bcc"
                  type="email"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@example.com"
                />
              </FormRow>
            )}

            <FormRow>
              <Label htmlFor="subject">Subject:</Label>
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </FormRow>
          </FormSection>

          <EditorSection>
            <EditorToolbar>
              <ToolbarButton
                active={editorMode === 'text'}
                onClick={() => setEditorMode('text')}
              >
                Text
              </ToolbarButton>
              <ToolbarButton
                active={editorMode === 'html'}
                onClick={() => setEditorMode('html')}
              >
                HTML
              </ToolbarButton>
              
              {editorMode === 'html' && (
                <>
                  <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }} />
                  <ToolbarButton onClick={() => formatText('bold')} title="Bold">
                    <FontAwesomeIcon icon="bold" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => formatText('italic')} title="Italic">
                    <FontAwesomeIcon icon="italic" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => formatText('underline')} title="Underline">
                    <FontAwesomeIcon icon="underline" />
                  </ToolbarButton>
                  <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }} />
                  <ToolbarButton onClick={insertLink} title="Insert Link">
                    <FontAwesomeIcon icon="link" />
                  </ToolbarButton>
                  <ToolbarButton onClick={insertImage} title="Insert Image">
                    <FontAwesomeIcon icon="image" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => formatText('insertUnorderedList')} title="Bullet List">
                    <FontAwesomeIcon icon="list-ul" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => formatText('insertOrderedList')} title="Numbered List">
                    <FontAwesomeIcon icon="list-ol" />
                  </ToolbarButton>
                </>
              )}
              
              <div style={{ marginLeft: 'auto' }}>
                <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Attach Files">
                  <FontAwesomeIcon icon="paperclip" /> Attach
                </ToolbarButton>
              </div>
            </EditorToolbar>

            <EditorContainer>
              {editorMode === 'text' ? (
                <TextEditor
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Type your message here..."
                />
              ) : (
                <HtmlEditor
                  ref={htmlEditorRef}
                  contentEditable
                  onInput={handleHtmlContentChange}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                  suppressContentEditableWarning
                />
              )}
            </EditorContainer>
          </EditorSection>

          {attachments.length > 0 && (
            <AttachmentsSection>
              <Label>Attachments:</Label>
              <AttachmentList>
                {attachments.map((attachment) => (
                  <AttachmentItem key={attachment.id}>
                    <FontAwesomeIcon icon="paperclip" /> {attachment.file.name} ({Math.round(attachment.file.size / 1024)}KB)
                    <RemoveButton onClick={() => removeAttachment(attachment.id)}>
                      <FontAwesomeIcon icon="times" />
                    </RemoveButton>
                  </AttachmentItem>
                ))}
              </AttachmentList>
            </AttachmentsSection>
          )}
        </ModalContent>

        <ModalFooter>
          <div>
            <FileInput
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSend} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ComposeModal;