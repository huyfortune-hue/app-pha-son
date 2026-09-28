import React, { useState } from 'react';
import './App.css';

export default function App() {
  // State quản lý màn hình hiện tại: 'login' (Form 1) | 'search' (Form 2) | 'update' (Form 3)
  const [activeForm, setActiveForm] = useState('login');

  // State Dữ liệu Form 1 (Login)
  const [customer, setCustomer] = useState({ name: '', phone: '' });

  // State Dữ liệu Form 2 (Search)
  const [searchParams, setSearchParams] = useState({ system: 'RAL COLOR', code: '7035', volume: '100' });
  const [previewColor, setPreviewColor] = useState('#D7D7D7');
  const [formulaResult, setFormulaResult] = useState(null);

  // State Dữ liệu Form 3 (Update Formula)
  const [updateParams, setUpdateParams] = useState({ system: 'RAL COLOR', code: '', baseColor: '', percentage: '' });

  // Xử lý Form 1 (Login)
  const handleLogin = (e) => {
    e.preventDefault();
    if (customer.name && customer.phone) {
      setActiveForm('search');
    } else {
      alert('Vui lòng nhập đầy đủ Tên và Số điện thoại!');
    }
  };

  // Xử lý Form 2 (Search Formula)
  const handleSearch = () => {
    // Giả lập tra cứu dữ liệu (Sau này sẽ gọi API Node.js backend)
    if (searchParams.code === '7035') {
      setPreviewColor('#D7D7D7');
      setFormulaResult([
        { base: 'Gốc Trắng (White)', percent: '70%', gram: (70 * searchParams.volume / 100).toFixed(1) },
        { base: 'Gốc Đen (Black)', percent: '20%', gram: (20 * searchParams.volume / 100).toFixed(1) },
        { base: 'Gốc Vàng (Yellow)', percent: '10%', gram: (10 * searchParams.volume / 100).toFixed(1) },
      ]);
    } else {
      alert('Không tìm thấy mã màu! Vui lòng thử mã khác.');
    }
  };

  return (
    <div className="app-container">
      {/* HEADER LOGO BUXDA FORMULAS */}
      <header className="app-header">
        <svg className="logo-svg" viewBox="0 0 320 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 5L30 5L40 25L30 45L10 45L0 25L10 5Z" fill="#1E3A8A" />
          <path d="M15 12L25 12L32 25L25 38L15 38L8 25L15 12Z" fill="#D97706" />
          <text x="50" y="32" fill="#0F172A" fontSize="26" fontWeight="bold" fontFamily="Arial">BUXDA</text>
          <text x="52" y="48" fill="#475569" fontSize="12" fontWeight="600" letterSpacing="3" fontFamily="Arial">FORMULAS</text>
        </svg>

        {activeForm === 'search' && (
          <button className="btn btn-red" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => setActiveForm('update')}>
            UPDATE
          </button>
        )}
        {activeForm === 'update' && (
          <button className="btn btn-blue" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => setActiveForm('search')}>
            SEARCH FORMULA
          </button>
        )}
      </header>

      {/* ========================================== */}
      /* FORM 1: ĐĂNG NHẬP THÔNG TIN KHÁCH HÀNG     */
      {/* ========================================== */}
      {activeForm === 'login' && (
        <div style={{ maxWidth: '400px', margin: '40px auto' }}>
          <div className="form-card">
            <h2 className="form-title">THÔNG TIN KHÁCH HÀNG</h2>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Họ và Tên:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nhập tên khách hàng..."
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Số Điện Thoại:</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Nhập số điện thoại..."
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-green" style={{ width: '100%', marginTop: '10px' }}>
                XÁC NHẬN & VÀO TRA CỨU
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      /* FORM 2: TRA CỨU CÔNG THỨC PHA SƠN         */
      {/* ========================================== */}
      {activeForm === 'search' && (
        <>
          <div className="form-grid">
            <div className="form-card">
              <h2 className="form-title">HỆ THỐNG TRA CỨU CÔNG THỨC PHA SƠN</h2>
              <div className="form-group">
                <label>COLOR SYSTEM:</label>
                <select
                  className="form-control"
                  value={searchParams.system}
                  onChange={(e) => setSearchParams({ ...searchParams, system: e.target.value })}
                >
                  <option value="RAL COLOR">RAL COLOR</option>
                  <option value="PANTONE COLOR">PANTONE COLOR</option>
                </select>
              </div>
              <div className="form-group">
                <label>COLOR CODE:</label>
                <input
                  type="text"
                  className="form-control"
                  value={searchParams.code}
                  onChange={(e) => setSearchParams({ ...searchParams, code: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>VOLUME/GRAM:</label>
                <input
                  type="number"
                  className="form-control"
                  value={searchParams.volume}
                  onChange={(e) => setSearchParams({ ...searchParams, volume: e.target.value })}
                />
              </div>

              <div className="btn-group">
                <button className="btn btn-green" onClick={handleSearch}>SEARCH</button>
                <button className="btn btn-yellow" onClick={() => { setSearchParams({ system: 'RAL COLOR', code: '', volume: '100' }); setFormulaResult(null); }}>RESET</button>
                <button className="btn btn-red" onClick={() => setActiveForm('login')}>EXIT</button>
              </div>
            </div>

            {/* PREVIEW MÀU DISPLAY COLORS */}
            <div className="color-preview-card">
              <label style={{ fontSize: '12px', fontWeight: '700', marginBottom: '10px', color: '#475569' }}>DISPLAY COLORS</label>
              <div className="color-box" style={{ backgroundColor: previewColor }}></div>
            </div>
          </div>

          {/* BẢNG KẾT QUẢ CÔNG THỨC */}
          {formulaResult && (
            <div className="form-card">
              <h3 style={{ color: '#2563eb', fontSize: '16px', marginBottom: '10px' }}>
                CÔNG THỨC CẦN PHA: {searchParams.code} ({searchParams.system}) - Tổng khối lượng: {searchParams.volume}g
              </h3>
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Tinh màu (Gốc pha)</th>
                    <th>Tỷ lệ (%)</th>
                    <th>Khối lượng (Gram)</th>
                  </tr>
                </thead>
                <tbody>
                  {formulaResult.map((item, idx) => (
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

      {/* ========================================== */}
      /* FORM 3: CẬP NHẬT/THÊM CÔNG THỨC MỚI       */
      {/* ========================================== */}
      {activeForm === 'update' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="form-card">
            <h2 className="form-title">CẬP NHẬT CÔNG THỨC SƠN MỚI</h2>
            <div className="form-group">
              <label>COLOR SYSTEM:</label>
              <select
                className="form-control"
                value={updateParams.system}
                onChange={(e) => setUpdateParams({ ...updateParams, system: e.target.value })}
              >
                <option value="RAL COLOR">RAL COLOR</option>
                <option value="PANTONE COLOR">PANTONE COLOR</option>
              </select>
            </div>
            <div className="form-group">
              <label>MÃ MÀU (COLOR CODE):</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ví dụ: 7035, 1015..."
                value={updateParams.code}
                onChange={(e) => setUpdateParams({ ...updateParams, code: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>TÊN TINH MÀU GỐC:</label>

              <input
                type="text"
                className="form-control"
                placeholder="Ví dụ: Gốc Trắng, Gốc Đen..."
                value={updateParams.baseColor}
                onChange={(e) => setUpdateParams({ ...updateParams, baseColor: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>TỶ LỆ phần trăm (%):</label>
              <input
                type="number"
                className="form-control"
                placeholder="Ví dụ: 70"
                value={updateParams.percentage}
                onChange={(e) => setUpdateParams({ ...updateParams, percentage: e.target.value })}
              />
            </div>

            <div className="btn-group">
              <button className="btn btn-green" onClick={() => alert('Đã lưu công thức mới vào CSV!')}>LƯU CÔNG THỨC</button>
              <button className="btn btn-red" onClick={() => setActiveForm('search')}>HỦY BỎ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}