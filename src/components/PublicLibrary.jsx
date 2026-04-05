import { useEffect, useState } from 'react';
import { ACTIONS } from '../reducers/appReducer.js';
import * as api from '../services/api.js';
import { formatCurrency, capitalizeFirst, getConditionColor, getTrustScoreColor } from '../utils/helpers.js';
import './PublicLibrary.css';

function PublicLibrary({ state, dispatch, navigateTo }) {
  const [categories, setCategories] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    condition: '',
    minValue: '',
    maxValue: '',
    sortBy: 'newest'
  });

  useEffect(() => {
    loadCategories();
    loadConditions();
    loadPublicItems();
  }, []);

  function loadCategories() {
    api.getCategories()
      .then(data => setCategories(data.categories))
      .catch(() => {});
  }

  function loadConditions() {
    api.getConditions()
      .then(data => setConditions(data.conditions))
      .catch(() => {});
  }

  function loadPublicItems() {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    api.getPublicItems(filters)
      .then(data => {
        dispatch({ type: ACTIONS.SET_PUBLIC_ITEMS, payload: data.items });
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      })
      .catch(err => {
        dispatch({ type: ACTIONS.SET_ERROR, payload: err.message || 'Failed to load items' });
      });
  }

  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }

  function handleSearch(e) {
    e.preventDefault();
    loadPublicItems();
  }

  function handleRequestBorrow(item) {
    navigateTo('borrow-request', { item });
  }

  return (
    <div className="public-library-page">
      <div className="page-header">
        <h1 className="page-title">Discover Items</h1>
        <p className="page-subtitle">Browse items available for borrowing in your community</p>
      </div>

      <form className="filters-section" onSubmit={handleSearch}>
        <div className="search-row">
          <div className="search-group">
            <label htmlFor="search-input" className="visually-hidden">Search</label>
            <input
              type="text"
              id="search-input"
              name="search"
              className="search-input"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search items..."
            />
          </div>
          <button type="submit" className="search-button">Search</button>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="category-filter" className="filter-label">Category</label>
            <select
              id="category-filter"
              name="category"
              className="filter-select"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{capitalizeFirst(cat)}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="condition-filter" className="filter-label">Condition</label>
            <select
              id="condition-filter"
              name="condition"
              className="filter-select"
              value={filters.condition}
              onChange={handleFilterChange}
            >
              <option value="">Any Condition</option>
              {conditions.map(cond => (
                <option key={cond} value={cond}>{capitalizeFirst(cond)}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sort-by" className="filter-label">Sort By</label>
            <select
              id="sort-by"
              name="sortBy"
              className="filter-select"
              value={filters.sortBy}
              onChange={handleFilterChange}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="value-high">Highest Value</option>
              <option value="value-low">Lowest Value</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </form>

      {state.publicItems.length === 0 ? (
        <div className="empty-state">
          <p className="empty-message">No items found matching your criteria.</p>
          <p className="empty-hint">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="items-grid">
          {state.publicItems.map(item => (
            <article key={item.id} className="library-item-card">
              <header className="item-header">
                <h3 className="item-name">{item.name}</h3>
                <span className={'item-condition ' + getConditionColor(item.condition)}>
                  {capitalizeFirst(item.condition)}
                </span>
              </header>

              <div className="item-category">
                <span className="category-tag">{capitalizeFirst(item.category)}</span>
              </div>

              {item.description && (
                <p className="item-description">{item.description}</p>
              )}

              <div className="item-value">
                <span className="value-label">Value:</span>
                <span className="value-amount">{formatCurrency(item.estimatedValue)}</span>
              </div>

              <div className="owner-info">
                <span className="owner-label">Owner:</span>
                <span className="owner-name">{item.owner?.displayName}</span>
                <span className={'owner-trust ' + getTrustScoreColor(item.owner?.trustScore || 50)}>
                  {item.owner?.trustScore || '?'}
                </span>
              </div>

              <div className="item-actions">
                <button
                  className="borrow-button"
                  onClick={() => handleRequestBorrow(item)}
                >
                  Request to Borrow
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default PublicLibrary;
