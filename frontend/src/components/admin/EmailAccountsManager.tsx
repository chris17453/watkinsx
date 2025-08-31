import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { adminAPI } from '../../services/adminAPI';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const AccountsTable = styled.div`
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--border-color);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.875rem;
`;

const TableRow = styled.div<{ isActive: boolean }>`
  display: grid;
  grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  opacity: ${props => props.isActive ? 1 : 0.6};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: var(--background-color);
  }
`;

const StatusBadge = styled.span<{ isActive: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => props.isActive ? 'var(--success-color)' : 'var(--error-color)'};
  color: white;
`;

const PrimaryBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  background-color: var(--primary-color);
  color: white;
`;

const ActionButton = styled.button`
  padding: 0.25rem 0.5rem;
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  cursor: pointer;
  color: var(--text-primary);

  &:hover {
    background-color: var(--border-color);
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--error-color);
`;

interface EmailAccountWithDetails {
  id: number;
  email_address: string;
  display_name?: string;
  is_primary: boolean;
  is_active: boolean;
  user: {
    id: number;
    username: string;
    full_name?: string;
  };
  domain: {
    id: number;
    name: string;
  };
  created_at: string;
}

const EmailAccountsManager: React.FC = () => {
  const [accounts, setAccounts] = useState<EmailAccountWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getEmailAccounts();
      setAccounts(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load email accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (accountId: number, emailAddress: string) => {
    if (window.confirm(`Are you sure you want to delete email account "${emailAddress}"? This action cannot be undone.`)) {
      try {
        await adminAPI.deleteEmailAccount(accountId);
        await loadAccounts();
      } catch (err: any) {
        alert('Failed to delete email account: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  if (loading) {
    return <LoadingMessage>Loading email accounts...</LoadingMessage>;
  }

  if (error) {
    return <ErrorMessage>Error: {error}</ErrorMessage>;
  }

  return (
    <Container>
      <AccountsTable>
        <TableHeader>
          <div>Email Address</div>
          <div>User</div>
          <div>Domain</div>
          <div>Primary</div>
          <div>Status</div>
          <div>Actions</div>
        </TableHeader>

        {accounts.map((account) => (
          <TableRow key={account.id} isActive={account.is_active}>
            <div>
              {account.display_name ? (
                <>
                  <strong>{account.display_name}</strong>
                  <br />
                  <small>{account.email_address}</small>
                </>
              ) : (
                account.email_address
              )}
            </div>
            <div>
              <strong>{account.user.username}</strong>
              {account.user.full_name && (
                <>
                  <br />
                  <small>{account.user.full_name}</small>
                </>
              )}
            </div>
            <div>{account.domain.name}</div>
            <div>
              {account.is_primary && <PrimaryBadge>Primary</PrimaryBadge>}
            </div>
            <div>
              <StatusBadge isActive={account.is_active}>
                {account.is_active ? 'Active' : 'Inactive'}
              </StatusBadge>
            </div>
            <div>
              <ActionButton onClick={() => handleDelete(account.id, account.email_address)}>
                Delete
              </ActionButton>
            </div>
          </TableRow>
        ))}
      </AccountsTable>

      {accounts.length === 0 && !loading && (
        <LoadingMessage>No email accounts found</LoadingMessage>
      )}
    </Container>
  );
};

export default EmailAccountsManager;