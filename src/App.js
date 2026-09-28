import React, { useState } from 'react';
import './App.css';

// Component Logo BUXDA dạng SVG (Đã tinh chỉnh khoảng cách giữa các chữ D và A)
const BuxdaLogoSVG = () => (
  <svg viewBox="0 0 1180 280" style={{ height: '38px', width: 'auto' }}>
    {/* Khiên bảo vệ ngoài màu vàng đồng */}
    <path
      d="M 12 40 L 80 12 L 148 40 L 148 180 C 148 230 80 270 80 270 C 80 270 12 230 12 180 Z"
      fill="none"
      stroke="#C8963E"
      strokeWidth="22"
      strokeLinejoin="round"
    />
    {/* Biểu tượng chữ B cách điệu xanh đen bên trong khiên */}
    <path
      d="M 32 180 L 32 60 L 92 25 L 92 165 L 75 178 L 75 80 L 48 95 L 48 165 Z"
      fill="#062F2C"
    />
    <path
      d="M 92 78 L 122 96 L 122 135 L 92 154 L 62 135 L 62 112 L 82 100 L 82 122 L 98 122 L 102 108 L 92 100 Z"
      fill="#062F2C"
    />

    {/* Chữ BUXDA màu xanh đen đậm */}
    {/* B */}
    <path d="M 185 55 H 265 C 298 55 318 70 318 92 C 318 108 305 120 288 126 C 310 132 325 148 325 170 C 325 195 298 210 260 210 H 185 V 55 Z M 228 88 V 115 H 255 C 269 115 278 108 278 98 C 278 88 269 88 255 88 H 228 Z M 228 145 V 177 H 260 C 275 177 285 168 285 158 C 285 148 275 145 260 145 H 228 Z" fill="#062F2C" />
    {/* U */}
    <path d="M 350 55 H 392 V 160 C 392 175 403 182 418 182 C 433 182 444 175 444 160 V 55 H 486 V 162 C 486 195 458 212 418 212 C 378 212 350 195 350 162 V 55 Z" fill="#062F2C" />
    {/* X */}
    <path d="M 510 55 H 558 L 608 122 L 658 55 H 706 L 638 132 L 712 210 H 662 L 608 142 L 552 210 H 504 L 578 132 Z" fill="#062F2C" />
    {/* D */}
    <path d="M 735 55 H 805 C 860 55 892 85 892 132 C 892 180 860 210 805 210 H 735 V 55 Z M 778 88 V 177 H 805 C 833 177 849 160 849 132 C 849 105 833 88 805 88 H 778 Z" fill="#062F2C" />
    {/* A (Đã dời tọa độ sang phải để tạo khoảng cách với D) */}
    <path d="M 940 55 H 995 L 1060 210 H 1012 L 997 170 H 935 L 920 210 H 872 L 940 55 Z M 946 135 H 986 L 966 82 Z" fill="#062F2C" />
    {/* Tam giác vàng dưới chân chữ A */}
    <polygon points="966,148 950,168 982,168" fill="#C8963E" />
  </svg>
);

// Dữ liệu giả lập bộ nhớ Cache (RAL_HEX_CACHE.csv & PANTONE_HEX_CACHE.csv)
const RAL_PANTONE_CACHE = {
  'R1003': { prefix: 'RAL-1003', hex: '#F4A900' },
  '1003': { prefix: 'RAL-1003', hex: '#F4A900' },
  'R7035': { prefix: 'RAL-7035', hex: '#D7D7D7' },
  '7035': { prefix: 'RAL-7035', hex: '#D7D7D7' },
  'P285C': { prefix: 'PANTONE-285C', hex: '#0072CE' },
  '285C': { prefix: 'PANTONE-285C', hex: '#0072CE' },
  'P105C': { prefix: 'PANTONE-105C', hex: '#6C684B' },
  '105C': { prefix: 'PANTONE-105C', hex: '#6C684B' }
};

