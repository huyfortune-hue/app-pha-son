import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

function App() {
  // Trạng thái Form hiện tại: 'form1' (Đăng nhập), 'form2' (Tra cứu), 'form3' (Cập nhật)
  const [currentForm, setCurrentForm] = useState('form1');

  // ---------------------------------------------------------------------------
  // 1. DATA CACHE & DATA FILES
  // ---------------------------------------------------------------------------
  const [ralHexCache, setRalHexCache] = useState([]);
  const [pantoneHexCache, setPantoneHexCache] = useState([]);
  const [ralFormulas, setRalFormulas] = useState([]);
  const [pantoneFormulas, setPantoneFormulas] = useState([]);
  const [customerFormulas, setCustomerFormulas] = useState([]);

  // Load dữ liệu CSV từ thư mục public/
  useEffect(() => {
    const loadCsv = (filePath) => {
      return new Promise((resolve) => {
        Papa.parse(filePath, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: (res) => resolve(res.data || []),
          error: () => resolve([]),
        });
      });
    };

    Promise.all([
      loadCsv('/RAL_HEX_CACHE_2.csv'),
      loadCsv('/PANTONE_HEX_CACHE_4.csv'),
      loadCsv('/RAL_COLOR.csv'),
      loadCsv('/PANTONE_COLOR.csv'),
      loadCsv('/CUSTOMER_DATA.csv'),
    ]).then(([ralHex, panHex, ralForm, panForm, custForm]) => {
      setRalHexCache(ralHex);
      setPantoneHexCache(panHex);
      setRalFormulas(ralForm);
      setPantoneFormulas(panForm);
      setCustomerFormulas(custForm);
    });
  }, []);

  // ---------------------------------------------------------------------------
  // 2. FORM 1: ĐĂNG NHẬP
  // ---------------------------------------------------------------------------
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === '123456') {
      setCurrentForm('form2');
    } else {
      alert('Tên đăng nhập hoặc mật khẩu không chính xác!');
    }
  };

  // ---------------------------------------------------------------------------
  // 3. FORM 2: TRA CỨU & BẢNG CÔNG THỨC
  // ---------------------------------------------------------------------------
  const [colorSystem, setColorSystem] = useState('RAL COLOR');
  const [colorCode, setColorCode] = useState('');
  const [volumeGram, setVolumeGram] = useState('1000');
  const [customerNameForm2, setCustomerNameForm2] = useState('');
  
  const [displayHex, setDisplayHex] = useState('#FFFFFF');
  const [searchResultFormula, setSearchResultFormula] = useState('');

  const handleResetForm2 = () => {
    setColorSystem('RAL COLOR');
    setColorCode('');
    setVolumeGram('1000');
    setCustomerNameForm2('');
    setDisplayHex('#FFFFFF');
    setSearchResultFormula('');
  };

  const handleSearchForm2 = () => {
    if (!colorCode.trim()) {
      alert('Vui lòng nhập mã màu!');
      return;
    }

    const cleanCode = colorCode.trim().toLowerCase();
    let targetList = [];
    let targetCache = [];

    if (colorSystem === 'RAL COLOR') {
      targetList = ralFormulas;
      targetCache = ralHexCache;
    } else if (colorSystem === 'PANTONE COLOR') {
      targetList = pantoneFormulas;
      targetCache = pantoneHexCache;
    } else {
      targetList = customerFormulas;
      targetCache = [...ralHexCache, ...pantoneHexCache];
    }

    // 1. Tìm Hex Color để tô màu xem trước
    const foundHexItem = targetCache.find((item) =>
      Object.values(item).some((v) => String(v).toLowerCase().includes(cleanCode))
    );
    if (foundHexItem) {
      const hex = foundHexItem.HEX || foundHexItem.Hex || foundHexItem.hex || '#FFFFFF';
      setDisplayHex(hex.startsWith('#') ? hex : `#${hex}`);
    } else {
      setDisplayHex('#CCCCCC');
    }

    // 2. Tìm Công thức
    const foundFormulaItem = targetList.find((item) => {
      const matchCode = Object.values(item).some((v) => String(v).toLowerCase().includes(cleanCode));
      if (colorSystem === 'KHÁCH HÀNG' && customerNameForm2.trim()) {
        const matchName = String(item.CUSTOMER_NAME || '').toLowerCase().includes(customerNameForm2.trim().toLowerCase());
        return matchCode && matchName;
      }
      return matchCode;
    });

    if (foundFormulaItem) {
      let rawFormula = foundFormulaItem.FORMULA || foundFormulaItem.formula || '';
      const baseVol = parseFloat(foundFormulaItem.BASE_VOLUME || 1000);
      const targetVol = parseFloat(volumeGram) || 1000;
      const ratio = targetVol / baseVol;

      if (ratio !== 1 && rawFormula) {
        const lines = rawFormula.split('\n');
        const recalculatedLines = lines.map((line) => {
          const parts = line.split(',');
          if (parts.length === 2) {
            const code = parts[0].trim();
            const weight = parseFloat(parts[1]);
            if (!isNaN(weight)) {
              return `${code}, ${(weight * ratio).toFixed(2)}`;
            }
          }
          return line;
        });
        rawFormula = recalculatedLines.join('\n');
      }

      setSearchResultFormula(rawFormula);
    } else {
      setSearchResultFormula('Không tìm thấy công thức cho mã màu này!');
    }
  };

  // ---------------------------------------------------------------------------
  // 4. FORM 3: CẬP NHẬT CÔNG THỨC MỚI
  // ---------------------------------------------------------------------------
  const [optionForm3, setOptionForm3] = useState('RAL COLOR');
  const [customerNameForm3, setCustomerNameForm3] = useState('');
  const [colorHexResultForm3, setColorHexResultForm3] = useState('');
  const [findHexInput, setFindHexInput] = useState('');
  const [formulaInputForm3, setFormulaInputForm3] = useState('');
  const [previewHexForm3, setPreviewHexForm3] = useState('#FFFFFF');

  const handleResetForm3 = () => {
    setOptionForm3('RAL COLOR');
    setCustomerNameForm3('');
    setColorHexResultForm3('');
    setFindHexInput('');
    setFormulaInputForm3('');
    setPreviewHexForm3('#FFFFFF');
  };

  const handleFindHexForm3 = () => {
    if (!findHexInput.trim()) {
      alert('Vui lòng nhập từ khóa tìm kiếm mã HEX!');
      return;
    }
    const kw = findHexInput.trim().toLowerCase();
    
    let cache = optionForm3 === 'PANTONE COLOR' ? pantoneHexCache : ralHexCache;
    let prefix = optionForm3 === 'PANTONE COLOR' ? 'PANTONE' : 'RAL';

    const found = cache.find((item) =>
      Object.values(item).some((v) => String(v).toLowerCase().includes(kw))
    );

    if (found) {
      const code = found.CODE || found.Code || findHexInput;
      const hex = found.HEX || found.Hex || '#000000';
      const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
      
      setColorHexResultForm3(`${prefix}-${code},${cleanHex}`);
      setPreviewHexForm3(cleanHex); // Cập nhật màu xem trước khi tìm thấy HEX
    } else {
      alert(`Không tìm thấy mã HEX trong bộ nhớ Cache!`);
      setPreviewHexForm3('#FFFFFF');
    }
  };

  const handleSaveForm3 = () => {
    if (!colorHexResultForm3 || !formulaInputForm3) {
      alert('Vui lòng điền đầy đủ thông tin mã màu và công thức!');
      return;
    }
    alert(`Đã ghi nhận công thức cho [${colorHexResultForm3}].`);
  };

  // ---------------------------------------------------------------------------
  // RENDER GIAO DIỆN
  // ---------------------------------------------------------------------------
  return (
    <div style={styles.pageBackground}>
      <div style={styles.windowCard}>

        {/* FORM 1: ĐĂNG NHẬP */}
        {currentForm === 'form1' && (
          <div style={styles.formContainer}>
            <h3 style={{ textAlign: 'center', marginBottom: '25px', color: '#0f3c4c', fontSize: '20px' }}>
              ĐĂNG NHẬP HỆ THỐNG
            </h3>
            <form onSubmit={handleLogin}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>TÊN ĐĂNG NHẬP:</label>
                <input
                  type="text"
                  style={styles.textInput}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập..."
                  required
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>MẬT KHẨU:</label>
                <input
                  type="password"
                  style={styles.textInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  required
                />
              </div>
              <button type="submit" style={styles.btnPrimary}>
                ĐĂNG NHẬP
              </button>
            </form>
          </div>
        )}

        {/* FORM 2: TRA CỨU */}
        {currentForm === 'form2' && (
          <div style={styles.formContainer}>
            {/* Header với Logo bên trái */}
            <div style={styles.headerRow}>
              <img src="/logo-buxda.png" alt="Logo BUXDA" style={styles.logoImg} />
              <h2 style={styles.formTitleHeader}>TRA CỨU CÔNG THỨC MÀU</h2>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>HỆ THỐNG MÀU:</label>
              <select
                style={styles.selectInput}
                value={colorSystem}
                onChange={(e) => setColorSystem(e.target.value)}
              >
                <option value="RAL COLOR">MÀU RAL</option>
                <option value="PANTONE COLOR">MÀU PANTONE</option>
                <option value="KHÁCH HÀNG">MÀU KHÁCH HÀNG</option>
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>TÊN KHÁCH HÀNG:</label>
              <input
                type="text"
                style={colorSystem === 'KHÁCH HÀNG' ? styles.textInput : styles.disabledInput}
                disabled={colorSystem !== 'KHÁCH HÀNG'}
                value={customerNameForm2}
                onChange={(e) => setCustomerNameForm2(e.target.value)}
                placeholder={colorSystem === 'KHÁCH HÀNG' ? 'Nhập tên khách hàng...' : 'Mặc định ẩn'}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>MÃ MÀU:</label>
              <input
                type="text"
                style={styles.textInput}
                placeholder="Ví dụ: 1003, 7035, 285C..."
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>KÍCH THƯỚC / TRỌNG LƯỢNG (GAM):</label>
              <input
                type="number"
                style={styles.textInput}
                placeholder="Ví dụ: 100, 500, 1000..."
                value={volumeGram}
                onChange={(e) => setVolumeGram(e.target.value)}
              />
            </div>

            {/* MÀU XEM TRƯỚC (Tăng kích thước lên 3 lần) */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>MÀU XEM TRƯỚC:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div
                  style={{
                    width: '180px',       // Gấp 3 lần (ban đầu 60px)
                    height: '120px',      // Gấp 3 lần (ban đầu 40px)
                    borderRadius: '8px',
                    border: '2px solid #bbb',
                    backgroundColor: displayHex,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                />
                <div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Mã màu HEX:</div>
                  <strong style={{ fontSize: '18px', color: '#1a202c' }}>{displayHex}</strong>
                </div>
              </div>
            </div>

            {/* CÔNG THỨC PHA MÀU (Chiều cao tăng 1.5 lần, rows=8) */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>CÔNG THỨC PHA MÀU:</label>
              <textarea
                rows={8}
                readOnly
                style={{ ...styles.textAreaInput, backgroundColor: '#f8f9fa' }}
                value={searchResultFormula}
                placeholder="Kết quả công thức pha màu sẽ hiển thị tại đây..."
              />
            </div>

            <div style={styles.actionButtonsRow}>
              <button style={{ ...styles.actionBtn, backgroundColor: '#28a745' }} onClick={handleSearchForm2}>
                TÌM KIẾM
              </button>
              <button style={{ ...styles.actionBtn, backgroundColor: '#e5a500' }} onClick={handleResetForm2}>
                LÀM MỚI
              </button>
              <button style={{ ...styles.actionBtn, backgroundColor: '#dc3545' }} onClick={() => setCurrentForm('form1')}>
                THOÁT
              </button>
              <button style={{ ...styles.actionBtn, backgroundColor: '#0f3c4c' }} onClick={() => setCurrentForm('form3')}>
                CẬP NHẬT
              </button>
            </div>
          </div>
        )}

        {/* FORM 3: CẬP NHẬT CÔNG THỨC */}
        {currentForm === 'form3' && (
          <div style={styles.formContainer}>
            {/* Header với Logo bên trái */}
            <div style={styles.headerRow}>
              <img src="/logo-buxda.png" alt="Logo BUXDA" style={styles.logoImg} />
              <h2 style={styles.formTitleHeader}>CẬP NHẬT CÔNG THỨC MỚI</h2>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>LOẠI HỆ THỐNG:</label>
              <select
                style={styles.selectInput}
                value={optionForm3}
                onChange={(e) => setOptionForm3(e.target.value)}
              >
                <option value="RAL COLOR">MÀU RAL</option>
                <option value="PANTONE COLOR">MÀU PANTONE</option>
                <option value="KHÁCH HÀNG">MÀU KHÁCH HÀNG</option>
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>TÊN KHÁCH HÀNG:</label>
              <input
                type="text"
                style={optionForm3 === 'KHÁCH HÀNG' ? styles.textInput : styles.disabledInput}
                disabled={optionForm3 !== 'KHÁCH HÀNG'}
                value={customerNameForm3}
                onChange={(e) => setCustomerNameForm3(e.target.value)}
                placeholder={optionForm3 === 'KHÁCH HÀNG' ? 'Nhập tên khách hàng...' : 'Mặc định ẩn'}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>TÌM MÃ HEX:</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  style={styles.textInput}
                  placeholder="Gõ mã màu để tìm..."
                  value={findHexInput}
                  onChange={(e) => setFindHexInput(e.target.value)}
                />
                <button style={styles.btnFind} onClick={handleFindHexForm3}>
                  TÌM MÃ
                </button>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>MÀU / MÃ HEX:</label>
              <input
                type="text"
                style={styles.textInput}
                placeholder="Ví dụ: RAL-7035,#D7D7D7"
                value={colorHexResultForm3}
                onChange={(e) => setColorHexResultForm3(e.target.value)}
              />
            </div>

            {/* Ô xem trước màu sắc trong Form 3 khi tìm thấy mã HEX */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>MÀU XEM TRƯỚC HỆ THỐNG TÌM THẤY:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div
                  style={{
                    width: '80px',
                    height: '45px',
                    borderRadius: '6px',
                    border: '2px solid #ccc',
                    backgroundColor: previewHexForm3,
                  }}
                />
                <span style={{ fontSize: '14px', color: '#4a5568' }}>
                  Mã xem trước: <strong>{previewHexForm3}</strong>
                </span>
              </div>
            </div>

            {/* Ô nhập công thức (Bỏ chữ Mã Gốc,Gram) */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>NHẬP CÔNG THỨC:</label>
              <textarea
                rows={5}
                style={styles.textAreaInput}
                placeholder={"Ví dụ:\nMC-4400, 250\nMC-4200, 15\nMC-3000, 2.7"}
                value={formulaInputForm3}
                onChange={(e) => setFormulaInputForm3(e.target.value)}
              />
            </div>

            <div style={styles.actionButtonsRow}>
              <button style={{ ...styles.actionBtn, backgroundColor: '#28a745' }} onClick={handleSaveForm3}>
                LƯU
              </button>
              <button style={{ ...styles.actionBtn, backgroundColor: '#2b6cb0' }} onClick={() => setCurrentForm('form2')}>
                QUAY LẠI
              </button>
              <button style={{ ...styles.actionBtn, backgroundColor: '#e5a500' }} onClick={handleResetForm3}>
                LÀM MỚI
              </button>
              <button style={{ ...styles.actionBtn, backgroundColor: '#dc3545' }} onClick={() => setCurrentForm('form1')}>
                THOÁT
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// STYLES INLINE CẬP NHẬT
const styles = {
  pageBackground: {
    backgroundColor: '#eef2f5',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
  },
  windowCard: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: '650px',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    border: '1px solid #dcdfe6',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px',
  },
  logoImg: {
    height: '45px',
    objectFit: 'contain',
  },
  formTitleHeader: {
    color: '#1a202c',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
  },
  formContainer: { padding: '30px' },
  fieldGroup: { marginBottom: '15px' },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#4a5568',
    marginBottom: '6px',
  },
  selectInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    backgroundColor: '#fff',
  },
  textInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    boxSizing: 'border-box',
  },
  disabledInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#edf2f7',
    color: '#a0aec0',
    boxSizing: 'border-box',
  },
  btnFind: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  textAreaInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
  },
  btnPrimary: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#0f3c4c',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    fontSize: '15px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  actionButtonsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '10px',
    marginTop: '20px',
  },
  actionBtn: {
    padding: '12px 5px',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
    textAlign: 'center',
  },
};

export default App;