import React, { useState, useEffect, useMemo } from 'react';
import debounce from 'lodash.debounce';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search event by name',
  delay = 500,
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync local state if parent value changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Create a debounced version of the onChange prop
  const debouncedOnChange = useMemo(
    () => debounce((nextValue: string) => {
      onChange(nextValue);
    }, delay),
    [onChange, delay]
  );

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    debouncedOnChange.cancel();
    onChange('');
  };

  return (
    <div className="seamless-search-input-wrap">
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="seamless-search-input"
      />
      {localValue && (
        <button
          type="button"
          className="seamless-search-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="4" y1="4" x2="12" y2="12"></line>
            <line x1="12" y1="4" x2="4" y2="12"></line>
          </svg>
        </button>
      )}
    </div>
  );
};
