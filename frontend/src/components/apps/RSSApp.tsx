import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { rssAPI, RSSFeed, RSSEntry } from '../../services/api';

const RSSAppContainer = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
`;

const RSSSidebar = styled.div`
  width: 280px;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  padding: 1rem;
  overflow-y: auto;
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

const ContentArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background-color: var(--background-color);
`;

const FeedList = styled.div`
  margin-bottom: 2rem;
`;

const FeedSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const AddFeedButton = styled.button`
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

  &:hover {
    background-color: var(--primary-hover);
  }
`;

const FeedItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  margin-bottom: 0.25rem;
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--sidebar-hover);
  }
`;

const FeedInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FeedTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

const ArticleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ArticleCard = styled.div`
  background-color: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  transition: border-color 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: var(--primary-color);
  }
`;

const ArticleTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  line-height: 1.4;
`;

const ArticleDescription = styled.p`
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ArticleMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: var(--text-muted);
`;

const ComingSoon = styled.div`
  text-align: center;
  color: var(--text-muted);
  padding: 3rem;
`;

const RSSApp: React.FC = () => {
  const [selectedFeed, setSelectedFeed] = useState<number | null>(null);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [articles, setArticles] = useState<RSSEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState('');

  useEffect(() => {
    loadFeeds();
  }, []);

  useEffect(() => {
    if (selectedFeed) {
      loadFeedEntries(selectedFeed);
    }
  }, [selectedFeed]);

  const loadFeeds = async () => {
    try {
      setLoading(true);
      const feedsData = await rssAPI.getFeeds();
      setFeeds(feedsData);
    } catch (error) {
      console.error('Failed to load feeds:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedEntries = async (feedId: number) => {
    try {
      setLoading(true);
      const entries = await rssAPI.getFeedEntries(feedId);
      setArticles(entries);
    } catch (error) {
      console.error('Failed to load feed entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeed = async () => {
    if (!newFeedUrl.trim()) {
      setShowAddFeed(true);
      return;
    }

    try {
      setLoading(true);
      await rssAPI.createFeed({
        title: 'New Feed',
        url: newFeedUrl
      });
      setNewFeedUrl('');
      setShowAddFeed(false);
      await loadFeeds();
    } catch (error) {
      console.error('Failed to add feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedClick = async (feedId: number) => {
    setSelectedFeed(feedId);
    await loadFeedEntries(feedId);
  };

  const handleRefreshFeed = async (feedId: number) => {
    try {
      await rssAPI.refreshFeed(feedId);
      await loadFeedEntries(feedId);
    } catch (error) {
      console.error('Failed to refresh feed:', error);
    }
  };

  return (
    <RSSAppContainer>
      <RSSSidebar>
        <FeedSection>
          <SectionTitle>RSS Feeds</SectionTitle>
          <AddFeedButton onClick={handleAddFeed}>
            <FontAwesomeIcon icon="plus" />
            Add Feed
          </AddFeedButton>
        </FeedSection>

        {showAddFeed && (
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="url"
              value={newFeedUrl}
              onChange={(e) => setNewFeedUrl(e.target.value)}
              placeholder="Enter RSS feed URL..."
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '0.5rem'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleAddFeed}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  backgroundColor: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                Add
              </button>
              <button
                onClick={() => { setShowAddFeed(false); setNewFeedUrl(''); }}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'var(--surface-color)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <FeedList>
          {feeds.map((feed) => (
            <FeedItem
              key={feed.id}
              onClick={() => handleFeedClick(feed.id)}
            >
              <FeedInfo>
                <FeedTitle>{feed.title}</FeedTitle>
              </FeedInfo>
              {feed.unread_count > 0 && (
                <UnreadBadge>{feed.unread_count}</UnreadBadge>
              )}
            </FeedItem>
          ))}
        </FeedList>
      </RSSSidebar>
      
      <MainContent>
        <AppHeader>
          <AppTitle>
            <FontAwesomeIcon icon="rss" />
            RSS Feeds
          </AppTitle>
        </AppHeader>
        
        <ContentArea>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <FontAwesomeIcon icon="spinner" spin size="2x" />
              <div style={{ marginTop: '1rem' }}>Loading...</div>
            </div>
          ) : articles.length > 0 ? (
            <ArticleList>
              {articles.map((article) => (
                <ArticleCard 
                  key={article.id}
                  onClick={() => window.open(article.url, '_blank')}
                >
                  <ArticleTitle>{article.title}</ArticleTitle>
                  <ArticleDescription>{article.description}</ArticleDescription>
                  <ArticleMeta>
                    <span>{new Date(article.published).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{article.is_read ? 'Read' : 'Unread'}</span>
                  </ArticleMeta>
                </ArticleCard>
              ))}
            </ArticleList>
          ) : (
            <ComingSoon>
              <FontAwesomeIcon 
                icon="rss" 
                size="3x" 
                style={{ marginBottom: '1rem', opacity: 0.5 }}
              />
              <div style={{ fontSize: '1.125rem' }}>
                {feeds.length === 0 ? 'No RSS feeds added yet' : 'No articles in selected feed'}
              </div>
              <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {feeds.length === 0 ? 'Add some RSS feeds to get started' : 'This feed may be empty or still loading'}
              </div>
            </ComingSoon>
          )}
        </ContentArea>
      </MainContent>
    </RSSAppContainer>
  );
};

export default RSSApp;