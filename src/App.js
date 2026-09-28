import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [activeForm, setActiveForm] = useState('search');
  const [colorSystem, setColorSystem] = useState('RAL COLOR');
  const [colorCode, setColorCode] = useState('7035');
  const [volume, setVolume] = useState(100);
  const [searchResult, setSearchResult] = useState(null);

  const handleSearch = () => {
    setSearchResult([
      { base: 'Gốc Trắng', percent: '70%', gram: (volume * 0.7).toFixed(1) },
      { base: 'Gốc Đen', percent: '20%', gram: (volume * 0.2).toFixed(1) },
      { base: 'Gốc Vàng', percent: '10%', gram: (volume * 0.1).toFixed(1) },
    ]);
  };

  const handleReset = () => {
    setColorCode('');
    setVolume(100);
    setSearchResult(null);
  };

  return (
    <div className="app-container">
      {/* HEADER LOGO */}
      <div className="app-header">
        <div style={{ fontWeight: 'bold', fontSize: '20px', color: '#1e293b' }}>
          🛡️ BUXDA FORMULAS
        </div>
        <button 
          className="btn btn-red" 
          style={{ width: 'auto', padding: '6px 16px' }}
          onClick={() => setActiveForm(activeForm === 'search' ? 'update' : 'search')}
        >
          {activeForm === 'search' ? 'UPDATE' : 'SEARCH'}
        </button>
      </div>

      {/* FORM TRA CỨU */}
      {activeForm === 'search' && (
        <>
          <div className="form-grid">
            <div className="form-card">
              <div className="form-title">HỆ THỐNG TRA CỨU CÔNG THỨC PHA SƠN</div>
              
              <div className="form-group">
                <label>COLOR SYSTEM:</label>
                <select 
                  className="form-control" 
                  value={colorSystem} 
                  onChange={(e) => setColorSystem(e.target.value)}
                >
                  <option value="RAL COLOR">RAL COLOR</option>
                  <option value="CUSTOM COLOR">CUSTOM COLOR</option>
                </select>
              </div>

              <div className="form-group">
                <label>COLOR CODE:</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={colorCode} 
                  onChange={(e) => setColorCode(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>VOLUME/GRAM:</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={volume} 
                  onChange={(e) => setVolume(e.target.value)} 
                />
              </div>

              <div className="btn-group">
                <button className="btn btn-green" onClick={handleSearch}>SEARCH</button>
                <button className="btn btn-yellow" onClick={handleReset}>RESET</button>
                <button className="btn btn-red" onClick={() => window.location.reload()}>EXIT</button>
              </div>
            </div>

            {/* KHUNG MÀU PREVIEW */}
            <div className="color-preview-card">
              <div className="form-title">DISPLAY COLORS</div>
              <div className="color-box" style={{ backgroundColor: '#d1d5db' }}></div>
            </div>
          </div>

          {/* KẾT QUẢ CÔNG THỨC */}
          {searchResult && (
            <div className="form-card" style={{ marginTop: '16px' }}>
              <h4 style={{ color: '#2563eb', marginBottom: '12px' }}>
                CÔNG THỨC CẦN PHA: {colorCode} ({colorSystem}) - Tổng khối lượng: {volume}g
              </h4>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Tinh màu (Gốc pha)</th>
                    <th>Tỷ lệ (%)</th>
                    <th>Khối lượng (Gram)</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResult.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.base}</td>
                      <td>{item.percent}</td>
                      <td><strong>{item.gram}g</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}