import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { adminAPI, Domain } from '../../services/adminAPI';

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

const DomainsTable = styled.div`
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--border-color);
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 0.875rem;
`;

const TableRow = styled.div<{ isActive: boolean }>`
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr 1fr 1fr;
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
  max-width: 600px;
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

interface DomainFormData {
  name: string;
  imap_server: string;
  imap_port: number;
  smtp_server: string;
  smtp_port: number;
  use_ssl: boolean;
}

const DomainsManager: React.FC = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<DomainFormData>({
    name: '',
    imap_server: '',
    imap_port: 993,
    smtp_server: '',
    smtp_port: 587,
    use_ssl: true
  });

  useEffect(() => {
    loadDomains();
  }, [searchQuery]);

  const loadDomains = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getDomains(searchQuery || undefined);
      setDomains(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (domainId: number) => {
    try {
      await adminAPI.toggleDomainStatus(domainId);
      await loadDomains();
    } catch (err: any) {
      alert('Failed to toggle domain status: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (domainId: number, domainName: string) => {
    if (window.confirm(`Are you sure you want to delete domain "${domainName}"? This action cannot be undone.`)) {
      try {
        await adminAPI.deleteDomain(domainId);
        await loadDomains();
      } catch (err: any) {
        alert('Failed to delete domain: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleAddDomain = () => {
    setEditingDomain(null);
    setFormData({
      name: '',
      imap_server: '',
      imap_port: 993,
      smtp_server: '',
      smtp_port: 587,
      use_ssl: true
    });
    setShowModal(true);
  };

  const handleEditDomain = (domain: Domain) => {
    setEditingDomain(domain);
    setFormData({
      name: domain.name,
      imap_server: domain.imap_server,
      imap_port: domain.imap_port,
      smtp_server: domain.smtp_server,
      smtp_port: domain.smtp_port,
      use_ssl: domain.use_ssl
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDomain(null);
    setSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingDomain) {
        await adminAPI.updateDomain(editingDomain.id, formData);
      } else {
        await adminAPI.createDomain(formData);
      }
      await loadDomains();
      handleCloseModal();
    } catch (err: any) {
      alert(`Failed to ${editingDomain ? 'update' : 'create'} domain: ` + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && domains.length === 0) {
    return <LoadingMessage>Loading domains...</LoadingMessage>;
  }

  if (error && domains.length === 0) {
    return <ErrorMessage>Error: {error}</ErrorMessage>;
  }

  return (
    <Container>
      <ToolBar>
        <SearchInput
          type="text"
          placeholder="Search domains..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <AddButton onClick={() => handleAddDomain()}>Add Domain</AddButton>
      </ToolBar>

      <DomainsTable>
        <TableHeader>
          <div>Domain Name</div>
          <div>IMAP Server</div>
          <div>IMAP Port</div>
          <div>SSL</div>
          <div>Status</div>
          <div>Actions</div>
        </TableHeader>

        {domains.map((domain) => (
          <TableRow key={domain.id} isActive={domain.is_active}>
            <div>{domain.name}</div>
            <div>{domain.imap_server}</div>
            <div>{domain.imap_port}</div>
            <div>{domain.use_ssl ? 'Yes' : 'No'}</div>
            <div>
              <StatusBadge isActive={domain.is_active}>
                {domain.is_active ? 'Active' : 'Inactive'}
              </StatusBadge>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <ActionButton onClick={() => handleEditDomain(domain)}>
                Edit
              </ActionButton>
              <ActionButton onClick={() => handleToggleStatus(domain.id)}>
                {domain.is_active ? 'Deactivate' : 'Activate'}
              </ActionButton>
              <ActionButton onClick={() => handleDelete(domain.id, domain.name)}>
                Delete
              </ActionButton>
            </div>
          </TableRow>
        ))}
      </DomainsTable>

      {domains.length === 0 && !loading && (
        <LoadingMessage>No domains found</LoadingMessage>
      )}

      {showModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>{editingDomain ? 'Edit Domain' : 'Add New Domain'}</h2>
              <CloseButton onClick={() => handleCloseModal()}>×</CloseButton>
            </ModalHeader>
            
            <ModalBody>
              <Form onSubmit={handleSubmit}>
                <FormSection>
                  <FormGroup>
                    <Label htmlFor="name">Domain Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="example.com"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </FormGroup>
                </FormSection>

                <FormSection>
                  <SectionTitle>IMAP Configuration</SectionTitle>
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="imap_server">IMAP Server *</Label>
                      <Input
                        id="imap_server"
                        type="text"
                        placeholder="imap.example.com"
                        value={formData.imap_server}
                        onChange={(e) => setFormData({ ...formData, imap_server: e.target.value })}
                        required
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor="imap_port">IMAP Port *</Label>
                      <Input
                        id="imap_port"
                        type="number"
                        value={formData.imap_port}
                        onChange={(e) => setFormData({ ...formData, imap_port: parseInt(e.target.value) || 993 })}
                        required
                      />
                    </FormGroup>
                  </FormRow>
                </FormSection>

                <FormSection>
                  <SectionTitle>SMTP Configuration</SectionTitle>
                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="smtp_server">SMTP Server *</Label>
                      <Input
                        id="smtp_server"
                        type="text"
                        placeholder="smtp.example.com"
                        value={formData.smtp_server}
                        onChange={(e) => setFormData({ ...formData, smtp_server: e.target.value })}
                        required
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label htmlFor="smtp_port">SMTP Port *</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        value={formData.smtp_port}
                        onChange={(e) => setFormData({ ...formData, smtp_port: parseInt(e.target.value) || 587 })}
                        required
                      />
                    </FormGroup>
                  </FormRow>
                </FormSection>

                <FormSection>
                  <CheckboxGroup>
                    <CheckboxInput
                      type="checkbox"
                      id="use_ssl"
                      checked={formData.use_ssl}
                      onChange={(e) => setFormData({ ...formData, use_ssl: e.target.checked })}
                    />
                    <CheckboxLabel htmlFor="use_ssl">Use SSL/TLS encryption</CheckboxLabel>
                  </CheckboxGroup>
                </FormSection>

                <ModalActions>
                  <CancelButton type="button" onClick={() => handleCloseModal()}>
                    Cancel
                  </CancelButton>
                  <SubmitButton type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : (editingDomain ? 'Update Domain' : 'Create Domain')}
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

export default DomainsManager;