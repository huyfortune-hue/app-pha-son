import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

function App() {
  const [currentForm, setCurrentForm] = useState('form1');

  // ---------------------------------------------------------------------------
  // 1. DATA CACHE & DATA FILES
  // ---------------------------------------------------------------------------
  const [ralHexCache, setRalHexCache] = useState([]);
  const [pantoneHexCache, setPantoneHexCache] = useState([]);
  const [ralFormulas, setRalFormulas] = useState([]);
  const [pantoneFormulas, setPantoneFormulas] = useState([]);
  const [customerFormulas, setCustomerFormulas] = useState([]);

  useEffect(() => {
    const loadCsv = (filePath) => {
      return new Promise((resolve) => {
        Papa.parse(filePath, {
          download: true,
          header: true,
          skipEmptyLines: 'greedy',
          trimHeaders: true,
          complete: (res) => {
            // Lọc bỏ các dòng trống hoặc không hợp lệ
            const validData = (res.data || []).filter(row => Object.keys(row).length > 0);
            resolve(validData);
          },
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

  // HÀM LÀM SẠCH VÀ CHUẨN HÓA MÃ HEX
  const cleanHexValue = (rawHex) => {
    if (!rawHex) return '#FFFFFF';
    let cleaned = String(rawHex)
      .replace(/[\[\]'"\s]/g, '') // Lọc sạch ngoặc vuông, nháy đơn/kép, khoảng trắng
      .trim();
    cleaned = cleaned.replace(/^#+/, ''); // Xóa toàn bộ dấu # ở đầu nếu có
    return cleaned ? `#${cleaned}` : '#FFFFFF';
  };

  // HÀM LẤY MÃ HEX TỪ DÒNG CSV (BẤT KỂ TÊN CỘT LÀ GÌ)
  const extractHexFromRow = (row) => {
    if (!row) return '#FFFFFF';
    // Tìm theo tên cột phổ biến
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toUpperCase();
      if (cleanKey === 'HEX' || cleanKey === 'HEX_CODE' || cleanKey === 'COLOR_HEX') {
        if (row[key]) return cleanHexValue(row[key]);
      }
    }
    // Nếu không khớp tên cột, tìm giá trị có chứa dấu # hoặc chuỗi Hex
    const values = Object.values(row);
    const hexVal = values.find(v => typeof v === 'string' && (v.includes('#') || /^[0-9A-Fa-f]{6}$/.test(v.trim())));
    return hexVal ? cleanHexValue(hexVal) : '#FFFFFF';
  };

  // HÀM LẤY MÃ COLOR CODE TỪ DÒNG CSV
  const extractCodeFromRow = (row) => {
    if (!row) return '';
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toUpperCase();
      if (cleanKey === 'CODE' || cleanKey === 'COLOR_CODE' || cleanKey === 'PANTONE_CODE' || cleanKey === 'RAL_CODE' || cleanKey === 'NAME') {
        if (row[key]) return String(row[key]).trim();
      }
    }
    return String(Object.values(row)[0] || '').trim();
  };

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
  // 3. FORM 2: TRA CỨU MÀU
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

    const normalizeStr = (str) => String(str || '').toLowerCase().replace(/[\s\-_]/g, '');
    const cleanKw = normalizeStr(colorCode.trim());

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

    // Tìm Hex trong Cache
    const foundHexItem = targetCache.find((row) => {
      const code = normalizeStr(extractCodeFromRow(row));
      return code === cleanKw || code === `pantone${cleanKw}` || code === `ral${cleanKw}` || code.startsWith(cleanKw);
    });

    if (foundHexItem) {
      setDisplayHex(extractHexFromRow(foundHexItem));
    } else {
      setDisplayHex('#CCCCCC');
    }

    // Tìm Công thức pha màu
    const foundFormulaItem = targetList.find((item) => {
      const matchCode = Object.values(item).some((v) => normalizeStr(v).includes(cleanKw));
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
  // 4. FORM 3: CẬP NHẬT CÔNG THỨC (ĐÃ TỐI ƯU TÌM PANTONE CHÍNH XÁC)
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

    const normalizeStr = (str) => String(str || '').toLowerCase().replace(/[\s\-_]/g, '');
    const rawKw = findHexInput.trim();
    const cleanKw = normalizeStr(rawKw); // VD: "285"

    let cache = optionForm3 === 'PANTONE COLOR' ? pantoneHexCache : ralHexCache;
    let prefix = optionForm3 === 'PANTONE COLOR' ? 'PANTONE' : 'RAL';

    if (!cache || cache.length === 0) {
      alert(`Dữ liệu ${prefix} HEX Cache chưa được tải thành công! Kiểm tra file CSV trong thư mục public.`);
      return;
    }

    // Lọc danh sách kèm thông tin mã & hex chuẩn
    const parsedList = cache.map((row) => ({
      row,
      code: extractCodeFromRow(row),
      cleanCode: normalizeStr(extractCodeFromRow(row)),
      hex: extractHexFromRow(row),
    }));

    // Tìm kiếm chính xác từng cấp độ
    let match =
      // 1. Khớp hoàn toàn (VD: "285" === "285")
      parsedList.find((item) => item.cleanCode === cleanKw) ||
      // 2. Khớp hậu tố chuẩn Pantone (VD: "285c", "285u", "pantone285")
      parsedList.find((item) => 
        item.cleanCode === `${cleanKw}c` || 
        item.cleanCode === `${cleanKw}u` ||
        item.cleanCode === `pantone${cleanKw}` ||
        item.cleanCode === `pantone${cleanKw}c`
      ) ||
      // 3. Khớp bắt đầu bằng từ khóa
      parsedList.find((item) => item.cleanCode.startsWith(cleanKw));

    if (match && match.hex && match.hex !== '#FFFFFF') {
      const codeDisplay = match.code || rawKw;
      setColorHexResultForm3(`${prefix}-${codeDisplay},${match.hex}`);
      setPreviewHexForm3(match.hex);
    } else {
      alert(`Không tìm thấy mã HEX phù hợp cho "${rawKw}" trong dữ liệu ${prefix}!`);
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
  // GIAO DIỆN HỆ THỐNG
  // ---------------------------------------------------------------------------
  return (
    <div style={styles.pageBackground}>
      <div style={styles.windowCard}>

        {/* FORM 1: ĐĂNG NHẬP */}
        {currentForm === 'form1' && (
          <div style={styles.formContainer}>
            <div style={styles.headerBlock}>
              <img src="/logo-buxda.png" alt="Logo BUXDA" style={styles.logoImgMain} />
              <h3 style={styles.formTitleMain}>ĐĂNG NHẬP HỆ THỐNG</h3>
            </div>
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
            <div style={styles.headerBlock}>
              <img src="/logo-buxda.png" alt="Logo BUXDA" style={styles.logoImgHeader} />
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
                placeholder="Ví dụ: 1003, 7035, 285..."
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

            <div style={styles.fieldGroup}>
              <label style={styles.label}>MÀU XEM TRƯỚC:</label>
              <div style={styles.previewColorRow}>
                <div
                  style={{
                    ...styles.previewColorBox,
                    backgroundColor: displayHex,
                  }}
                />
                <div style={styles.previewTextGroup}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Mã màu HEX:</div>
                  <strong style={{ fontSize: '20px', color: '#1a202c' }}>{displayHex}</strong>
                </div>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>CÔNG THỨC PHA MÀU:</label>
              <textarea
                rows={7}
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
            <div style={styles.headerBlock}>
              <img src="/logo-buxda.png" alt="Logo BUXDA" style={styles.logoImgHeader} />
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  style={{ ...styles.textInput, flex: 1 }}
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
                placeholder="Ví dụ: PANTONE-285,#0072CE"
                value={colorHexResultForm3}
                onChange={(e) => setColorHexResultForm3(e.target.value)}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>MÀU XEM TRƯỚC HỆ THỐNG TÌM THẤY:</label>
              <div style={styles.previewColorRow}>
                <div
                  style={{
                    ...styles.previewColorBoxSmall,
                    backgroundColor: previewHexForm3,
                  }}
                />
                <div style={styles.previewTextGroup}>
                  <div style={{ fontSize: '12px', color: '#666' }}>Mã xem trước:</div>
                  <strong style={{ fontSize: '18px', color: '#1a202c' }}>{previewHexForm3}</strong>
                </div>
              </div>
            </div>

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

// STYLES INLINE
const styles = {
  pageBackground: {
    backgroundColor: '#eef2f5',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '10px',
    boxSizing: 'border-box',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
  },
  windowCard: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: '520px',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    border: '1px solid #dcdfe6',
  },
  formContainer: { 
    padding: '20px 18px',
  },
  headerBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    gap: '8px',
  },
  logoImgMain: {
    height: '50px',
    objectFit: 'contain',
  },
  logoImgHeader: {
    height: '42px',
    objectFit: 'contain',
  },
  formTitleMain: {
    color: '#0f3c4c',
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
    textAlign: 'center',
  },
  formTitleHeader: {
    color: '#1a202c',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: 0,
    textAlign: 'center',
  },
  fieldGroup: { marginBottom: '14px' },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#4a5568',
    marginBottom: '5px',
  },
  selectInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    backgroundColor: '#fff',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  textInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    boxSizing: 'border-box',
    fontSize: '14px',
  },
  disabledInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#edf2f7',
    color: '#a0aec0',
    boxSizing: 'border-box',
    fontSize: '14px',
  },
  previewColorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  previewColorBox: {
    flex: '1 1 50%',
    height: '90px',
    borderRadius: '6px',
    border: '1px solid #bbb',
    boxShadow: 'inset 0 0 4px rgba(0,0,0,0.1)',
  },
  previewColorBoxSmall: {
    flex: '0 0 80px',
    height: '50px',
    borderRadius: '6px',
    border: '1px solid #bbb',
    boxShadow: 'inset 0 0 4px rgba(0,0,0,0.1)',
  },
  previewTextGroup: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  btnFind: {
    padding: '10px 16px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontSize: '13px',
  },
  textAreaInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
    fontSize: '14px',
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
    gap: '8px',
    marginTop: '18px',
  },
  actionBtn: {
    padding: '11px 2px',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer',
    textAlign: 'center',
  },
};

export default App;