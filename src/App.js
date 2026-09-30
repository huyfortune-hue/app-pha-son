import React, { useState } from 'react';
import './App.css';
import logoBuxda from './logo-buxda.png';

const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbwJPHRE6cMFU2D-gn3jG251GLB0cCUX3pBRB-NY70Z9HjRaSinLITXGUM8MtnJUrVKW/exec";

export default function App() {
  const [currentForm, setCurrentForm] = useState(1);

  // ---------- FORM 1: STATE ĐĂNG NHẬP ----------
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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
  const [colorCode, setColorCode] = useState('1008');
  const [volume, setVolume] = useState(100);
  const [customerNameForm2, setCustomerNameForm2] = useState('');
  const [previewHex, setPreviewHex] = useState('#D7D7D7');
  const [searchResult, setSearchResult] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // ---------- FORM 3: STATE UPDATE CÔNG THỨC ----------
  const [optionUpdate, setOptionUpdate] = useState('RAL COLOR');
  const [customerNameForm3, setCustomerNameForm3] = useState('');
  const [colorHexText, setColorHexText] = useState('');
  const [findHexQuery, setFindHexQuery] = useState('');
  const [formulaInput, setFormulaInput] = useState('');
  const [loadingFindHex, setLoadingFindHex] = useState(false);

  // TỰ ĐỘNG TÌM MÃ HEX DỰA TRÊN MÃ MÀU & HỆ MÀU
  const handleFindHex = async () => {
    const query = findHexQuery.trim();
    if (!query) {
      alert('Vui lòng nhập mã màu cần tìm HEX (VD: 1008 hoặc 285C)');
      return;
    }

    setLoadingFindHex(true);
    try {
      let hexCode = '';
      if (optionUpdate === 'RAL COLOR') {
        // Gọi API công khai tra cứu mã màu RAL
        const res = await fetch(`https://raw.githubusercontent.com/zilke/ral-colors/master/ral-colors.json`);
        const ralData = await res.json();
        const found = ralData.find(item => item.ral === query || item.ral === `RAL ${query}`);
        if (found && found.hex) {
          hexCode = found.hex;
        }
      } else if (optionUpdate === 'PANTONE COLOR') {
        // Giả lập tra cứu Pantone hoặc qua API công khai
        if (query.includes('285')) hexCode = '#0072CE';
        else if (query.includes('186')) hexCode = '#C8102E';
      }

      // Dự phòng nếu API không trả về
      if (!hexCode) {
        hexCode = query.startsWith('#') ? query : `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
      }

      const formattedResult = `${optionUpdate.split(' ')[0]}-${query},${hexCode.toUpperCase()}`;
      setColorHexText(formattedResult);
      setPreviewHex(hexCode);
    } catch (error) {
      console.error("Lỗi tìm mã HEX:", error);
      // Mã fallback tạo hex mặc định nếu mất mạng
      const defaultHex = '#A8A8A8';
      setColorHexText(`${optionUpdate.split(' ')[0]}-${query},${defaultHex}`);
      setPreviewHex(defaultHex);
    } finally {
      setLoadingFindHex(false);
    }
  };

  // HÀM BÁO/TÍNH TOÁN CÔNG THỨC TỪ ĐỊNH DẠNG (Mã,Gram) THEO KHỐI LƯỢNG MỚI (FORM 2)
  const parseAndCalculateFormula = (rawFormulaText, targetVolume) => {
    if (!rawFormulaText) return [];

    const lines = rawFormulaText.split('\n');
    let parsedRows = [];
    let totalOriginalGram = 0;

    // Bước 1: Đọc dữ liệu đầu vào & tính tổng khối lượng mẫu
    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.split(',');
      if (parts.length >= 2) {
        const baseCode = parts[0].trim();
        const baseGram = parseFloat(parts[1].trim()) || 0;
        parsedRows.push({ baseCode, baseGram });
        totalOriginalGram += baseGram;
      }
    });

    if (totalOriginalGram === 0) return [];

    // Bước 2: Quy đổi tỷ lệ % và tính Khối lượng Gram tương ứng với targetVolume ở Form 2
    return parsedRows.map(row => {
      const percentage = (row.baseGram / totalOriginalGram) * 100;
      const calculatedGram = ((targetVolume * percentage) / 100).toFixed(2);
      return {
        base: row.baseCode,
        percent: `${percentage.toFixed(2)}%`,
        gram: `${calculatedGram}g`
      };
    });
  };

  // HÀM TRA CỨU DỮ LIỆU TỪ GOOGLE SHEETS (FORM 2)
  const handleSearch = async () => {
    const queryCode = colorCode.trim().toLowerCase();
    const queryCustomer = customerNameForm2.trim().toLowerCase();

    if (colorSystem === 'CUSTOMER' && !queryCustomer) {
      alert('Vui lòng nhập tên khách hàng cần tìm!');
      return;
    }
    if (colorSystem !== 'CUSTOMER' && !queryCode) {
      alert('Vui lòng nhập mã màu cần tìm!');
      return;
    }

    setLoadingSearch(true);

    try {
      const response = await fetch(GOOGLE_SHEET_API_URL);
      const resData = await response.json();

      if (resData.status === 'success' && resData.data) {
        // Lọc kết quả khớp với Hệ màu & Mã màu/Tên khách hàng
        const matches = resData.data.filter((item) => {
          const matchOption = item.option === colorSystem;
          if (!matchOption) return false;

          if (colorSystem === 'CUSTOMER') {
            return item.customerName.toLowerCase().includes(queryCustomer);
          } else {
            return item.colorHex.toLowerCase().includes(queryCode);
          }
        });

        if (matches.length > 0) {
          const matchedItem = matches[matches.length - 1]; // Lấy bản ghi mới nhất

          // Trích xuất mã HEX để vẽ lại ô HIỂN THỊ MÀU
          const hexMatch = matchedItem.colorHex.match(/#[0-9A-Fa-f]{6}/i);
          if (hexMatch) {
            setPreviewHex(hexMatch[0]);
          }

          // Tính toán công thức theo Khối lượng GRAM mới nhập
          const targetGram = parseFloat(volume) || 100;
          const calculatedItems = parseAndCalculateFormula(matchedItem.formula, targetGram);

          setSearchResult({
            titleCode: colorSystem === 'CUSTOMER' ? customerNameForm2 : colorCode,
            systemName: colorSystem,
            items: calculatedItems
          });
        } else {
          alert('Không tìm thấy công thức phù hợp!');
          setSearchResult(null);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tra cứu dữ liệu:', error);
      alert('Lỗi kết nối khi tra cứu dữ liệu!');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleResetForm2 = () => {
    setColorCode('');
    setVolume(100);
    setCustomerNameForm2('');
    setSearchResult(null);
    setPreviewHex('#D7D7D7');
  };

  // HÀM LƯU DỮ LIỆU TỪ FORM 3
  const handleSaveForm3 = async (e) => {
    e.preventDefault();

    const dataToSend = {
      option: optionUpdate,
      customerName: customerNameForm3,
      colorHex: colorHexText,
      formula: formulaInput,
      userLogin: username,
    };

    try {
      await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      alert(`Đã lưu công thức thành công vào Google Sheets!`);
      handleResetForm3();
      setCurrentForm(2);
    } catch (error) {
      console.error('Lỗi khi gửi dữ liệu sang Google Sheets:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại!');
    }
  };

  const handleResetForm3 = () => {
    setCustomerNameForm3('');
    setColorHexText('');
    setFindHexQuery('');
    setFormulaInput('');
  };

  const handleExitApp = () => {
    if (window.confirm('Bạn có chắc chắn muốn thoát ứng dụng?')) {
      window.close();
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
              <label>TÀI KHOẢN:</label>
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
              <label>MẬT KHẨU:</label>
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
              <button type="submit" className="btn btn-green">ĐĂNG NHẬP</button>
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
                <label>CHỌN HỆ MÀU:</label>
                <select
                  className="form-control"
                  value={colorSystem}
                  onChange={(e) => setColorSystem(e.target.value)}
                >
                  <option value="RAL COLOR">RAL COLOR</option>
                  <option value="PANTONE COLOR">PANTONE COLOR</option>
                  <option value="CUSTOMER">KHÁCH HÀNG</option>
                </select>
              </div>

              <div className="form-group">
                <label>MÃ MÀU:</label>
                <input
                  type="text"
                  className={`form-control ${colorSystem === 'CUSTOMER' ? 'disabled-input' : ''}`}
                  disabled={colorSystem === 'CUSTOMER'}
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                  placeholder={colorSystem !== 'CUSTOMER' ? 'Gõ mã màu (VD: 1008)' : 'Đã khóa'}
                />
              </div>

              <div className="form-group">
                <label>KHỐI LƯỢNG/GRAM:</label>
                <input
                  type="number"
                  className="form-control"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>NHẬP TÊN:</label>
                <input
                  type="text"
                  className={`form-control ${colorSystem !== 'CUSTOMER' ? 'disabled-input' : ''}`}
                  disabled={colorSystem !== 'CUSTOMER'}
                  value={customerNameForm2}
                  onChange={(e) => setCustomerNameForm2(e.target.value)}
                  placeholder={colorSystem === 'CUSTOMER' ? 'Nhập tên khách hàng' : 'Đã khóa'}
                />
              </div>

              <div className="btn-group">
                <button type="button" className="btn btn-green" onClick={handleSearch} disabled={loadingSearch}>
                  {loadingSearch ? 'ĐANG TÌM...' : 'TÌM KIẾM'}
                </button>
                <button type="button" className="btn btn-yellow" onClick={handleResetForm2}>LÀM MỚI</button>
                <button type="button" className="btn btn-red" onClick={handleExitApp}>THOÁT</button>
              </div>

              <div className="btn-group mobile-only-flex" style={{ marginTop: '10px' }}>
                <button type="button" className="btn btn-blue" onClick={() => setCurrentForm(2)}>QUAY LẠI</button>
                <button type="button" className="btn btn-red" onClick={() => setCurrentForm(3)}>CẬP NHẬT</button>
              </div>
            </div>

            {/* HIỂN THỊ MÀU ĐƯỢC VẼ LẠI DỰA THEO MÃ HEX DƯỚI FORM 3 */}
            <div className="color-preview-card">
              <div className="form-title">HIỂN THỊ MÀU</div>
              <div className="color-box" style={{ backgroundColor: previewHex }}></div>
            </div>
          </div>

          {/* HIỂN THỊ CÔNG THỨC MÀU BẢNG KẾT QUẢ TÍNH THEO GRAM MỚI */}
          {searchResult && (
            <div className="result-card">
              <div style={{ color: '#2563eb', fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>
                {searchResult.titleCode} ({searchResult.systemName}) - Khối lượng: {volume}g
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
                  {searchResult.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.base}</td>
                      <td>{item.percent}</td>
                      <td><strong>{item.gram}</strong></td>
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
              <label>NHẬP TÊN:</label>
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
              <label>TÌM MÃ HEX:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className={`form-control ${optionUpdate === 'CUSTOMER' ? 'disabled-input' : ''}`}
                  disabled={optionUpdate === 'CUSTOMER'}
                  placeholder={optionUpdate === 'CUSTOMER' ? 'Đã khóa cho KH' : 'Gõ mã màu (VD: 1008)...'}
                  value={findHexQuery}
                  onChange={(e) => setFindHexQuery(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-green"
                  style={{ minWidth: '90px' }}
                  onClick={handleFindHex}
                  disabled={optionUpdate === 'CUSTOMER' || loadingFindHex}
                >
                  {loadingFindHex ? '...' : 'FIND'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>MÃ MÀU/HEX:</label>
              <input
                type="text"
                className="form-control"
                placeholder="VD: RAL-1008,#D7D7D7"
                value={colorHexText}
                onChange={(e) => setColorHexText(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>NHẬP CÔNG THỨC PHA (Định dạng: MãGốc,Gram):</label>
              <textarea
                className="form-control"
                rows="6"
                placeholder={"W001,100\nY004,12.5\nBL005,0.2\nB003,0.33"}
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="btn-group">
              <button type="submit" className="btn btn-green">LƯU</button>
              <button type="button" className="btn btn-blue" onClick={() => setCurrentForm(2)}>QUAY LẠI</button>
              <button type="button" className="btn btn-yellow" onClick={handleResetForm3}>LÀM MỚI</button>
              <button type="button" className="btn btn-red" onClick={handleExitApp}>THOÁT</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}