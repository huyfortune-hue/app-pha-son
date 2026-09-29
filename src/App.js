import React, { useState } from 'react';
import './App.css';
import logoBuxda from './logo-buxda.png';

export default function App() {
  // Trạng thái ứng dụng: 1: Form Đăng nhập, 2: Form Tra cứu, 3: Form Update
  const [currentForm, setCurrentForm] = useState(1);

  // ---------- FORM 1: STATE ĐĂNG NHẬP ----------
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Danh sách tài khoản (Admin có thể bổ sung thêm tài khoản phụ tại đây)
  const usersList = [
    { user: 'admin', pass: '123456' },
    { user: 'buxda', pass: 'buxda2024' }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    const isValid = usersList.some(
      (u) => u.user === username.trim() && u.pass === password.trim()
    );
    if (isValid) {
      setCurrentForm(2);
    } else {
      alert('Tài khoản hoặc mật khẩu không đúng!');
    }
  };

  // ---------- FORM 2: STATE TRA CỨU ----------
  const [colorSystem, setColorSystem] = useState('RAL COLOR');
  const [colorCode, setColorCode] = useState('7035');
  const [volume, setVolume] = useState(100);
  const [customerNameForm2, setCustomerNameForm2] = useState('');
  const [previewHex, setPreviewHex] = useState('#D7D7D7');
  const [searchResult, setSearchResult] = useState(null);

  const handleSearch = () => {
    // Giả lập truy xuất dữ liệu từ công thức hoặc file CSV
    setSearchResult([
      { base: 'Gốc Trắng', percent: '70%', gram: (volume * 0.7).toFixed(1) },
      { base: 'Gốc Đen', percent: '20%', gram: (volume * 0.2).toFixed(1) },
      { base: 'Gốc Vàng', percent: '10%', gram: (volume * 0.1).toFixed(1) }
    ]);
  };

  const handleResetForm2 = () => {
    setColorCode('');
    setVolume(100);
    setCustomerNameForm2('');
    setSearchResult(null);
  };

  // ---------- FORM 3: STATE UPDATE CÔNG THỨC ----------
  const [optionUpdate, setOptionUpdate] = useState('RAL COLOR');
  const [customerNameForm3, setCustomerNameForm3] = useState('');
  const [colorHexText, setColorHexText] = useState('');
  const [findHexQuery, setFindHexQuery] = useState('');
  const [formulaInput, setFormulaInput] = useState('');

  // Nút FIND HEX: Đọc từ cache/Internet
  const handleFindHex = () => {
    const query = findHexQuery.trim().toUpperCase();
    if (!query) {
      alert('Vui lòng nhập mã màu cần tìm HEX (VD: R1003 hoặc P285C)');
      return;
    }

    // Giả lập truy xuất mã HEX từ file RAL_HEX_CACHE.csv và PANTONE_HEX_CACHE.csv
    if (query.includes('1003') || query.includes('7035') || query.includes('R')) {
      setColorHexText('RAL-7035,#D7D7D7');
      setPreviewHex('#D7D7D7');
    } else if (query.includes('285') || query.includes('P')) {
      setColorHexText('PANTONE-285C,#0072CE');
      setPreviewHex('#0072CE');
    } else {
      setColorHexText(`${query},#A8A8A8`);
      setPreviewHex('#A8A8A8');
    }
  };

  const handleSaveForm3 = (e) => {
    e.preventDefault();
    alert(`Đã lưu dữ liệu thành công cho hệ thống ${optionUpdate}!`);
    setCurrentForm(2);
  };

  const handleResetForm3 = () => {
    setCustomerNameForm3('');
    setColorHexText('');
    setFindHexQuery('');
    setFormulaInput('');
  };

  // Nút EXIT: Đóng trình duyệt
  const handleExitApp = () => {
    if (window.confirm('Bạn có chắc chắn muốn thoát ứng dụng?')) {
      window.close();
      // Dự phòng nếu trình duyệt chặn window.close()
      setTimeout(() => {
        window.location.href = 'about:blank';
      }, 300);
    }
  };

  return (
    <div className="app-container">
      {/* HEADER GIỮ NGUYÊN */}
      <div className="app-header">
        <div className="brand-logo-container">
          <img src={logoBuxda} alt="BUXDA" className="app-logo-img" />
        </div>

        {/* BỘ NÚT HEADER TRÊN PC */}
        {currentForm !== 1 && (
          <div className="header-btn-group pc-only-flex">
            <button
              type="button"
              className={currentForm === 2 ? 'btn-header active' : 'btn-header'}
              onClick={() => setCurrentForm(2)}
            >
              BACK
            </button>
            <button
              type="button"
              className={currentForm === 3 ? 'btn-header active-red' : 'btn-header btn-red-bg'}
              onClick={() => setCurrentForm(3)}
            >
              UPDATE
            </button>
          </div>
        )}
      </div>

      {/* ==================== FORM 1: ĐĂNG NHẬP ==================== */}
      {currentForm === 1 && (
        <div className="form-card login-card">
          <div className="form-title">ĐĂNG NHẬP HỆ THỐNG</div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>TÀI KHOẢN (USER):</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                required
              />
            </div>
            <div className="form-group">
              <label>MẬT KHẨU (PASSWORD):</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                required
              />
            </div>
            <div className="btn-group" style={{ marginTop: '20px' }}>
              <button type="submit" className="btn btn-green">LOGIN</button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== FORM 2: TRA CỨU CÔNG THỨC ==================== */}
      {currentForm === 2 && (
        <>
          <div className="form-grid">
            <div className="form-card">
              <div className="form-group">
                <label>COLOR SYSTEM:</label>
                <select
                  className="form-control"
                  value={colorSystem}
                  onChange={(e) => setColorSystem(e.target.value)}
                >
                  <option value="RAL COLOR">RAL COLOR</option>
                  <option value="PANTONE COLOR">PANTONE COLOR</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                </select>
              </div>

              <div className="form-group">
                <label>COLOR CODE:</label>
                <input
                  type="text"
                  className="form-control"
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                  placeholder="VD: 7035, 1003, 285C"
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

              <div className="form-group">
                <label>ENTER NAME:</label>
                <input
                  type="text"
                  className={`form-control ${colorSystem !== 'CUSTOMER' ? 'disabled-input' : ''}`}
                  disabled={colorSystem !== 'CUSTOMER'}
                  value={customerNameForm2}
                  onChange={(e) => setCustomerNameForm2(e.target.value)}
                  placeholder={colorSystem === 'CUSTOMER' ? 'Nhập tên khách hàng' : 'Đã khóa'}
                />
              </div>

              {/* BỘ 3 NÚT CHÍNH */}
              <div className="btn-group">
                <button type="button" className="btn btn-green" onClick={handleSearch}>SEARCH</button>
                <button type="button" className="btn btn-yellow" onClick={handleResetForm2}>RESET</button>
                <button type="button" className="btn btn-red" onClick={handleExitApp}>EXIT</button>
              </div>

              {/* DỜI NÚT BACK & UPDATE XUỐNG DƯỚI 3 NÚT TRÊN ĐIỆN THOẠI */}
              <div className="btn-group mobile-only-flex" style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-blue" onClick={() => setCurrentForm(2)}>BACK</button>
                <button type="button" className="btn btn-red" onClick={() => setCurrentForm(3)}>UPDATE</button>
              </div>
            </div>

            {/* KHUNG VẼ LẠI MÀU BẰNG MÃ HEX */}
            <div className="color-preview-card">
              <div className="form-title">DISPLAY COLORS</div>
              <div className="color-box" style={{ backgroundColor: previewHex }}></div>
            </div>
          </div>

          {/* HIỂN THỊ CÔNG THỨC MÀU */}
          {searchResult && (
            <div className="result-card">
              <div style={{ color: '#2563eb', fontWeight: 'bold', marginBottom: '10px' }}>
                {colorCode} ({colorSystem}) - Khối lượng: {volume}g
              </div>
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

      {/* ==================== FORM 3: CẬP NHẬT CÔNG THỨC ==================== */}
      {currentForm === 3 && (
        <div className="form-card" style={{ maxWidth: '650px', margin: '0 auto' }}>
          <div className="form-title">CẬP NHẬT CÔNG THỨC MỚI</div>
          
          <form onSubmit={handleSaveForm3}>
            <div className="form-group">
              <label>OPTION:</label>
              <select
                className="form-control"
                value={optionUpdate}
                onChange={(e) => setOptionUpdate(e.target.value)}
              >
                <option value="RAL COLOR">RAL COLOR</option>
                <option value="PANTONE COLOR">PANTONE COLOR</option>
                <option value="CUSTOMER">CUSTOMER</option>
              </select>
            </div>

            <div className="form-group">
              <label>ENTER NAME:</label>
              <input
                type="text"
                className={`form-control ${optionUpdate !== 'CUSTOMER' ? 'disabled-input' : ''}`}
                disabled={optionUpdate !== 'CUSTOMER'}
                value={customerNameForm3}
                onChange={(e) => setCustomerNameForm3(e.target.value)}
                placeholder={optionUpdate === 'CUSTOMER' ? 'Nhập tên khách hàng' : 'Đã khóa'}
              />
            </div>

            <div className="form-group">
              <label>FIND HEX CODE:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Gõ R1003 hoặc P285C..."
                  value={findHexQuery}
                  onChange={(e) => setFindHexQuery(e.target.value)}
                />
                <button type="button" className="btn btn-green" style={{ minWidth: '90px' }} onClick={handleFindHex}>
                  FIND
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>COLOR/HEX:</label>
              <input
                type="text"
                className="form-control"
                placeholder="VD: RAL-7035,#D7D7D7 hoặc Màu đen mờ..."
                value={colorHexText}
                onChange={(e) => setColorHexText(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>NỘI DUNG CÔNG THỨC PHA:</label>
              <textarea
                className="form-control"
                rows="4"
                placeholder="Nhập công thức chi tiết..."
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="btn-group">
              <button type="submit" className="btn btn-green">SAVE</button>
              <button type="button" className="btn btn-blue" onClick={() => setCurrentForm(2)}>BACK</button>
              <button type="button" className="btn btn-yellow" onClick={handleResetForm3}>RESET</button>
              <button type="button" className="btn btn-red" onClick={handleExitApp}>EXIT</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}