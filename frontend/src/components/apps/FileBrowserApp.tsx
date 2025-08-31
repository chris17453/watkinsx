import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fileAPI, FileStorage, DirectoryListing, FileItem } from '../../services/api';

const FileBrowserContainer = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 280px;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SidebarSection = styled.div`
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
`;

const SectionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const AddStorageButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-bottom: 1rem;

  &:hover {
    background-color: var(--primary-hover);
  }
`;

const StorageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const StorageItem = styled.div<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: ${props => props.selected ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.selected ? 'white' : 'var(--sidebar-text)'};
  margin-bottom: 0.25rem;

  &:hover {
    background-color: ${props => props.selected ? 'var(--primary-hover)' : 'var(--sidebar-hover)'};
  }
`;

const StorageIcon = styled.div<{ type: string }>`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => {
    switch (props.type) {
      case 'SFTP': return '#3b82f6';
      case 'S3': return '#f59e0b';
      case 'FTP': return '#10b981';
      default: return 'var(--text-muted)';
    }
  }};
`;

const StorageInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const StorageName = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StorageHost = styled.div`
  font-size: 0.75rem;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SearchInput = styled.input`
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--surface-color);
  color: var(--text-primary);
  font-size: 0.875rem;
  width: 200px;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const ToolbarButton = styled.button`
  padding: 0.5rem;
  background-color: var(--surface-color);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--sidebar-hover);
  }
`;

const Breadcrumb = styled.div`
  padding: 1rem;
  background-color: var(--surface-color);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const BreadcrumbItem = styled.span<{ clickable?: boolean }>`
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  color: ${props => props.clickable ? 'var(--primary-color)' : 'var(--text-secondary)'};
  
  &:hover {
    text-decoration: ${props => props.clickable ? 'underline' : 'none'};
  }
`;

const FileArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background-color: var(--background-color);
`;

const FileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const FileCard = styled.div`
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
  }
`;

const FileIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin: 0 auto 0.75rem;
  color: var(--primary-color);
`;

const FileName = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
  word-break: break-word;
  margin-bottom: 0.5rem;
`;

const FileInfo = styled.div`
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
`;

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
`;

const Modal = styled.div`
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  width: 90%;
  max-width: 500px;
  max-height: 80%;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-md);
  
  &:hover {
    background-color: var(--sidebar-hover);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--background-color);
  color: var(--text-primary);
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--background-color);
  color: var(--text-primary);
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.variant === 'primary' ? `
    background-color: var(--primary-color);
    color: white;
    border: none;
    
    &:hover {
      background-color: var(--primary-hover);
    }
  ` : `
    background-color: var(--surface-color);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    
    &:hover {
      background-color: var(--sidebar-hover);
    }
  `}
`;

const WelcomeMessage = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-muted);
`;

