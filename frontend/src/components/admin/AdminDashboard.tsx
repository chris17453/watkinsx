import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import DomainsManager from './DomainsManager';
import UsersManager from './UsersManager';
import SystemStats from './SystemStats';
import EmailAccountsManager from './EmailAccountsManager';

const AdminContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: var(--background-color);
`;

const AdminSidebar = styled.div`
  width: 250px;
  background-color: var(--sidebar-bg);
  color: var(--sidebar-text);
  padding: 1rem;
  border-right: 1px solid var(--border-color);
`;

const AdminContent = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
`;

const SidebarTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: var(--sidebar-text);
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li`
  margin-bottom: 0.5rem;
`;

const NavLink = styled(Link)<{ isActive: boolean }>`
  display: block;
  padding: 0.75rem 1rem;
  color: var(--sidebar-text);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  background-color: ${props => props.isActive ? 'var(--primary-color)' : 'transparent'};

  &:hover {
    background-color: ${props => props.isActive ? 'var(--primary-hover)' : 'var(--sidebar-hover)'};
  }
`;

const AdminHeader = styled.div`
  margin-bottom: 2rem;
`;

const AdminTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

const AdminSubtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1.125rem;
`;

const AccessDenied = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  color: var(--text-secondary);
`;

interface AdminDashboardProps {}

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user?.is_admin) {
    return (
      <AccessDenied>
        <h1>Access Denied</h1>
        <p>You need administrator privileges to access this area.</p>
        <Link to="/dashboard" style={{ marginTop: '1rem', color: 'var(--primary-color)' }}>
          Return to Dashboard
        </Link>
      </AccessDenied>
    );
  }

  const navItems = [
    { path: '/admin', label: 'Overview', exact: true },
    { path: '/admin/domains', label: 'Domains' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/email-accounts', label: 'Email Accounts' },
  ];

  const isActiveRoute = (path: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <AdminContainer>
      <AdminSidebar>
        <SidebarTitle>Administration</SidebarTitle>
        <NavList>
          {navItems.map((item) => (
            <NavItem key={item.path}>
              <NavLink
                to={item.path}
                isActive={isActiveRoute(item.path, item.exact)}
              >
                {item.label}
              </NavLink>
            </NavItem>
          ))}
        </NavList>
      </AdminSidebar>

      <AdminContent>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <AdminHeader>
                  <AdminTitle>System Overview</AdminTitle>
                  <AdminSubtitle>Webmail Platform Administration</AdminSubtitle>
                </AdminHeader>
                <SystemStats />
              </>
            }
          />
          <Route
            path="/domains"
            element={
              <>
                <AdminHeader>
                  <AdminTitle>Domain Management</AdminTitle>
                  <AdminSubtitle>Manage email domains and their configurations</AdminSubtitle>
                </AdminHeader>
                <DomainsManager />
              </>
            }
          />
          <Route
            path="/users"
            element={
              <>
                <AdminHeader>
                  <AdminTitle>User Management</AdminTitle>
                  <AdminSubtitle>Manage users across all domains</AdminSubtitle>
                </AdminHeader>
                <UsersManager />
              </>
            }
          />
          <Route
            path="/email-accounts"
            element={
              <>
                <AdminHeader>
                  <AdminTitle>Email Account Management</AdminTitle>
                  <AdminSubtitle>Overview of all email accounts in the system</AdminSubtitle>
                </AdminHeader>
                <EmailAccountsManager />
              </>
            }
          />
        </Routes>
      </AdminContent>
    </AdminContainer>
  );
};

export default AdminDashboard;