import React, { useState, useCallback } from 'react';
import CreateCompany from './components/CreateCompany';
import OrderEntry from './components/OrderEntry';
import ResultTable from './components/ResultTable';
import { calculateSplit } from './services/api';

const SCREENS = {
  CREATE: 'CREATE',
  ORDERS: 'ORDERS',
  RESULT: 'RESULT',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.CREATE);
  const [companyData, setCompanyData] = useState(null);
  const [result, setResult] = useState(null);
  const [splitRequest, setSplitRequest] = useState(null);
  const [error, setError] = useState('');

  const handleCreate = useCallback((data) => {
    setCompanyData(data);
    setResult(null);
    setSplitRequest(null);
    setError('');
    setScreen(SCREENS.ORDERS);
  }, []);

  const handleSplit = useCallback(async (requestData) => {
    setSplitRequest(requestData);
    setError('');
    try {
      const res = await calculateSplit(requestData);
      setResult(res);
      setScreen(SCREENS.RESULT);
    } catch (err) {
      setError(err.message || 'Ошибка сервера');
    }
  }, []);

  const handleBackToOrders = useCallback(() => {
    setScreen(SCREENS.ORDERS);
    setResult(null);
  }, []);

  const handleBackToCreate = useCallback(() => {
    setScreen(SCREENS.CREATE);
    setCompanyData(null);
    setResult(null);
    setSplitRequest(null);
    setError('');
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>💸 Сплиттер счетов</h1>
        <p>С социальным давлением™</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      {screen === SCREENS.CREATE && (
        <CreateCompany onNext={handleCreate} />
      )}

      {screen === SCREENS.ORDERS && companyData && (
        <OrderEntry
          companyData={companyData}
          onBack={handleBackToCreate}
          onSplit={handleSplit}
        />
      )}

      {screen === SCREENS.RESULT && result && splitRequest && companyData && (
        <ResultTable
          result={result}
          companyData={companyData}
          participants={splitRequest.participants}
          onBack={handleBackToOrders}
        />
      )}
    </div>
  );
}