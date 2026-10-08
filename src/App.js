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
            const validData = (res.data || []).filter((row) => Object.keys(row).length > 0);
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

  // HÀM CHUẨN HÓA CHUỖI TÌM KIẾM
  const cleanSearchString = (str) => {
    return String(str || '')
      .toLowerCase()
      .replace(/[\[\]'"\s\-_]/g, '');
  };

  // HÀM LẤY VÀ LÀM SẠCH MÃ HEX
  const extractHexFromRow = (row) => {
    if (!row) return '#FFFFFF';
    const values = Object.values(row);
    const hexVal = values.find(
      (v) => typeof v === 'string' && (v.includes('#') || /^[0-9A-Fa-f]{6}$/.test(String(v).replace(/[\[\]'"\s]/g, '')))
    );
    if (!hexVal) return '#FFFFFF';

    let cleaned = String(hexVal)
      .replace(/[\[\]'"\s]/g, '')
      .trim();
    cleaned = cleaned.replace(/^#+/, '');
    return cleaned ? `#${cleaned}` : '#FFFFFF';
  };

  // HÀM TÌM TÊN/MÃ TỪ ROW CSV
  const extractCodeFromRow = (row, defaultKw) => {
    if (!row) return defaultKw;
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim().toUpperCase();
      if (['CODE', 'COLOR_CODE', 'PANTONE_CODE', 'RAL_CODE', 'NAME'].includes(cleanKey)) {
        if (row[key]) {
          return String(row[key]).replace(/[\[\]'"\s]/g, ' ').trim();
        }
      }
    }
    const firstVal = Object.values(row)[0];
    return firstVal ? String(firstVal).replace(/[\[\]'"\s]/g, ' ').trim() : defaultKw;
  };

  // ---------------------------------------------------------------------------
  // HÀM TÌM KIẾM MÃ HEX ONLINE KHI DỮ LIỆU CSV KHÔNG CÓ
  // ---------------------------------------------------------------------------
  const fetchOnlineHex = async (query, systemType) => {
    try {
      // Gọi API công cộng tra cứu Pantone/RAL
      const searchTerm = encodeURIComponent(`${systemType} ${query}`);
      const response = await fetch(`https://api.color.pizza/v1/?name=${searchTerm}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.colors && data.colors.length > 0) {
          return data.colors[0].hex; // Trả về hex tìm thấy
        }
      }
    } catch (e) {
      console.log('Lỗi truy vấn Internet:', e);
    }
    return null;
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

  const handleSearchForm2 = async () => {
    if (!colorCode.trim()) {
      alert('Vui lòng nhập mã màu!');
      return;
    }

    const cleanKw = cleanSearchString(colorCode);

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

    // 1. Tìm trong Cache CSV
    const foundHexItem = targetCache.find((row) => {
      return Object.values(row).some((val) => {
        const cleanVal = cleanSearchString(val);
        return cleanVal === cleanKw || cleanVal.includes(cleanKw) || cleanKw.includes(cleanVal);
      });
    });

    if (foundHexItem) {
      setDisplayHex(extractHexFromRow(foundHexItem));
    } else {
      // 2. Tự động tìm trên Internet nếu CSV không có
      const onlineHex = await fetchOnlineHex(colorCode, colorSystem);
      if (onlineHex) {
        setDisplayHex(onlineHex);
      } else {
        setDisplayHex('#CCCCCC');
      }
    }

    // Tìm công thức
    const foundFormulaItem = targetList.find((item) => {
      const matchCode = Object.values(item).some((v) => cleanSearchString(v).includes(cleanKw));
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
  // 4. FORM 3: CẬP NHẬT CÔNG THỨC (CÓ TÌM ONINE INTERNET)
  // ---------------------------------------------------------------------------
  const [optionForm3, setOptionForm3] = useState('RAL COLOR');
  const [customerNameForm3, setCustomerNameForm3] = useState('');
  const [colorHexResultForm3, setColorHexResultForm3] = useState('');
  const [findHexInput, setFindHexInput] = useState('');
  const [formulaInputForm3, setFormulaInputForm3] = useState('');
  const [previewHexForm3, setPreviewHexForm3] = useState('#FFFFFF');
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  const handleResetForm3 = () => {
    setOptionForm3('RAL COLOR');
    setCustomerNameForm3('');
    setColorHexResultForm3('');
    setFindHexInput('');
    setFormulaInputForm3('');
    setPreviewHexForm3('#FFFFFF');
  };

  const handleFindHexForm3 = async () => {
    if (!findHexInput.trim()) {
      alert('Vui lòng nhập từ khóa tìm kiếm mã HEX!');
      return;
    }

    const rawKw = findHexInput.trim();
    const cleanKw = cleanSearchString(rawKw);

    let cache = optionForm3 === 'PANTONE COLOR' ? pantoneHexCache : ralHexCache;
    let prefix = optionForm3 === 'PANTONE COLOR' ? 'PANTONE' : 'RAL';

    // 1. TÌM TRONG FILE CSV DỮ LIỆU
    let foundRow = cache.find((row) => {
      return Object.values(row).some((val) => {
        const cleanVal = cleanSearchString(val);
        if (!cleanVal) return false;
        return (
          cleanVal === cleanKw ||
          cleanVal === `pantone${cleanKw}` ||
          cleanVal === `ral${cleanKw}` ||
          cleanVal.includes(cleanKw) ||
          cleanKw.includes(cleanVal)
        );
      });
    });

    if (foundRow) {
      const hexVal = extractHexFromRow(foundRow);
      const codeVal = extractCodeFromRow(foundRow, rawKw);

      setColorHexResultForm3(`${prefix}-${codeVal.toUpperCase()},${hexVal}`);
      setPreviewHexForm3(hexVal);
      return;
    }

    // 2. NẾU KHÔNG CÓ TRONG CSV -> TỰ ĐỘNG TÌM KIẾM TRÊN INTERNET
    setIsSearchingOnline(true);
    const onlineHex = await fetchOnlineHex(rawKw, prefix);
    setIsSearchingOnline(false);

    if (onlineHex) {
      setColorHexResultForm3(`${prefix}-${rawKw.toUpperCase()},${onlineHex}`);
      setPreviewHexForm3(onlineHex);
      alert(`Đã tìm thấy mã HEX cho "${rawKw}" trực tuyến trên Internet: ${onlineHex}`);
    } else {
      alert(`Không tìm thấy mã HEX cho "${rawKw}" trên CSV lẫn Internet!`);
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
                placeholder="Ví dụ: 1003, 7035, 227..."
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
                  placeholder="Gõ mã màu (VD: 227, 135c)..."
                  value={findHexInput}
                  onChange={(e) => setFindHexInput(e.target.value)}
                />
                <button
                  style={{
                    ...styles.btnFind,
                    backgroundColor: isSearchingOnline ? '#6c757d' : '#28a745',
                  }}
                  onClick={handleFindHexForm3}
                  disabled={isSearchingOnline}
                >
                  {isSearchingOnline ? 'ĐANG TÌM...' : 'TÌM MÃ'}
                </button>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>MÀU / MÃ HEX:</label>
              <input
                type="text"
                style={styles.textInput}
                placeholder="Ví dụ: PANTONE-227,#AA0061"
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