const FileBrowserApp: React.FC = () => {
  const [storages, setStorages] = useState<FileStorage[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<FileStorage | null>(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [directoryListing, setDirectoryListing] = useState<DirectoryListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddStorage, setShowAddStorage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newStorage, setNewStorage] = useState({
    name: '',
    storage_type: 'SFTP',
    host: '',
    port: '',
    username: '',
    password: '',
    bucket_name: '',
    region: '',
    access_key: '',
    secret_key: '',
    base_path: '/'
  });

  useEffect(() => {
    loadStorages();
  }, []);

  useEffect(() => {
    if (selectedStorage) {
      loadDirectory(currentPath);
    }
  }, [selectedStorage, currentPath]);

  const loadStorages = async () => {
    try {
      const storagesData = await fileAPI.getStorages();
      setStorages(storagesData);
    } catch (error) {
      console.error('Failed to load storages:', error);
    }
  };

  const loadDirectory = async (path: string) => {
    if (!selectedStorage) return;
    
    try {
      setLoading(true);
      const listing = await fileAPI.browseDirectory(selectedStorage.id, path);
      setDirectoryListing(listing);
    } catch (error) {
      console.error('Failed to load directory:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStorage = async () => {
    try {
      setLoading(true);
      const storageData = {
        ...newStorage,
        port: newStorage.port ? parseInt(newStorage.port) : undefined
      };
      await fileAPI.createStorage(storageData);
      setShowAddStorage(false);
      setNewStorage({
        name: '',
        storage_type: 'SFTP',
        host: '',
        port: '',
        username: '',
        password: '',
        bucket_name: '',
        region: '',
        access_key: '',
        secret_key: '',
        base_path: '/'
      });
      await loadStorages();
    } catch (error) {
      console.error('Failed to create storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStorageClick = (storage: FileStorage) => {
    setSelectedStorage(storage);
    setCurrentPath(storage.base_path || '/');
  };

  const handleFileClick = (file: FileItem) => {
    if (file.is_directory) {
      setCurrentPath(file.path);
    } else {
      // Download file
      if (selectedStorage) {
        window.open(`/api/files/storages/${selectedStorage.id}/download?file_path=${encodeURIComponent(file.path)}`, '_blank');
      }
    }
  };

  const handleBreadcrumbClick = (path: string) => {
    setCurrentPath(path);
  };

  const handleSearch = async () => {
    if (!selectedStorage || !searchTerm.trim()) return;
    
    try {
      setLoading(true);
      const results = await fileAPI.searchFiles(selectedStorage.id, {
        search_term: searchTerm,
        path: currentPath,
        max_results: 100
      });
      
      // Convert search results to directory listing format
      setDirectoryListing({
        current_path: `Search: "${searchTerm}"`,
        parent_path: currentPath,
        items: results.items,
        total_files: results.items.filter((item: FileItem) => !item.is_directory).length,
        total_directories: results.items.filter((item: FileItem) => item.is_directory).length
      });
    } catch (error) {
      console.error('Failed to search files:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file: FileItem) => {
    if (file.is_directory) return 'folder';
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return 'image';
      case 'pdf':
        return 'file';
      case 'doc':
      case 'docx':
      case 'txt':
        return 'file-text';
      case 'zip':
      case 'rar':
      case '7z':
        return 'archive';
      default:
        return 'file';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const renderBreadcrumb = () => {
    if (!directoryListing) return null;
    
    const parts = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Root', path: '/' }];
    
    let currentBreadcrumbPath = '';
    parts.forEach(part => {
      currentBreadcrumbPath += `/${part}`;
      breadcrumbs.push({ name: part, path: currentBreadcrumbPath });
    });

    return (
      <Breadcrumb>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <FontAwesomeIcon icon="chevron-right" />}
            <BreadcrumbItem 
              clickable={index < breadcrumbs.length - 1}
              onClick={() => index < breadcrumbs.length - 1 && handleBreadcrumbClick(crumb.path)}
            >
              {crumb.name}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </Breadcrumb>
    );
  };

  return (
    <FileBrowserContainer>
      <Sidebar>
        <SidebarSection>
          <AddStorageButton onClick={() => setShowAddStorage(true)}>
            <FontAwesomeIcon icon="plus" />
            Add Storage
          </AddStorageButton>
          <SectionTitle>File Storages</SectionTitle>
        </SidebarSection>

        <StorageList>
          {storages.map((storage) => (
            <StorageItem
              key={storage.id}
              selected={selectedStorage?.id === storage.id}
              onClick={() => handleStorageClick(storage)}
            >
              <StorageIcon type={storage.storage_type}>
                <FontAwesomeIcon 
                  icon={storage.storage_type === 'S3' ? 'cloud' : 'server'} 
                />
              </StorageIcon>
              <StorageInfo>
                <StorageName>{storage.name}</StorageName>
                <StorageHost>{storage.host}</StorageHost>
              </StorageInfo>
            </StorageItem>
          ))}
        </StorageList>
      </Sidebar>
      
      <MainContent>
        <AppHeader>
          <AppTitle>
            <FontAwesomeIcon icon="folder" />
            {selectedStorage ? selectedStorage.name : 'File Browser'}
          </AppTitle>
          
          {selectedStorage && (
            <Toolbar>
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search files..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <ToolbarButton onClick={handleSearch}>
                <FontAwesomeIcon icon="search" />
              </ToolbarButton>
              <ToolbarButton onClick={() => loadDirectory(currentPath)}>
                <FontAwesomeIcon icon="refresh" />
              </ToolbarButton>
            </Toolbar>
          )}
        </AppHeader>
        
        {selectedStorage && renderBreadcrumb()}
        
        <FileArea>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <FontAwesomeIcon icon="spinner" spin size="2x" />
              <div style={{ marginTop: '1rem' }}>Loading...</div>
            </div>
          ) : directoryListing ? (
            <FileGrid>
              {directoryListing.parent_path && (
                <FileCard onClick={() => setCurrentPath(directoryListing.parent_path!)}>
                  <FileIcon>
                    <FontAwesomeIcon icon="arrow-left" size="2x" />
                  </FileIcon>
                  <FileName>..</FileName>
                  <FileInfo>Parent Directory</FileInfo>
                </FileCard>
              )}
              
              {directoryListing.items.map((file, index) => (
                <FileCard key={index} onClick={() => handleFileClick(file)}>
                  <FileIcon>
                    <FontAwesomeIcon icon={getFileIcon(file)} size="2x" />
                  </FileIcon>
                  <FileName>{file.name}</FileName>
                  <FileInfo>
                    {file.is_directory ? 'Directory' : formatFileSize(file.size)}
                    {file.modified && (
                      <div>{new Date(file.modified).toLocaleDateString()}</div>
                    )}
                  </FileInfo>
                </FileCard>
              ))}
            </FileGrid>
          ) : (
            <WelcomeMessage>
              <FontAwesomeIcon 
                icon="folder" 
                size="3x" 
                style={{ marginBottom: '1rem', opacity: 0.5 }}
              />
              <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                {storages.length === 0 ? 'No file storages configured' : 'Select a storage to browse files'}
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                {storages.length === 0 ? 'Add SFTP, S3, or FTP connections to get started' : 'Choose from your configured storages in the sidebar'}
              </div>
            </WelcomeMessage>
          )}
        </FileArea>
      </MainContent>

      {/* Add Storage Modal */}
      {showAddStorage && (
        <ModalOverlay onClick={() => setShowAddStorage(false)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Add File Storage</ModalTitle>
              <CloseButton onClick={() => setShowAddStorage(false)}>
                <FontAwesomeIcon icon="times" />
              </CloseButton>
            </ModalHeader>
            
            <FormGroup>
              <Label>Storage Name</Label>
              <Input
                value={newStorage.name}
                onChange={(e) => setNewStorage({...newStorage, name: e.target.value})}
                placeholder="My SFTP Server"
              />
            </FormGroup>

            <FormGroup>
              <Label>Storage Type</Label>
              <Select
                value={newStorage.storage_type}
                onChange={(e) => setNewStorage({...newStorage, storage_type: e.target.value})}
              >
                <option value="SFTP">SFTP</option>
                <option value="S3">Amazon S3</option>
                <option value="FTP">FTP</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Host</Label>
              <Input
                value={newStorage.host}
                onChange={(e) => setNewStorage({...newStorage, host: e.target.value})}
                placeholder={newStorage.storage_type === 'S3' ? 's3.amazonaws.com' : 'ftp.example.com'}
              />
            </FormGroup>

            {newStorage.storage_type !== 'S3' && (
              <FormGroup>
                <Label>Port</Label>
                <Input
                  type="number"
                  value={newStorage.port}
                  onChange={(e) => setNewStorage({...newStorage, port: e.target.value})}
                  placeholder={newStorage.storage_type === 'SFTP' ? '22' : '21'}
                />
              </FormGroup>
            )}

            <FormGroup>
              <Label>Username</Label>
              <Input
                value={newStorage.username}
                onChange={(e) => setNewStorage({...newStorage, username: e.target.value})}
                placeholder="username"
              />
            </FormGroup>

            <FormGroup>
              <Label>Password</Label>
              <Input
                type="password"
                value={newStorage.password}
                onChange={(e) => setNewStorage({...newStorage, password: e.target.value})}
                placeholder="password"
              />
            </FormGroup>

            {newStorage.storage_type === 'S3' && (
              <>
                <FormGroup>
                  <Label>Bucket Name</Label>
                  <Input
                    value={newStorage.bucket_name}
                    onChange={(e) => setNewStorage({...newStorage, bucket_name: e.target.value})}
                    placeholder="my-bucket"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Region</Label>
                  <Input
                    value={newStorage.region}
                    onChange={(e) => setNewStorage({...newStorage, region: e.target.value})}
                    placeholder="us-east-1"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Access Key</Label>
                  <Input
                    value={newStorage.access_key}
                    onChange={(e) => setNewStorage({...newStorage, access_key: e.target.value})}
                    placeholder="AKIA..."
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Secret Key</Label>
                  <Input
                    type="password"
                    value={newStorage.secret_key}
                    onChange={(e) => setNewStorage({...newStorage, secret_key: e.target.value})}
                    placeholder="secret key"
                  />
                </FormGroup>
              </>
            )}

            <FormGroup>
              <Label>Base Path</Label>
              <Input
                value={newStorage.base_path}
                onChange={(e) => setNewStorage({...newStorage, base_path: e.target.value})}
                placeholder="/"
              />
            </FormGroup>

            <ButtonGroup>
              <Button onClick={() => setShowAddStorage(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={createStorage} 
                disabled={!newStorage.name.trim() || !newStorage.host.trim() || loading}
              >
                {loading ? 'Creating...' : 'Create Storage'}
              </Button>
            </ButtonGroup>
          </Modal>
        </ModalOverlay>
      )}
    </FileBrowserContainer>
  );
};

export default FileBrowserApp;