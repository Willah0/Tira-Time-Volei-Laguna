import React, { useState, useEffect } from 'react';

// FIX: The function signature uses React.Dispatch and React.SetStateAction, which requires 'React' to be imported.
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    // Fix: Added curly braces to the catch block. The original code was missing them,
    // which caused a syntax error and subsequent scope issues, leading to the reported errors.
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      // Fix: The logic to determine valueToStore was incorrect. The state variable `storedValue`
      // already holds the correct value to be stored.
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
