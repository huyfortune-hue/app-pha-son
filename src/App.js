import React, { useState } from 'react';
import './App.css';
import logoBuxda from './logo-buxda.png';

export default function App() {
  // Mặc định là 'search'
  const [activeForm, setActiveForm] = useState('search');
  
  // State Form SEARCH
  const [colorSystem, setColorSystem] = useState('RAL COLOR');
  const [colorCode, setColorCode] = useState('7035');
  const [volume, setVolume] = useState(100);
  const [searchResult, setSearchResult] = useState(null);

  // State Form UPDATE
  const [updateSystem, setUpdateSystem] = useState('RAL COLOR');
  const [updateCode, setUpdateCode] = useState('');
  const [updateName, setUpdateName] = useState('');
  const [updateFormula, setUpdateFormula] = useState('');

  const handleSearch = () => {
    setSearchResult([
      { base: 'Gốc Trắng', percent: '70%', gram: (volume * 0.7).toFixed(1) },
      { base: 'Gốc Đen', percent: '20%', gram: (volume * 0.2).toFixed(1) },
      { base: 'Gốc Vàng', percent: '10%', gram: (volume * 0.1).toFixed(1) },
    ]);
  };

  const handleResetSearch = () => {
    setColorCode('');
    setVolume(100);
    setSearchResult(null);
  };

  const handleSaveUpdate = (e) => {
    e.preventDefault();
    alert(`Đã lưu công thức mới cho mã: ${updateCode}`);
    setUpdateCode('');
    setUpdateName('');
    setUpdateFormula('');
    setActiveForm('search');
  };

  return (
    <div className="app-container">
      {/* HEADER LOGO & NÚT CHUYỂN TRẠNG THÁI */}
      <div className="app-header">
        <div className="brand-logo-container">
          <img src={logoBuxda} alt="BUXDA" className="app-logo-img" />
        </div>

        {/* Nút bấm hiển thị chính xác trạng thái cần chuyển */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button"
            className={activeForm === 'search' ? 'btn-header active' : 'btn-header'}
            onClick={() => setActiveForm('search')}
          >
            TRA CỨU
          </button>
          <button 
            type="button"
            className={activeForm === 'update' ? 'btn-header active-red' : 'btn-header btn-red-bg'}
            onClick={() => setActiveForm('update')}
          >
            UPDATE
          </button>
        </div>
      </div>

      {/* NO 1: GIAO DIỆN CẬP NHẬT (UPDATE) */}
      {activeForm === 'update' && (
        <div className="form-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="form-title">CẬP NHẬT / THÊM CÔNG THỨC MỚI</div>
          
          <form onSubmit={handleSaveUpdate}>
            <div className="form-group">
              <label>COLOR SYSTEM:</label>
              <select 
                className="form-control"
                value={updateSystem}
                onChange={(e) => setUpdateSystem(e.target.value)}
              >
                <option value="RAL COLOR">RAL COLOR</option>
                <option value="CUSTOM COLOR">CUSTOM COLOR</option>
              </select>
            </div>

            <div className="form-group">
              <label>MÃ MÀU (COLOR CODE):</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="VD: RAL 7035" 
                value={updateCode}
                onChange={(e) => setUpdateCode(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>TÊN MÀU (COLOR NAME):</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="VD: Xám sáng" 
                value={updateName}
                onChange={(e) => setUpdateName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>CÔNG THỨC PHA (FORMULA):</label>
              <textarea 
                className="form-control" 
                rows="4" 
                placeholder="VD: Gốc trắng 70%, Gốc đen 20%, Gốc vàng 10%"
                value={updateFormula}
                onChange={(e) => setUpdateFormula(e.target.value)}
                style={{ resize: 'vertical' }}
                required
              ></textarea>
            </div>

            <div className="btn-group">
              <button type="submit" className="btn btn-green">LƯU CÔNG THỨC</button>
              <button 
                type="button" 
                className="btn btn-red" 
                onClick={() => setActiveForm('search')}
              >
                HỦY BỎ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* NO 2: GIAO DIỆN TRA CỨU (SEARCH) */}
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
                <button type="button" className="btn btn-green" onClick={handleSearch}>SEARCH</button>
                <button type="button" className="btn btn-yellow" onClick={handleResetSearch}>RESET</button>
                <button type="button" className="btn btn-red" onClick={() => window.location.reload()}>EXIT</button>
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
            <div className="result-card">
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