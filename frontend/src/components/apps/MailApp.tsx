import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Sidebar from '../dashboard/Sidebar';
import Header from '../dashboard/Header';
import EmailInterface from '../email/EmailInterface';
import ComposeModal from '../email/ComposeModal';
import Settings from '../settings/Settings';
import { EmailAccount } from '../../services/api';

const MailAppContainer = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
`;

const SidebarToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--surface-color);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 1rem;

  &:hover {
    background-color: var(--border-color);
  }
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
  z-index: 100;
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

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const AdminBanner = styled.div`
  background-color: #f59e0b;
  color: white;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  font-weight: 500;
`;

const ReturnButton = styled.button`
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

interface MailAppProps {
  accounts: EmailAccount[];
  currentAccount: EmailAccount | null;
  onAccountSwitch: (account: EmailAccount) => void;
  impersonationInfo: any;
  onReturnToAdmin: () => void;
}

const MailApp: React.FC<MailAppProps> = ({
  accounts,
  currentAccount,
  onAccountSwitch,
  impersonationInfo,
  onReturnToAdmin,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleComposeOpen = () => {
    setIsComposeOpen(true);
  };

  const handleComposeClose = () => {
    setIsComposeOpen(false);
  };

  return (
    <MailAppContainer>
      {!isSidebarCollapsed && (
        <Sidebar 
          accounts={accounts}
          currentAccount={currentAccount}
          onAccountSwitch={onAccountSwitch}
          onComposeClick={handleComposeOpen}
        />
      )}
      
      <MainContent>
        {impersonationInfo && (
          <AdminBanner>
            <span>
              <FontAwesomeIcon icon="cog" /> Admin Mode: Viewing inbox for {impersonationInfo.email} ({impersonationInfo.username})
            </span>
            <ReturnButton onClick={onReturnToAdmin}>
              Return to Admin Panel
            </ReturnButton>
          </AdminBanner>
        )}
        
        <AppHeader>
          <AppTitle>
            <SidebarToggle onClick={toggleSidebar}>
              <FontAwesomeIcon icon={isSidebarCollapsed ? "chevron-right" : "bars"} />
            </SidebarToggle>
            <FontAwesomeIcon icon="envelope" />
            WatkinsX Mail
          </AppTitle>
        </AppHeader>
        
        <Header currentAccount={currentAccount} />
        
        <ContentArea>
          <Routes>
            <Route 
              path="/" 
              element={
                <EmailInterface 
                  currentAccount={currentAccount}
                  folder="INBOX"
                />
              } 
            />
            <Route 
              path="/folder/:folder" 
              element={
                <EmailInterface 
                  currentAccount={currentAccount}
                />
              } 
            />
            <Route 
              path="/email/:messageId" 
              element={
                <EmailInterface 
                  currentAccount={currentAccount}
                />
              } 
            />
            <Route 
              path="/settings" 
              element={<Settings />} 
            />
          </Routes>
        </ContentArea>
      </MainContent>
      
      {isComposeOpen && (
        <ComposeModal
          currentAccount={currentAccount}
          onClose={handleComposeClose}
        />
      )}
    </MailAppContainer>
  );
};

export default MailApp;