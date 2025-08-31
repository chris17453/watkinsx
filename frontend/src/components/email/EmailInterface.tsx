import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import EmailList from './EmailList';
import EmailView from './EmailView';
import Resizer from '../ui/Resizer';
import { EmailMessage, EmailAccount } from '../../services/api';

const InterfaceContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--surface-color);
`;

const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const LayoutButton = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background-color: ${props => props.active ? 'var(--primary-color)' : 'var(--surface-color)'};
  color: ${props => props.active ? 'white' : 'var(--text-primary)'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.active ? 'var(--primary-hover)' : 'var(--border-color)'};
  }
`;

const ContentContainer = styled.div<{ layout: string }>`
  flex: 1;
  display: flex;
  overflow: hidden;
  height: 100%;
  
  ${props => props.layout === 'vertical' ? 'flex-direction: column;' : 'flex-direction: row;'}
`;

const EmailListPanel = styled.div<{ size: number, layout: string }>`
  ${props => props.layout === 'vertical' ? `
    height: ${props.size}px;
    min-height: 200px;
    max-height: calc(100% - 200px);
  ` : `
    width: ${props.size}px;
    min-width: 200px;
    max-width: calc(100% - 200px);
  `}
  overflow: hidden;
  background-color: var(--surface-color);
`;

const EmailViewPanel = styled.div`
  flex: 1;
  overflow: hidden;
  background-color: var(--background-color);
`;

const NoSelectionPane = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-color);
  color: var(--text-muted);
  font-size: 1.125rem;
`;

type LayoutType = 'horizontal' | 'vertical';

interface EmailInterfaceProps {
  currentAccount: EmailAccount | null;
  folder?: string;
}

const EmailInterface: React.FC<EmailInterfaceProps> = ({ currentAccount, folder }) => {
  const { messageId } = useParams<{ messageId: string }>();
  const [layout, setLayout] = useState<LayoutType>('horizontal');
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  
  // Panel sizing state
  const [horizontalPanelSize, setHorizontalPanelSize] = useState(350);
  const [verticalPanelSize, setVerticalPanelSize] = useState(300);

  // Load layout and panel size preferences from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('email-layout') as LayoutType;
    if (savedLayout && ['horizontal', 'vertical'].includes(savedLayout)) {
      setLayout(savedLayout);
    }
    
    const savedHorizontalSize = localStorage.getItem('email-horizontal-panel-size');
    if (savedHorizontalSize) {
      setHorizontalPanelSize(parseInt(savedHorizontalSize, 10));
    }
    
    const savedVerticalSize = localStorage.getItem('email-vertical-panel-size');
    if (savedVerticalSize) {
      setVerticalPanelSize(parseInt(savedVerticalSize, 10));
    }
  }, []);

  const handleLayoutChange = (newLayout: LayoutType) => {
    setLayout(newLayout);
    localStorage.setItem('email-layout', newLayout);
  };


  const handleMessageSelect = (message: EmailMessage) => {
    setSelectedMessage(message);
  };

  const handleBackFromPreview = () => {
    setSelectedMessage(null);
  };
  
  const handleHorizontalResize = (delta: number) => {
    const newSize = Math.max(200, Math.min(window.innerWidth - 200, horizontalPanelSize + delta));
    setHorizontalPanelSize(newSize);
    localStorage.setItem('email-horizontal-panel-size', newSize.toString());
  };
  
  const handleVerticalResize = (delta: number) => {
    const newSize = Math.max(200, Math.min(window.innerHeight - 300, verticalPanelSize + delta));
    setVerticalPanelSize(newSize);
    localStorage.setItem('email-vertical-panel-size', newSize.toString());
  };

  return (
    <InterfaceContainer>
      <ToolbarContainer>
        <ToolbarRight>
          <LayoutButton
            active={layout === 'horizontal'}
            onClick={() => handleLayoutChange('horizontal')}
            title="Horizontal Layout (Right Preview)"
          >
            <FontAwesomeIcon icon="grip-vertical" />
          </LayoutButton>
          <LayoutButton
            active={layout === 'vertical'}
            onClick={() => handleLayoutChange('vertical')}
            title="Vertical Layout (Bottom Preview)"
          >
            <FontAwesomeIcon icon="grip-horizontal" />
          </LayoutButton>
        </ToolbarRight>
      </ToolbarContainer>

      <ContentContainer layout={layout}>
        <EmailListPanel 
          size={layout === 'vertical' ? verticalPanelSize : horizontalPanelSize} 
          layout={layout}
        >
          <EmailList 
            currentAccount={currentAccount}
            folder={folder}
            onMessageSelect={handleMessageSelect}
            selectedMessageId={selectedMessage?.id}
          />
        </EmailListPanel>
        
        <Resizer 
          orientation={layout === 'vertical' ? 'vertical' : 'horizontal'}
          onResize={layout === 'vertical' ? handleVerticalResize : handleHorizontalResize}
        />
        
        <EmailViewPanel>
          {selectedMessage || messageId ? (
            <EmailView 
              currentAccount={currentAccount}
              message={selectedMessage}
              messageId={messageId}
              onBack={selectedMessage ? handleBackFromPreview : undefined}
            />
          ) : (
            <NoSelectionPane>
              Select an email to read
            </NoSelectionPane>
          )}
        </EmailViewPanel>
      </ContentContainer>

    </InterfaceContainer>
  );
};

export default EmailInterface;