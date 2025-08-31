import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { adminAPI, User, Domain } from '../../services/adminAPI';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ToolBar = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const SearchInput = styled.input`
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--background-color);
  color: var(--text-primary);
  font-size: 0.875rem;
  flex: 1;
  max-width: 300px;
`;

const FilterSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--background-color);
  color: var(--text-primary);
  font-size: 0.875rem;
`;

const AddButton = styled.button`
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
`;

const UsersTable = styled.div`
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 2fr 1.5fr 1fr 0.8fr 0.8fr 1.5fr;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--border-color);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.875rem;
`;

const TableRow = styled.div<{ isActive: boolean }>`
  display: grid;
  grid-template-columns: 1.5fr 2fr 1.5fr 1fr 0.8fr 0.8fr 1.5fr;
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

const AdminBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  background-color: var(--warning-color);
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

const Modal = styled.div`
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

const ModalContent = styled.div`
  background-color: var(--surface-color);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);

  h2 {
    margin: 0;
    color: var(--text-primary);
    font-size: 1.25rem;
    font-weight: 600;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: var(--border-color);
    color: var(--text-primary);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  max-height: calc(90vh - 120px);
  overflow-y: auto;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SectionTitle = styled.h3`
  margin: 0;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--background-color);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &[type="number"] {
    -moz-appearance: textfield;
  }

  &[type="number"]::-webkit-outer-spin-button,
  &[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--background-color);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CheckboxInput = styled.input`
  width: 1rem;
  height: 1rem;
  accent-color: var(--primary-color);
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
`;

const SmallText = styled.small`
  color: var(--text-secondary);
  font-size: 0.75rem;
  margin-top: -0.25rem;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--border-color);
    color: var(--text-primary);
  }
