import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { adminAPI } from '../../services/adminAPI';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
`;

const StatTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
`;

const StatSubtext = styled.div`
  font-size: 0.875rem;
  color: var(--text-muted);
`;

const StatBreakdown = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StatItemValue = styled.span`
  font-weight: 600;
  color: var(--text-primary);
`;

const StatItemLabel = styled.span`
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
`;

const LoadingCard = styled(StatCard)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: var(--text-muted);
`;

const ErrorCard = styled(StatCard)`
  border-color: var(--error-color);
  color: var(--error-color);
`;

interface SystemStatistics {
  domains: {
    total: number;
    active: number;
    inactive: number;
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    admins: number;
  };
  email_accounts: {
    total: number;
    active: number;
    inactive: number;
  };
}

const SystemStats: React.FC = () => {
  const [stats, setStats] = useState<SystemStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getSystemStatistics();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StatsGrid>
        <LoadingCard>Loading statistics...</LoadingCard>
      </StatsGrid>
    );
  }

  if (error) {
    return (
      <StatsGrid>
        <ErrorCard>
          <div>Error loading statistics</div>
          <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</div>
        </ErrorCard>
      </StatsGrid>
    );
  }

  if (!stats) return null;

  return (
    <StatsGrid>
      <StatCard>
        <StatTitle>Domains</StatTitle>
        <StatValue>{stats.domains.total}</StatValue>
        <StatSubtext>Total registered domains</StatSubtext>
        <StatBreakdown>
          <StatItem>
            <StatItemValue>{stats.domains.active}</StatItemValue>
            <StatItemLabel>Active</StatItemLabel>
          </StatItem>
          <StatItem>
            <StatItemValue>{stats.domains.inactive}</StatItemValue>
            <StatItemLabel>Inactive</StatItemLabel>
          </StatItem>
        </StatBreakdown>
      </StatCard>

      <StatCard>
        <StatTitle>Users</StatTitle>
        <StatValue>{stats.users.total}</StatValue>
        <StatSubtext>Total system users</StatSubtext>
        <StatBreakdown>
          <StatItem>
            <StatItemValue>{stats.users.active}</StatItemValue>
            <StatItemLabel>Active</StatItemLabel>
          </StatItem>
          <StatItem>
            <StatItemValue>{stats.users.admins}</StatItemValue>
            <StatItemLabel>Admins</StatItemLabel>
          </StatItem>
          <StatItem>
            <StatItemValue>{stats.users.inactive}</StatItemValue>
            <StatItemLabel>Inactive</StatItemLabel>
          </StatItem>
        </StatBreakdown>
      </StatCard>

      <StatCard>
        <StatTitle>Email Accounts</StatTitle>
        <StatValue>{stats.email_accounts.total}</StatValue>
        <StatSubtext>Configured email accounts</StatSubtext>
        <StatBreakdown>
          <StatItem>
            <StatItemValue>{stats.email_accounts.active}</StatItemValue>
            <StatItemLabel>Active</StatItemLabel>
          </StatItem>
          <StatItem>
            <StatItemValue>{stats.email_accounts.inactive}</StatItemValue>
            <StatItemLabel>Inactive</StatItemLabel>
          </StatItem>
        </StatBreakdown>
      </StatCard>
    </StatsGrid>
  );
};

export default SystemStats;