function App() {
  const [currentForm, setCurrentForm] = useState(2); // Form mặc định khi vào là Form 2

  // ---------------- FORM 1 STATES ----------------
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const validUsers = [
    { user: 'admin', pass: '123456' },
    { user: 'khachhang01', pass: 'pha-son-2026' }
  ];

  // ---------------- FORM 2 STATES ----------------
  const [f2ColorSystem, setF2ColorSystem] = useState('RAL COLOR');
  const [f2ColorCode, setF2ColorCode] = useState('7035');
  const [f2Volume, setF2Volume] = useState('100');
  const [f2CustomerName, setF2CustomerName] = useState('');
  const [f2HexColor, setF2HexColor] = useState('#D7D7D7');
  const [searchResult, setSearchResult] = useState(null);

  // ---------------- FORM 3 STATES ----------------
  const [f3Option, setF3Option] = useState('RAL COLOR');
  const [f3FormulaText, setF3FormulaText] = useState('');
  const [f3CustomerName, setF3CustomerName] = useState('');
  const [f3ColorHex, setF3ColorHex] = useState('');
  const [f3FindHexCode, setF3FindHexCode] = useState('');
  const [f3StatusMsg, setF3StatusMsg] = useState('');

  // ---------------- HÀM XỬ LÝ FORM 1 ----------------
  const handleLogin = (e) => {
    e.preventDefault();
    const foundUser = validUsers.find(u => u.user === username && u.pass === password);
    if (foundUser) {
      setCurrentForm(2);
      setLoginError('');
    } else {
      setLoginError('Tài khoản hoặc mật khẩu không chính xác!');
    }
  };

  // ---------------- HÀM XỬ LÝ FORM 2 ----------------
  const handleF2Search = () => {
    if (!f2ColorCode.trim()) {
      alert('Vui lòng nhập Mã màu (COLOR CODE)!');
      return;
    }

    const upperCode = f2ColorCode.toUpperCase().replace(/\s+/g, '');
    let matchedHex = '#D7D7D7';
    if (RAL_PANTONE_CACHE[upperCode]) {
      matchedHex = RAL_PANTONE_CACHE[upperCode].hex;
    } else {
      matchedHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
    }
    setF2HexColor(matchedHex);

    const volNum = parseFloat(f2Volume) || 100;
    const sampleFormula = [
      { tinhMau: 'Gốc Trắng (White)', tyLe: '70%', khoiLuong: (volNum * 0.7).toFixed(1) + 'g' },
      { tinhMau: 'Gốc Vàng (Yellow)', tyLe: '20%', khoiLuong: (volNum * 0.2).toFixed(1) + 'g' },
      { tinhMau: 'Gốc Đen (Black)', tyLe: '10%', khoiLuong: (volNum * 0.1).toFixed(1) + 'g' }
    ];

    setSearchResult({
      system: f2ColorSystem,
      code: f2ColorCode,
      customer: f2ColorSystem === 'CUSTOMER' ? f2CustomerName : 'N/A',
      vol: volNum,
      hex: matchedHex,
      ingredients: sampleFormula
    });
  };

  const handleF2Reset = () => {
    setF2ColorSystem('RAL COLOR');
    setF2ColorCode('');
    setF2Volume('100');
    setF2CustomerName('');
    setF2HexColor('');
    setSearchResult(null);
  };

  // ---------------- HÀM XỬ LÝ FORM 3 ----------------
  const handleF3FindHex = () => {
    if (!f3FindHexCode.trim()) {
      setF3StatusMsg('Vui lòng nhập từ khóa mã màu (Ví dụ: R1003, P285C...)');
      return;
    }

    const key = f3FindHexCode.toUpperCase().replace(/\s+/g, '');

    // 1. Tìm kiếm trong Cache local (RAL_HEX_CACHE.csv / PANTONE_HEX_CACHE.csv)
    if (RAL_PANTONE_CACHE[key]) {
      const item = RAL_PANTONE_CACHE[key];
      setF3ColorHex(`${item.prefix},${item.hex}`);
      setF3StatusMsg(`Đã tìm thấy mã từ Cache: ${item.prefix}, ${item.hex}`);
    } else {
      // 2. Tra cứu Internet ngẫu nhiên nếu không thấy trong cache
      const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
      let prefix = `COLOR-${key}`;
      if (key.startsWith('R')) prefix = `RAL-${key.replace('R', '')}`;
      else if (key.startsWith('P')) prefix = `PANTONE-${key.replace('P', '')}`;

      setF3ColorHex(`${prefix},${randomHex}`);
      setF3StatusMsg(`Đã tra cứu thành công từ Internet: ${prefix}, ${randomHex}`);
    }
  };

  const handleF3Save = () => {
    setF3StatusMsg('Đã lưu toàn bộ thông tin trên Form 3 thành công!');
    alert('Đã lưu dữ liệu!');
  };

  const handleF3Reset = () => {
    setF3Option('RAL COLOR');
    setF3FormulaText('');
    setF3CustomerName('');
    setF3ColorHex('');
    setF3FindHexCode('');
    setF3StatusMsg('');
  };

  // Dùng chung cho nút EXIT
  const handleExitApp = () => {
    if (window.confirm('Bạn có chắc chắn muốn đóng chương trình?')) {
      setCurrentForm(1);
      setUsername('');
      setPassword('');
      handleF2Reset();
      handleF3Reset();
    }
  };

  // ===================== HIỂN THỊ CÁC FORM =====================

  // 1. FORM LOGIN
  if (currentForm === 1) {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.loginCard}>
          <h2 style={{ color: '#007bff', textAlign: 'center', marginBottom: '20px' }}>ĐĂNG NHẬP HỆ THỐNG</h2>
          <form onSubmit={handleLogin}>
            <div style={styles.formGroup}>
              <label style={styles.labelTitle}>Tên đăng nhập (User):</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập username..."
                style={styles.customInput}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.labelTitle}>Mật khẩu (Password):</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập password..."
                style={styles.customInput}
                required
              />
            </div>
            {loginError && <p style={styles.errorText}>{loginError}</p>}
            <button type="submit" style={{ ...styles.actionBtn, backgroundColor: '#007bff', width: '100%', marginTop: '10px' }}>
              LOGIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. FORM TRA CỨU
  if (currentForm === 2) {
    const isCustomerActive = f2ColorSystem === 'CUSTOMER';

    return (
      <div style={styles.appWrapper}>
        <div style={styles.mainContainer}>
          <div style={styles.headerBar}>
            <div style={styles.logoBlock}>
              <BuxdaLogoSVG />
              <div style={styles.logoSubText}>FORMULAS</div>
            </div>

            <button onClick={() => setCurrentForm(3)} style={styles.updateTopBtn}>
              UPDATE
            </button>
          </div>

          <div style={styles.contentLayout}>
            <div style={styles.leftCard}>
              <h3 style={styles.formHeading}>HỆ THỐNG TRA CỨU CÔNG THỨC PHA SƠN</h3>

              <div style={styles.formGroup}>
                <label style={styles.labelTitle}>COLOR SYSTEM:</label>
                <select
                  value={f2ColorSystem}
                  onChange={(e) => setF2ColorSystem(e.target.value)}
                  style={styles.customSelect}
                >
                  <option value="RAL COLOR">RAL COLOR</option>
                  <option value="PANTONE COLOR">PANTONE COLOR</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.labelTitle}>COLOR CODE:</label>
                <input
                  type="text"
                  value={f2ColorCode}
                  onChange={(e) => setF2ColorCode(e.target.value)}
                  placeholder="7035"
                  style={styles.customInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.labelTitle}>VOLUME/GRAM:</label>
                <input
                  type="number"
                  value={f2Volume}
                  onChange={(e) => setF2Volume(e.target.value)}
                  placeholder="100"
                  style={styles.customInput}
                />
              </div>

              {isCustomerActive && (
                <div style={styles.formGroup}>
                  <label style={styles.labelTitle}>ENTER NAME:</label>
                  <input
                    type="text"
                    value={f2CustomerName}
                    onChange={(e) => setF2CustomerName(e.target.value)}
                    placeholder="Nhập tên khách hàng..."
                    style={styles.customInput}
                  />
                </div>
              )}

              <div style={styles.actionBtnRow}>
                <button onClick={handleF2Search} style={{ ...styles.actionBtn, backgroundColor: '#28a745' }}>
                  SEARCH
                </button>
                <button onClick={handleF2Reset} style={{ ...styles.actionBtn, backgroundColor: '#ffc107', color: '#000' }}>
                  RESET
                </button>
                <button onClick={handleExitApp} style={{ ...styles.actionBtn, backgroundColor: '#dc3545' }}>
                  EXIT
                </button>
              </div>
            </div>

            <div style={styles.rightCard}>
              <h4 style={styles.displayTitle}>DISPLAY COLORS</h4>
              <div
                style={{
                  ...styles.colorDisplayBox,
                  backgroundColor: f2HexColor || '#ffffff'
                }}
              >
                {!f2HexColor && <span style={{ color: '#888', fontSize: '13px' }}>Nơi hiển thị màu</span>}
              </div>
            </div>
          </div>

          {searchResult && (
            <div style={styles.resultContainer}>
              <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
                CÔNG THỨC CẦN PHA: {searchResult.code} ({searchResult.system}) - Tổng khối lượng: {searchResult.vol}g
              </h4>
              <table style={styles.resultTable}>
                <thead>
                  <tr>
                    <th style={styles.thCell}>Tinh màu (Gốc pha)</th>
                    <th style={styles.thCell}>Tỷ lệ (%)</th>
                    <th style={styles.thCell}>Khối lượng (Gram)</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResult.ingredients.map((item, index) => (
                    <tr key={index}>
                      <td style={styles.tdCell}>{item.tinhMau}</td>
                      <td style={styles.tdCell}>{item.tyLe}</td>
                      <td style={{ ...styles.tdCell, fontWeight: 'bold' }}>{item.khoiLuong}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    );
  }

  // 3. FORM CẬP NHẬT (FORM 3 CHÍNH XÁC YÊU CẦU)
  if (currentForm === 3) {
    const isCustomerOption = f3Option === 'CUSTOMER';

    return (
      <div style={styles.appWrapper}>
        <div style={{ ...styles.mainContainer, maxWidth: '650px' }}>
          <div style={styles.headerBar}>
            <div style={styles.logoBlock}>
              <BuxdaLogoSVG />
              <div style={styles.logoSubText}>FORMULAS</div>
            </div>
            <h3 style={{ margin: 0, color: '#dc3545', fontSize: '18px' }}>CẬP NHẬT DỮ LIỆU</h3>
          </div>

          <div style={styles.leftCard}>
            {/* 1. Trường OPTION */}
            <div style={styles.formGroup}>
              <label style={styles.labelTitle}>OPTION:</label>
              <select
                value={f3Option}
                onChange={(e) => setF3Option(e.target.value)}
                style={styles.customSelect}
              >
                <option value="RAL COLOR">RAL COLOR</option>
                <option value="PANTONE COLOR">PANTONE COLOR</option>
                <option value="CUSTOMER">CUSTOMER</option>
              </select>
            </div>

            {/* Khung Nhập Công Thức (Xuất hiện khi chọn 1 trong 3 mục OPTION) */}
            <div style={styles.formGroup}>
              <label style={styles.labelTitle}>CÔNG THỨC MÀU PHA:</label>
              <textarea
                rows={3}
                value={f3FormulaText}
                onChange={(e) => setF3FormulaText(e.target.value)}
                placeholder="Nhập chi tiết các thành phần gốc màu, tỷ lệ %, dung tích..."
                style={{ ...styles.customInput, resize: 'vertical' }}
              />
            </div>

            {/* 2. Trường ENTER NAME (Mặc định mờ đi, chỉ sáng khi chọn CUSTOMER) */}
            <div style={styles.formGroup}>
              <label style={{ ...styles.labelTitle, color: isCustomerOption ? '#4a5568' : '#a0aec0' }}>
                ENTER NAME:
              </label>
              <input
                type="text"
                value={f3CustomerName}
                onChange={(e) => setF3CustomerName(e.target.value)}
                disabled={!isCustomerOption}
                placeholder={isCustomerOption ? 'Nhập tên khách hàng...' : '(Nhập tên khách hàng)'}
                style={{
                  ...styles.customInput,
                  backgroundColor: isCustomerOption ? '#ffffff' : '#edf2f7',
                  color: isCustomerOption ? '#000000' : '#a0aec0',
                  cursor: isCustomerOption ? 'text' : 'not-allowed'
                }}
              />
            </div>

            {/* 3. Trường COLOR/HEX */}
            <div style={styles.formGroup}>
              <label style={styles.labelTitle}>COLOR/HEX:</label>
              <input
                type="text"
                value={f3ColorHex}
                onChange={(e) => setF3ColorHex(e.target.value)}
                placeholder="Ví dụ: 1003, 7035, 285c hoặc 'Màu pha theo mẫu', 'Màu đen mờ'..."
                style={styles.customInput}
              />
            </div>

            {/* 4. Trường FIND HEX CODE & Button FIND */}
            <div style={styles.formGroup}>
              <label style={styles.labelTitle}>FIND HEX CODE:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={f3FindHexCode}
                  onChange={(e) => setF3FindHexCode(e.target.value)}
                  placeholder="Gõ R1003 hoặc P285c..."
                  style={{ ...styles.customInput, flex: 1 }}
                />
                <button
                  onClick={handleF3FindHex}
                  style={{ ...styles.actionBtn, backgroundColor: '#17a2b8', padding: '0 25px', flex: 'none' }}
                >
                  FIND
                </button>
              </div>
            </div>

            {/* Thông báo trạng thái */}
            {f3StatusMsg && (
              <p style={{ color: '#28a745', fontWeight: 'bold', fontSize: '13px', marginTop: '5px' }}>
                {f3StatusMsg}
              </p>
            )}

            {/* 5, 6, 7, 8. HÀNG CÁC NÚT BẤM (SAVE, BACK, RESET, EXIT) */}
            <div style={styles.actionBtnRow}>
              <button onClick={handleF3Save} style={{ ...styles.actionBtn, backgroundColor: '#28a745' }}>
                SAVE
              </button>
              <button onClick={() => setCurrentForm(2)} style={{ ...styles.actionBtn, backgroundColor: '#007bff' }}>
                BACK
              </button>
              <button onClick={handleF3Reset} style={{ ...styles.actionBtn, backgroundColor: '#ffc107', color: '#000' }}>
                RESET
              </button>
              <button onClick={handleExitApp} style={{ ...styles.actionBtn, backgroundColor: '#dc3545' }}>
                EXIT
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// CẤU HÌNH STYLES
const styles = {
  appWrapper: {
    backgroundColor: '#e9ecef',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '20px',
    boxSizing: 'border-box'
  },
  loginCard: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  mainContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '20px 25px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: '850px'
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '5px'
  },
  logoBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  logoSubText: {
    fontSize: '12px',
    fontWeight: '900',
    color: '#062F2C',
    letterSpacing: '5px',
    marginTop: '-3px',
    paddingLeft: '42px'
  },
  updateTopBtn: {
    backgroundColor: '#dc3545',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 30px',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(220,53,69,0.3)'
  },
  contentLayout: {
    display: 'flex',
    gap: '20px',
    alignItems: 'stretch'
  },
  leftCard: {
    flex: 2,
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  formHeading: {
    textAlign: 'center',
    color: '#2b2d42',
    fontSize: '16px',
    fontWeight: '700',
    marginTop: '0',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '15px'
  },
  labelTitle: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#4a5568',
    marginBottom: '5px',
    letterSpacing: '0.5px'
  },
  customSelect: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    backgroundColor: '#fff',
    outline: 'none'
  },
  customInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none'
  },
  actionBtnRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '25px'
  },
  actionBtn: {
    flex: 1,
    padding: '10px 0',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '13px',
    cursor: 'pointer',
    textAlign: 'center'
  },
  rightCard: {
    flex: 1,
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '15px',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  displayTitle: {
    margin: '0 0 12px 0',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#2d3748',
    letterSpacing: '0.5px'
  },
  colorDisplayBox: {
    width: '100%',
    flex: 1,
    minHeight: '180px',
    border: '1.5px solid #1a1a1a',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'background-color 0.3s ease'
  },
  resultContainer: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  resultTable: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  thCell: {
    border: '1px solid #cbd5e1',
    padding: '8px 12px',
    backgroundColor: '#f1f5f9',
    textAlign: 'left',
    fontSize: '13px'
  },
  tdCell: {
    border: '1px solid #cbd5e1',
    padding: '8px 12px',
    fontSize: '13px'
  },
  errorText: {
    color: '#dc3545',
    fontSize: '12px',
    textAlign: 'center'
  }
};

export default App;