`;

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: var(--primary-hover);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

interface UserFormData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  domain_id: number;
  is_admin: boolean;
  storage_quota_mb: number;
  email_quota_daily: number;
}

const UsersManager: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<number | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    full_name: '',
    domain_id: 0,
    is_admin: false,
    storage_quota_mb: 1000,
    email_quota_daily: 500
  });

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedDomain]);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await adminAPI.getUsers(selectedDomain, searchQuery || undefined);
      setUsers(userData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadDomains = async () => {
    try {
      const domainsData = await adminAPI.getDomains();
      setDomains(domainsData);
    } catch (err: any) {
      console.error('Failed to load domains:', err);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      await loadData();
    } catch (err: any) {
      alert('Failed to toggle user status: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (userId: number, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      try {
        await adminAPI.deleteUser(userId);
        await loadData();
      } catch (err: any) {
        alert('Failed to delete user: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleViewInbox = (user: User) => {
    // Store user info in session storage for impersonation
    sessionStorage.setItem('adminImpersonation', JSON.stringify({
      userId: user.id,
      username: user.username,
      email: user.email,
      domain_id: user.domain_id,
      returnToAdmin: true
    }));
    
    // Navigate to dashboard as this user
    navigate('/dashboard');
  };

  const getDomainName = (domainId: number) => {
    const domain = domains.find(d => d.id === domainId);
    return domain?.name || 'Unknown';
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      domain_id: domains.length > 0 ? domains[0].id : 0,
      is_admin: false,
      storage_quota_mb: 1000,
      email_quota_daily: 500
    });
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      domain_id: user.domain_id,
      is_admin: user.is_admin,
      storage_quota_mb: user.storage_quota_mb || 1000,
      email_quota_daily: user.email_quota_daily || 500
    });
    setShowModal(true);
  };

  const handleResetPassword = async (userId: number, username: string) => {
    const newPassword = prompt(`Enter new password for user "${username}"`);
    if (newPassword && newPassword.length >= 6) {
      try {
        await adminAPI.resetUserPassword(userId, newPassword);
        alert('Password reset successfully');
      } catch (err: any) {
        alert('Failed to reset password: ' + (err.response?.data?.detail || err.message));
      }
    } else if (newPassword) {
      alert('Password must be at least 6 characters long');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData: any = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        domain_id: formData.domain_id,
        is_admin: formData.is_admin,
        storage_quota_mb: formData.storage_quota_mb,
        email_quota_daily: formData.email_quota_daily
      };

      if (formData.password) {
        submitData.password = formData.password;
      }

      if (editingUser) {
        await adminAPI.updateUser(editingUser.id, submitData);
      } else {
        await adminAPI.createUser({ ...submitData, password: formData.password });
      }
      await loadData();
      handleCloseModal();
    } catch (err: any) {
      alert(`Failed to ${editingUser ? 'update' : 'create'} user: ` + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && users.length === 0) {
    return <LoadingMessage>Loading users...</LoadingMessage>;
  }

  if (error && users.length === 0) {
    return <ErrorMessage>Error: {error}</ErrorMessage>;
  }

  return (
    <Container>
      <ToolBar>
        <SearchInput
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <FilterSelect
          value={selectedDomain || ''}
          onChange={(e) => setSelectedDomain(e.target.value ? parseInt(e.target.value) : undefined)}
        >
          <option value="">All Domains</option>
          {domains.map((domain) => (
            <option key={domain.id} value={domain.id}>
              {domain.name}
            </option>
          ))}
        </FilterSelect>
        <AddButton onClick={() => handleAddUser()}>Add User</AddButton>
      </ToolBar>

      <UsersTable>
        <TableHeader>
          <div>Username</div>
          <div>Email</div>
          <div>Full Name</div>
          <div>Domain</div>
          <div>Admin</div>
          <div>Status</div>
          <div>Actions</div>
        </TableHeader>

        {users.map((user) => (
          <TableRow key={user.id} isActive={user.is_active}>
            <div>{user.username}</div>
            <div>{user.email}</div>
            <div>{user.full_name || '-'}</div>
            <div>{getDomainName(user.domain_id)}</div>
            <div>
              {user.is_admin && <AdminBadge>Admin</AdminBadge>}
            </div>
            <div>
              <StatusBadge isActive={user.is_active}>
                {user.is_active ? 'Active' : 'Inactive'}
              </StatusBadge>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <ActionButton onClick={() => handleViewInbox(user)}>
                📧 View Inbox
              </ActionButton>
              <ActionButton onClick={() => handleEditUser(user)}>
                Edit
              </ActionButton>
              <ActionButton onClick={() => handleResetPassword(user.id, user.username)}>
                Reset Password
              </ActionButton>
              <ActionButton onClick={() => handleToggleStatus(user.id)}>
                {user.is_active ? 'Deactivate' : 'Activate'}
              </ActionButton>
              <ActionButton onClick={() => handleDelete(user.id, user.username)}>
                Delete
              </ActionButton>
            </div>
          </TableRow>
        ))}
      </UsersTable>

      {users.length === 0 && !loading && (
        <LoadingMessage>No users found</LoadingMessage>
      )}

      {showModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <CloseButton onClick={() => handleCloseModal()}>×</CloseButton>
            </ModalHeader>
            
            <ModalBody>
              <Form onSubmit={handleSubmit}>
                <FormSection>
                  <SectionTitle>User Information</SectionTitle>
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="username">Username *</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="john.doe"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </FormGroup>
                  </FormRow>
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor="password">{editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingUser}
                      />
                    </FormGroup>
                  </FormRow>
                </FormSection>

                <FormSection>
                  <SectionTitle>Domain Assignment</SectionTitle>
                  <FormGroup>
                    <Label htmlFor="domain_id">Domain *</Label>
                    <Select
                      id="domain_id"
                      value={formData.domain_id}
                      onChange={(e) => setFormData({ ...formData, domain_id: parseInt(e.target.value) })}
                      required
                    >
                      <option value="">Select a domain</option>
                      {domains.map((domain) => (
                        <option key={domain.id} value={domain.id}>
                          {domain.name}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>
                </FormSection>

                <FormSection>
                  <SectionTitle>User Quotas</SectionTitle>
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="storage_quota_mb">Storage Quota (MB) *</Label>
                      <Input
                        id="storage_quota_mb"
                        type="number"
                        min="100"
                        max="50000"
                        value={formData.storage_quota_mb}
                        onChange={(e) => setFormData({ ...formData, storage_quota_mb: parseInt(e.target.value) || 1000 })}
                        required
                      />
                      <SmallText>Default: 1000 MB (1 GB)</SmallText>
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor="email_quota_daily">Daily Email Limit *</Label>
                      <Input
                        id="email_quota_daily"
                        type="number"
                        min="10"
                        max="5000"
                        value={formData.email_quota_daily}
                        onChange={(e) => setFormData({ ...formData, email_quota_daily: parseInt(e.target.value) || 500 })}
                        required
                      />
                      <SmallText>Default: 500 emails per day</SmallText>
                    </FormGroup>
                  </FormRow>
                </FormSection>

                <FormSection>
                  <CheckboxGroup>
                    <CheckboxInput
                      type="checkbox"
                      id="is_admin"
                      checked={formData.is_admin}
                      onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                    />
                    <CheckboxLabel htmlFor="is_admin">Grant administrator privileges</CheckboxLabel>
                  </CheckboxGroup>
                </FormSection>

                <ModalActions>
                  <CancelButton type="button" onClick={() => handleCloseModal()}>
                    Cancel
                  </CancelButton>
                  <SubmitButton type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                  </SubmitButton>
                </ModalActions>
              </Form>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default UsersManager;