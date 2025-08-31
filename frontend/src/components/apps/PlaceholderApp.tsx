import React from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

const AppContainer = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
`;

const AppSidebar = styled.div`
  width: 280px;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  padding: 1rem;
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

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-color);
`;

const ComingSoon = styled.div`
  text-align: center;
  color: var(--text-muted);
`;

interface PlaceholderAppProps {
  name: string;
  icon: IconProp;
  description: string;
  sidebarTitle?: string;
}

const PlaceholderApp: React.FC<PlaceholderAppProps> = ({ 
  name, 
  icon, 
  description, 
  sidebarTitle 
}) => {
  return (
    <AppContainer>
      <AppSidebar>
        <h3 style={{ color: 'var(--sidebar-text)', marginTop: 0 }}>
          {sidebarTitle || `${name} Navigation`}
        </h3>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Coming soon...
        </div>
      </AppSidebar>
      
      <MainContent>
        <AppHeader>
          <AppTitle>
            <FontAwesomeIcon icon={icon} />
            {name}
          </AppTitle>
        </AppHeader>
        
        <ContentArea>
          <ComingSoon>
            <FontAwesomeIcon 
              icon={icon} 
              size="3x" 
              style={{ marginBottom: '1rem', opacity: 0.5 }}
            />
            <div style={{ fontSize: '1.125rem' }}>{name} application coming soon...</div>
            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {description}
            </div>
          </ComingSoon>
        </ContentArea>
      </MainContent>
    </AppContainer>
  );
};

export default PlaceholderApp;