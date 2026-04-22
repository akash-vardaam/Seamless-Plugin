import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SearchInput } from './SearchInput';
import type { Category, Tag } from '../types/event';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  categories: Category[];
  selectedCategories: string[];
  onCategoryToggle: (value: string) => void;
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (value: string) => void;
  year: string;
  onYearChange: (value: string) => void;
  years: string[];
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  categories,
  selectedCategories,
  onCategoryToggle,
  tags,
  selectedTags,
  onTagToggle,
  year,
  onYearChange,
  years,
  onReset,
}) => {
  const [openPanel, setOpenPanel] = useState<'filters' | 'year' | 'sort' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const path = event.composedPath();
      if (containerRef.current && !path.includes(containerRef.current)) {
        setOpenPanel(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCategoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const sortLabel = useMemo(() => {
    if (status === 'upcoming') return 'Upcoming';
    if (status === 'current') return 'Current';
    if (status === 'past') return 'Past';
    return 'All';
  }, [status]);

  const selectedTagMap = useMemo(
    () => new Map(tags.map((tag) => [tag.id, tag])),
    [tags]
  );

  const activeFilterCount = selectedCategories.length + selectedTags.length + (year ? 1 : 0);

  const checkIcon = (
    <span className="seamless-filter-check-icon" aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3.5 8.5 6.5 11.5 12.5 4.5"></polyline>
      </svg>
    </span>
  );

  return (
    <div className="seamless-filter-shell" ref={containerRef}>
      <div className="seamless-filter-topbar">
        <div className="seamless-filter-search">
          <div className="seamless-filter-search-field">
            <span className="seamless-filter-search-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <SearchInput value={search} onChange={onSearchChange} placeholder="Search events..." />
          </div>
        </div>

        <div className="seamless-filter-actions">
          <div className="seamless-filter-menu-wrap">
            <button
              type="button"
              className={`seamless-filter-menu-button ${openPanel === 'year' ? 'is-open' : ''} ${year ? 'is-active' : ''}`}
              onClick={() => setOpenPanel((current) => current === 'year' ? null : 'year')}
              aria-expanded={openPanel === 'year'}
            >
              <span className="seamless-filter-button-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </span>
              <span>{year || 'All Years'}</span>
            </button>
            {openPanel === 'year' && (
              <div className="seamless-filter-menu seamless-filter-menu-year">
                <button
                  type="button"
                  className={`seamless-filter-menu-item ${!year ? 'is-selected' : ''}`}
                  onClick={() => {
                    onYearChange('');
                    setOpenPanel(null);
                  }}
                >
                  <span>All Years</span>
                  {!year && checkIcon}
                </button>
                {years.map((itemYear) => (
                  <button
                    key={itemYear}
                    type="button"
                    className={`seamless-filter-menu-item ${year === itemYear ? 'is-selected' : ''}`}
                    onClick={() => {
                      onYearChange(itemYear);
                      setOpenPanel(null);
                    }}
                  >
                    <span>{itemYear}</span>
                    {year === itemYear && checkIcon}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="seamless-filter-menu-wrap">
            <button
              type="button"
              className={`seamless-filter-menu-button ${openPanel === 'sort' ? 'is-open' : ''} ${status ? 'is-active' : ''}`}
              onClick={() => setOpenPanel((current) => current === 'sort' ? null : 'sort')}
              aria-expanded={openPanel === 'sort'}
            >
              <span className="seamless-filter-button-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </span>
              <span>{sortLabel}</span>
            </button>
            {openPanel === 'sort' && (
              <div className="seamless-filter-menu">
                {[
                  { value: '', label: 'All' },
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'current', label: 'Current' },
                  { value: 'past', label: 'Past' },
                ].map((option) => (
                  <button
                    key={option.value || 'all'}
                    type="button"
                    className={`seamless-filter-menu-item ${status === option.value ? 'is-selected' : ''}`}
                    onClick={() => {
                      onStatusChange(option.value);
                      setOpenPanel(null);
                    }}
                  >
                    <span>{option.label}</span>
                    {status === option.value && checkIcon}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="seamless-filter-menu-wrap">
            <button
              type="button"
              className={`seamless-filter-menu-button ${openPanel === 'filters' ? 'is-open' : ''} ${selectedCategories.length > 0 ? 'is-active' : ''}`}
              onClick={() => setOpenPanel((current) => current === 'filters' ? null : 'filters')}
              aria-expanded={openPanel === 'filters'}
            >
              <span className="seamless-filter-button-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6"></line>
                  <line x1="7" y1="12" x2="17" y2="12"></line>
                  <line x1="10" y1="18" x2="14" y2="18"></line>
                </svg>
              </span>
              <span>Filters</span>
              {activeFilterCount > 0 && <span className="seamless-filter-badge">{activeFilterCount}</span>}
            </button>
          </div>

          <button
            type="button"
            className="seamless-filter-reset"
            onClick={() => {
              setOpenPanel(null);
              onReset();
            }}
          >
            <span className="seamless-filter-button-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 -.49-5"></path>
              </svg>
            </span>
            <span>Reset</span>
            {activeFilterCount > 0 && <span className="seamless-filter-badge">{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      {openPanel === 'filters' && (
        <div className="seamless-filter-panel seamless-filter-panel-inline">
          <div className="seamless-filter-section-block">
            <div className="seamless-filter-panel-header">
              <span className="seamless-filter-section-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </span>
              <span>Category</span>
            </div>
            <div className="seamless-filter-options">
              {categories.length === 0 ? (
                <span className="seamless-filter-placeholder">No categories available</span>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`seamless-filter-option ${selectedCategories.includes(category.id) ? 'is-selected' : ''}`}
                    onClick={() => onCategoryToggle(category.id)}
                  >
                    <span>{category.name}</span>
                    {selectedCategories.includes(category.id) && checkIcon}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="seamless-filter-section-block">
            <div className="seamless-filter-panel-header">
              <span className="seamless-filter-section-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41 12 22l-10-10V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
              </span>
              <span>Tag</span>
            </div>
            <div className="seamless-filter-options">
              {tags.length === 0 ? (
                <span className="seamless-filter-placeholder">No tags available</span>
              ) : (
                tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`seamless-filter-option ${selectedTags.includes(tag.id) ? 'is-selected' : ''}`}
                    onClick={() => onTagToggle(tag.id)}
                  >
                    <span>{tag.name}</span>
                    {selectedTags.includes(tag.id) && checkIcon}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {(selectedCategories.length > 0 || selectedTags.length > 0) && (
        <div className="seamless-filter-chips">
          {selectedCategories.map((categoryId) => {
            const category = selectedCategoryMap.get(categoryId);
            if (!category) return null;

            return (
              <button
                key={categoryId}
                type="button"
                className="seamless-filter-chip"
                onClick={() => onCategoryToggle(categoryId)}
              >
                <span>{category.name}</span>
                <span className="seamless-filter-chip-close">x</span>
              </button>
            );
          })}
          {selectedTags.map((tagId) => {
            const tag = selectedTagMap.get(tagId);
            if (!tag) return null;

            return (
              <button
                key={tagId}
                type="button"
                className="seamless-filter-chip"
                onClick={() => onTagToggle(tagId)}
              >
                <span>{tag.name}</span>
                <span className="seamless-filter-chip-close">x</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
