import React, { useState } from 'react';
import { Pagination } from './Pagination';

/**
 * Example usage of the Pagination component
 */
export const PaginationExample: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalPages = 15;

  const handlePageChange = async (page: number) => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setCurrentPage(page);
    setLoading(false);
    
    console.log(`Navigated to page ${page}`);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Pagination Component Examples</h2>
      
      {/* Basic pagination */}
      <section style={{ marginBottom: '3rem' }}>
        <h3>Basic Pagination</h3>
        <p>Current page: {currentPage} of {totalPages}</p>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </section>

      {/* Small page count */}
      <section style={{ marginBottom: '3rem' }}>
        <h3>Small Page Count (5 pages)</h3>
        <SmallPaginationExample />
      </section>

      {/* Large page count */}
      <section style={{ marginBottom: '3rem' }}>
        <h3>Large Page Count (50 pages)</h3>
        <LargePaginationExample />
      </section>

      {/* Single page (should not render) */}
      <section style={{ marginBottom: '3rem' }}>
        <h3>Single Page (should not render)</h3>
        <Pagination
          currentPage={1}
          totalPages={1}
          onPageChange={() => {}}
        />
        <p><em>No pagination should appear above this text.</em></p>
      </section>

      {/* Loading state */}
      <section style={{ marginBottom: '3rem' }}>
        <h3>Loading State</h3>
        <LoadingPaginationExample />
      </section>
    </div>
  );
};

const SmallPaginationExample: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(3);
  const totalPages = 5;

  return (
    <>
      <p>Current page: {currentPage} of {totalPages}</p>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
};

const LargePaginationExample: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(25);
  const totalPages = 50;

  return (
    <>
      <p>Current page: {currentPage} of {totalPages}</p>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
};

const LoadingPaginationExample: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const totalPages = 10;

  const handlePageChange = async (page: number) => {
    setLoading(true);
    
    // Simulate longer API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCurrentPage(page);
    setLoading(false);
  };

  const toggleLoading = () => {
    setLoading(!loading);
  };

  return (
    <>
      <p>Current page: {currentPage} of {totalPages}</p>
      <button 
        onClick={toggleLoading}
        style={{ 
          marginBottom: '1rem', 
          padding: '0.5rem 1rem',
          background: loading ? '#ef4444' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {loading ? 'Stop Loading' : 'Start Loading'}
      </button>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        loading={loading}
      />
    </>
  );
};

export default PaginationExample;