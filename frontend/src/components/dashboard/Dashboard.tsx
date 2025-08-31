import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MailApp from '../apps/MailApp';
import ChatApp from '../apps/ChatApp';
import RSSApp from '../apps/RSSApp';
import FileBrowserApp from '../apps/FileBrowserApp';
import PlaceholderApp from '../apps/PlaceholderApp';
import { emailAPI, EmailAccount } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';

const AppContainer = styled.div`
  height: 100vh;
  display: flex;
  background-color: var(--background-color);
`;

const AppNavigation = styled.div`
  width: 80px;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  z-index: 100;
`;

const AppNavItem = styled.button<{ active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.5rem;
  border: none;
  background-color: ${props => props.active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--sidebar-text)'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  margin: 0.25rem 0.5rem;

  &:hover {
    background-color: ${props => props.active ? 'var(--primary-hover)' : 'var(--sidebar-hover)'};
  }

  .icon {
    font-size: 1.25rem;
  }
`;

const AppContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<EmailAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonationInfo, setImpersonationInfo] = useState<any>(null);
  const [currentApp, setCurrentApp] = useState('mail');

  useEffect(() => {
    // Check for admin impersonation
    const impersonationData = sessionStorage.getItem('adminImpersonation');
    if (impersonationData) {
      setImpersonationInfo(JSON.parse(impersonationData));
    }
    
    loadEmailAccounts();
  }, []);

  const loadEmailAccounts = async () => {
    try {
      const accountsData = await emailAPI.getAccounts();
      setAccounts(accountsData);
      
      // Set primary account as current, or first account if no primary
      const primaryAccount = accountsData.find(acc => acc.is_primary) || accountsData[0];
      if (primaryAccount) {
        setCurrentAccount(primaryAccount);
      }
    } catch (error) {
      console.error('Failed to load email accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountSwitch = (account: EmailAccount) => {
    setCurrentAccount(account);
  };

  const handleReturnToAdmin = () => {
    sessionStorage.removeItem('adminImpersonation');
    navigate('/admin');
  };

  const handleAppSwitch = (app: string) => {
    setCurrentApp(app);
  };

  const apps = [
    { id: 'mail', name: 'Mail', icon: 'envelope' },
    { id: 'chat', name: 'Chat', icon: 'comments' },
    { id: 'files', name: 'Files', icon: 'folder' },
    { id: 'docs', name: 'Documents', icon: 'file-text' },
    { id: 'sheets', name: 'Sheets', icon: 'table' },
    { id: 'search', name: 'Search', icon: 'search' },
    { id: 'terminal', name: 'Terminal', icon: 'terminal' },
    { id: 'rss', name: 'RSS Feeds', icon: 'rss' },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const renderCurrentApp = () => {
    switch (currentApp) {
      case 'mail':
        return (
          <MailApp
            accounts={accounts}
            currentAccount={currentAccount}
            onAccountSwitch={handleAccountSwitch}
            impersonationInfo={impersonationInfo}
            onReturnToAdmin={handleReturnToAdmin}
          />
        );
      case 'chat':
        return <ChatApp />;
      case 'files':
        return <FileBrowserApp />;
      case 'docs':
        return (
          <PlaceholderApp
            name="Documents"
            icon="file-text"
            description="Document creation, editing, and collaboration"
            sidebarTitle="Document Library"
          />
        );
      case 'sheets':
        return (
          <PlaceholderApp
            name="Sheets"
            icon="table"
            description="Spreadsheet creation, analysis, and data visualization"
            sidebarTitle="Spreadsheet Library"
          />
        );
      case 'search':
        return (
          <PlaceholderApp
            name="Search"
            icon="search"
            description="Universal search across all apps and data"
            sidebarTitle="Search Results"
          />
        );
      case 'terminal':
        return (
          <PlaceholderApp
            name="Terminal"
            icon="terminal"
            description="Remote console access and server management"
            sidebarTitle="Connection Manager"
          />
        );
      case 'rss':
        return <RSSApp />;
      default:
        return null;
    }
  };

  return (
    <AppContainer>
      <AppNavigation>
        {apps.map((app) => (
          <AppNavItem
            key={app.id}
            active={currentApp === app.id}
            onClick={() => handleAppSwitch(app.id)}
            title={app.name}
          >
            <FontAwesomeIcon icon={app.icon as any} className="icon" />
            <span>{app.name}</span>
          </AppNavItem>
        ))}
      </AppNavigation>

      <AppContent>
        {renderCurrentApp()}
      </AppContent>
    </AppContainer>
  );
};

export default Dashboard;