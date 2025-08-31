import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { userAPI, EmailAccount } from '../../services/api';

const SettingsContainer = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background-color: var(--background-color);
`;

const SettingsTitle = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2rem;
`;

const SettingsSection = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--background-color);
  color: var(--text-primary);
  font-size: 0.875rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--background-color);
  color: var(--text-primary);
  font-size: 0.875rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--primary-hover);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: var(--secondary-color);
  color: var(--text-primary);

  &:hover {
    background-color: var(--border-color);
  }
`;

const DangerButton = styled(Button)`
  background-color: var(--error-color);

  &:hover {
    background-color: #dc2626;
  }
`;

const AccountList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AccountItem = styled.div`
  padding: 1rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--background-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AccountInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const AccountEmail = styled.div`
  font-weight: 500;
  color: var(--text-primary);
`;

const AccountMeta = styled.div`
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const AccountActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SmallButton = styled.button`
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--border-color);
  }
`;

const PrimaryBadge = styled.span`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  background-color: var(--primary-color);
  color: white;
  border-radius: var(--radius-sm);
  font-weight: 500;
`;

const Modal = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: var(--surface-color);
  padding: 2rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
`;

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { theme, setTheme, availableThemes } = useTheme();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    email_address: '',
    display_name: '',
    imap_username: '',
    imap_password: '',
    domain_id: user?.domain_id || 1
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const accountsData = await userAPI.getMyAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userAPI.createEmailAccount(newAccount);
      setIsAddAccountModalOpen(false);
      setNewAccount({
        email_address: '',
        display_name: '',
        imap_username: '',
        imap_password: '',
        domain_id: user?.domain_id || 1
      });
      loadAccounts();
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  const handleSetPrimary = async (accountId: number) => {
    try {
      await userAPI.setPrimaryAccount(accountId);
      loadAccounts();
    } catch (error) {
      console.error('Failed to set primary account:', error);
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (window.confirm('Are you sure you want to delete this email account?')) {
      try {
        await userAPI.deleteEmailAccount(accountId);
        loadAccounts();
      } catch (error) {
        console.error('Failed to delete account:', error);
      }
    }
  };

  return (
    <SettingsContainer>
      <SettingsTitle>Settings</SettingsTitle>

      <SettingsSection>
        <SectionTitle>Appearance</SectionTitle>
        <FormGroup>
          <Label htmlFor="theme">Theme</Label>
          <Select
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            {availableThemes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FormGroup>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Email Accounts</SectionTitle>
        
        <AccountList>
          {accounts.map((account) => (
            <AccountItem key={account.id}>
              <AccountInfo>
                <AccountEmail>
                  {account.display_name || account.email_address}
                  {account.is_primary && <PrimaryBadge>Primary</PrimaryBadge>}
                </AccountEmail>
                <AccountMeta>{account.email_address}</AccountMeta>
              </AccountInfo>
              
              <AccountActions>
                {!account.is_primary && (
                  <SmallButton onClick={() => handleSetPrimary(account.id)}>
                    Set Primary
                  </SmallButton>
                )}
                <SmallButton onClick={() => handleDeleteAccount(account.id)}>
                  Delete
                </SmallButton>
              </AccountActions>
            </AccountItem>
          ))}
        </AccountList>

        <div style={{ marginTop: '1rem' }}>
          <Button onClick={() => setIsAddAccountModalOpen(true)}>
            Add Email Account
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>User Information</SectionTitle>
        <FormGroup>
          <Label>Username</Label>
          <Input value={user?.username || ''} disabled />
        </FormGroup>
        <FormGroup>
          <Label>Email</Label>
          <Input value={user?.email || ''} disabled />
        </FormGroup>
        <FormGroup>
          <Label>Full Name</Label>
          <Input value={user?.full_name || ''} disabled />
        </FormGroup>
      </SettingsSection>

      <Modal isOpen={isAddAccountModalOpen}>
        <ModalContent>
          <ModalTitle>Add Email Account</ModalTitle>
          <form onSubmit={handleCreateAccount}>
            <FormGroup>
              <Label htmlFor="email_address">Email Address</Label>
              <Input
                id="email_address"
                type="email"
                value={newAccount.email_address}
                onChange={(e) => setNewAccount(prev => ({ ...prev, email_address: e.target.value }))}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="display_name">Display Name (Optional)</Label>
              <Input
                id="display_name"
                type="text"
                value={newAccount.display_name}
                onChange={(e) => setNewAccount(prev => ({ ...prev, display_name: e.target.value }))}
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="imap_username">IMAP Username</Label>
              <Input
                id="imap_username"
                type="text"
                value={newAccount.imap_username}
                onChange={(e) => setNewAccount(prev => ({ ...prev, imap_username: e.target.value }))}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="imap_password">IMAP Password</Label>
              <Input
                id="imap_password"
                type="password"
                value={newAccount.imap_password}
                onChange={(e) => setNewAccount(prev => ({ ...prev, imap_password: e.target.value }))}
                required
              />
            </FormGroup>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <Button type="submit">Add Account</Button>
              <SecondaryButton 
                type="button" 
                onClick={() => setIsAddAccountModalOpen(false)}
              >
                Cancel
              </SecondaryButton>
            </div>
          </form>
        </ModalContent>
      </Modal>
    </SettingsContainer>
  );
};

export default Settings;