import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { emailAPI, EmailAccount, EmailFolder } from '../../services/api';

const SidebarContainer = styled.div`
  width: 280px;
  background-color: var(--sidebar-bg);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
`;

const AccountSelector = styled.div`
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
`;

const AccountButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: var(--sidebar-hover);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--sidebar-text);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background-color: var(--primary-color);
  }
`;

const AccountDropdown = styled.div<{ isOpen: boolean }>`
  position: relative;
  margin-top: 0.5rem;
  max-height: ${props => props.isOpen ? '200px' : '0'};
  overflow-y: auto;
  transition: max-height 0.3s ease;
  background-color: var(--surface-color);
  border-radius: var(--radius-md);
  border: ${props => props.isOpen ? '1px solid var(--border-color)' : 'none'};
`;

const AccountOption = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: none;
  border: none;
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: var(--radius-sm);

  &:hover {
    background-color: var(--border-color);
  }

  &:first-child {
    border-top-left-radius: var(--radius-md);
    border-top-right-radius: var(--radius-md);
  }

  &:last-child {
    border-bottom-left-radius: var(--radius-md);
    border-bottom-right-radius: var(--radius-md);
  }
`;

const FolderList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const FolderGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const FolderGroupTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const FolderItem = styled(Link)<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  color: var(--sidebar-text);
  text-decoration: none;
  border-radius: var(--radius-md);
  margin-bottom: 0.25rem;
  transition: all 0.2s ease;
  background-color: ${props => props.isActive ? 'var(--primary-color)' : 'transparent'};

  &:hover {
    background-color: ${props => props.isActive ? 'var(--primary-hover)' : 'var(--sidebar-hover)'};
  }
`;

const FolderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UnreadBadge = styled.span`
  background-color: var(--primary-color);
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  min-width: 1.25rem;
  text-align: center;
`;

const ComposeSection = styled.div`
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
`;

const ComposeButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--primary-hover);
  }
`;

interface SidebarProps {
  accounts: EmailAccount[];
  currentAccount: EmailAccount | null;
  onAccountSwitch: (account: EmailAccount) => void;
  onComposeClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ accounts, currentAccount, onAccountSwitch, onComposeClick }) => {
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const location = useLocation();

  useEffect(() => {
    if (currentAccount) {
      loadFolders(currentAccount.id);
    }
  }, [currentAccount]);

  const loadFolders = async (accountId: number) => {
    try {
      const foldersData = await emailAPI.getFolders(accountId);
      setFolders(foldersData);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const toggleAccountDropdown = () => {
    setIsAccountDropdownOpen(!isAccountDropdownOpen);
  };

  const handleAccountSelect = (account: EmailAccount) => {
    onAccountSwitch(account);
    setIsAccountDropdownOpen(false);
  };

  const getCurrentFolder = () => {
    const pathParts = location.pathname.split('/');
    return pathParts.includes('folder') ? pathParts[pathParts.indexOf('folder') + 1] : 'INBOX';
  };

  const currentFolder = getCurrentFolder();

  return (
    <SidebarContainer>
      <AccountSelector>
        <AccountButton onClick={toggleAccountDropdown}>
          <span>{currentAccount?.display_name || currentAccount?.email_address}</span>
          <span>{isAccountDropdownOpen ? '▲' : '▼'}</span>
        </AccountButton>
        
        <AccountDropdown isOpen={isAccountDropdownOpen}>
          {accounts.map((account) => (
            <AccountOption
              key={account.id}
              onClick={() => handleAccountSelect(account)}
            >
              {account.display_name || account.email_address}
              {account.is_primary && ' (Primary)'}
            </AccountOption>
          ))}
        </AccountDropdown>
      </AccountSelector>

      <ComposeSection>
        <ComposeButton onClick={onComposeClick}>
          <FontAwesomeIcon icon="pen-to-square" />
          Compose
        </ComposeButton>
      </ComposeSection>

      <FolderList>
        <FolderGroup>
          <FolderGroupTitle>Folders</FolderGroupTitle>
          {folders.map((folder) => (
            <FolderItem
              key={folder.name}
              to={folder.name === 'INBOX' ? '/dashboard' : `/dashboard/folder/${folder.name}`}
              isActive={currentFolder === folder.name}
            >
              <FolderInfo>
                <span>{folder.display_name}</span>
              </FolderInfo>
              {folder.unread_count > 0 && (
                <UnreadBadge>{folder.unread_count}</UnreadBadge>
              )}
            </FolderItem>
          ))}
        </FolderGroup>
      </FolderList>
    </SidebarContainer>
  );
};

export default Sidebar;