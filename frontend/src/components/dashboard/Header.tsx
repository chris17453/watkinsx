import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { EmailAccount } from '../../services/api';

const HeaderContainer = styled.header`
  height: 60px;
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  box-shadow: var(--shadow-sm);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const HeaderTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
`;

const AccountInfo = styled.div`
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ThemeSelector = styled.select`
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--surface-color);
  color: var(--text-primary);
  font-size: 0.875rem;
`;

const UserMenu = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--surface-color);
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
`;

const ActionButton = styled(Link)`
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--primary-hover);
  }
`;

const LogoutButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: var(--error-color);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
`;

interface HeaderProps {
  currentAccount: EmailAccount | null;
}

const Header: React.FC<HeaderProps> = ({ currentAccount }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme, availableThemes } = useTheme();

  const getUserInitials = () => {
    if (user?.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || 'U';
  };

  return (
    <HeaderContainer>
      <HeaderLeft>
        <HeaderTitle>Webmail</HeaderTitle>
        {currentAccount && (
          <AccountInfo>
            {currentAccount.display_name || currentAccount.email_address}
          </AccountInfo>
        )}
      </HeaderLeft>

      <HeaderRight>
        <ThemeSelector
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          {availableThemes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </ThemeSelector>


        <UserMenu>
          <UserButton>
            <Avatar>{getUserInitials()}</Avatar>
            <span>{user?.username}</span>
          </UserButton>
        </UserMenu>

        <ActionButton to="/dashboard/settings">
          Settings
        </ActionButton>

        {user?.is_admin && (
          <ActionButton to="/admin">
            Admin
          </ActionButton>
        )}

        <LogoutButton onClick={logout}>
          Logout
        </LogoutButton>
      </HeaderRight>
    </HeaderContainer>
  );
};

export default Header;