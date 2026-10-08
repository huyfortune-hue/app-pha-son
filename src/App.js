import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

function App() {
  // --- Quản lý chuyển đổi giữa các Form ('form1', 'form2', 'form3') ---
  const [currentForm, setCurrentForm] = useState('form1');

  // --- States quản lý dữ liệu CSV ---
  const [colorData, setColorData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- States Form 1 (Tra cứu) ---
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchSystem, setSearchSystem] = useState('ALL');
  const [filteredColors, setFilteredColors] = useState([]);

  // --- States Form 2 (Xem chi tiết công thức) ---
  const [selectedColor, setSelectedColor] = useState(null);

  // --- States Form 3 (Cập nhật công thức) ---
  const [option, setOption] = useState('RAL COLOR');
  const [name, setName] = useState('');
  const [hexInput, setHexInput] = useState('1003');
  const [colorHexResult, setColorHexResult] = useState('RAL-1003,#A8A8A8');
  const [previewColor, setPreviewColor] = useState('#A8A8A8');
  const [formula, setFormula] = useState('W001,100\nY004,12.5\nBL005,0.2\nB003,0.33');

  // 1. Tải dữ liệu CSV từ thư mục public/
  useEffect(() => {
    const loadCsv = (filePath, systemType) => {
      return new Promise((resolve, reject) => {
        Papa.parse(filePath, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsedData = results.data.map((item) => ({
              ...item,
              system: systemType,
            }));
            resolve(parsedData);
          },
          error: (err) => reject(err),
        });
      });
    };

    Promise.all([
      loadCsv('/PANTONE_HEX_CACHE_4.csv', 'PANTONE'),
      loadCsv('/RAL_HEX_CACHE_2.csv', 'RAL'),
    ])
      .then(([pantoneResults, ralResults]) => {
        const combined = [...pantoneResults, ...ralResults];
        setColorData(combined);
        setFilteredColors(combined.slice(0, 50));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi khi nạp file CSV:', err);
        setLoading(false);
      });
  }, []);

  // 2. Tìm kiếm ở Form 1
  const handleSearchForm1 = (e) => {
    const kw = e.target.value.toLowerCase();
    setSearchKeyword(kw);

    const filtered = colorData.filter((item) => {
      const matchSystem = searchSystem === 'ALL' || item.system === searchSystem;
      const matchKw = Object.values(item).some((val) =>
        String(val).toLowerCase().includes(kw)
      );
      return matchSystem && matchKw;
    });

    setFilteredColors(filtered.slice(0, 100));
  };

  // Xem chi tiết công thức (Chuyển sang Form 2)
  const handleSelectColorForForm2 = (item) => {
    setSelectedColor(item);
    setCurrentForm('form2');
  };

  // 3. Tìm kiếm HEX ở Form 3
  const handleFindHexForm3 = () => {
    if (!hexInput.trim()) return;
    const targetSystem = option.includes('RAL') ? 'RAL' : 'PANTONE';
    const keyword = hexInput.trim().toLowerCase();

    const found = colorData.find((item) => {
      if (item.system !== targetSystem) return false;
      return Object.values(item).some((val) =>
        String(val).toLowerCase().includes(keyword)
      );
    });

    if (found) {
      const hex = found.HEX || found.Hex || found.hex || '#FFFFFF';
      const code = found.CODE || found.Code || found.COLOR || hexInput;
      const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;

      setColorHexResult(`${targetSystem}-${code},${cleanHex}`);
      setPreviewColor(cleanHex);
    } else {
      alert(`Không tìm thấy mã "${hexInput}" trong hệ màu ${targetSystem}`);
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <h3>Đang nạp dữ liệu bảng màu...</h3>
      </div>
    );
  }

  return (
    <div style={styles.pageBackground}>
      <div style={styles.windowCard}>
        {/* HEADER CHUNG */}
        <div style={styles.topHeader}>
          <div style={styles.brandLogo}>
            <span style={styles.logoIcon}>B</span>
            <span style={styles.logoText}>BUXDA</span>
          </div>
          <div style={styles.topNavButtons}>
            <button
              style={{
                ...styles.navBtn,
                backgroundColor: currentForm === 'form1' ? '#0f3c4c' : '#e9ecef',
                color: currentForm === 'form1' ? '#fff' : '#333',
              }}
              onClick={() => setCurrentForm('form1')}
            >
              FORM 1
            </button>
            <button
              style={{
                ...styles.navBtn,
                backgroundColor: currentForm === 'form2' ? '#0f3c4c' : '#e9ecef',
                color: currentForm === 'form2' ? '#fff' : '#333',
              }}
              onClick={() => setCurrentForm('form2')}
            >
              FORM 2
            </button>
            <button
              style={{
                ...styles.navBtn,
                backgroundColor: currentForm === 'form3' ? '#dc3545' : '#e9ecef',
                color: currentForm === 'form3' ? '#fff' : '#333',
              }}
              onClick={() => setCurrentForm('form3')}
            >
              FORM 3 (UPDATE)
            </button>
          </div>
        </div>

        {/* ----------------- GIAO DIỆN FORM 1 ----------------- */}
        {currentForm === 'form1' && (
          <div style={styles.formContainer}>
            <h2 style={styles.formTitle}>TRA CỨU MÃ MÀU (FORM 1)</h2>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <select
                style={{ ...styles.selectInput, width: '150px' }}
                value={searchSystem}
                onChange={(e) => setSearchSystem(e.target.value)}
              >
                <option value="ALL">TẤT CẢ HỆ MÀU</option>
                <option value="RAL">RAL</option>
                <option value="PANTONE">PANTONE</option>
              </select>

              <input
                type="text"
                style={styles.textInput}
                placeholder="Nhập tên màu hoặc mã màu..."
                value={searchKeyword}
                onChange={handleSearchForm1}
              />
            </div>

            {/* Danh sách màu */}
            <div style={styles.colorGrid}>
              {filteredColors.map((item, index) => {
                const hex = item.HEX || item.Hex || item.hex || '#CCCCCC';
                const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
                const code = item.CODE || item.Code || item.COLOR || 'N/A';

                return (
                  <div
                    key={index}
                    style={styles.colorCard}
                    onClick={() => handleSelectColorForForm2(item)}
                    title="Bấm để xem công thức ở Form 2"
                  >
                    <div style={{ ...styles.colorBox, backgroundColor: cleanHex }} />
                    <div style={styles.colorInfo}>
                      <strong>{item.system}-{code}</strong>
                      <span style={{ fontSize: '12px', color: '#666' }}>{cleanHex}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------- GIAO DIỆN FORM 2 ----------------- */}
        {currentForm === 'form2' && (
          <div style={styles.formContainer}>
            <h2 style={styles.formTitle}>CHI TIẾT CÔNG THỨC PHA MÀU (FORM 2)</h2>

            {selectedColor ? (
              <div>
                <div style={styles.detailHeader}>
                  <div
                    style={{
                      ...styles.colorPreviewBig,
                      backgroundColor: (selectedColor.HEX || selectedColor.Hex || '#CCCCCC').startsWith('#')
                        ? (selectedColor.HEX || selectedColor.Hex)
                        : `#${selectedColor.HEX || selectedColor.Hex}`,
                    }}
                  />
                  <div>
                    <h3>
                      Mã màu: {selectedColor.system} - {selectedColor.CODE || selectedColor.Code || selectedColor.COLOR}
                    </h3>
                    <p>Mã Hex: {selectedColor.HEX || selectedColor.Hex || 'N/A'}</p>
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <label style={styles.label}>CÔNG THỨC PHA MÀU:</label>
                  <div style={styles.formulaBox}>
                    {selectedColor.FORMULA || selectedColor.Formula || selectedColor.formula || 'Chưa có dữ liệu công thức cho mã màu này.'}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                <p>Chưa chọn mã màu nào từ Form 1.</p>
                <button
                  style={{ ...styles.actionBtn, backgroundColor: '#0f3c4c', width: 'auto', padding: '10px 20px' }}
                  onClick={() => setCurrentForm('form1')}
                >
                  VỀ FORM 1 ĐỂ CHỌN MÀU
                </button>
              </div>
            )}
          </div>
        )}

        {/* ----------------- GIAO DIỆN FORM 3 ----------------- */}
        {currentForm === 'form3' && (
          <div style={styles.formContainer}>
            <h2 style={styles.formTitle}>CẬP NHẬT CÔNG THỨC MỚI (FORM 3)</h2>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>OPTION:</label>
              <select
                style={styles.selectInput}
                value={option}
                onChange={(e) => setOption(e.target.value)}
              >
                <option value="RAL COLOR">RAL COLOR</option>
                <option value="PANTONE COLOR">PANTONE COLOR</option>
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>NHẬP TÊN:</label>
              <input
                type="text"
                style={styles.disabledInput}
                placeholder="Đã khóa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>TÌM MÃ HEX:</label>
              <div style={styles.rowLayout}>
                <input
                  type="text"
                  style={styles.textInput}
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  placeholder="Nhập mã màu..."
                />
                <button style={styles.btnFind} onClick={handleFindHexForm3}>
                  FIND
                </button>
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>MÃ MÀU/HEX:</label>
              <div style={styles.rowLayout}>
                <input
                  type="text"
                  style={{ ...styles.textInput, backgroundColor: '#f9f9f9' }}
                  value={colorHexResult}
                  readOnly
                />
                <div
                  style={{
                    ...styles.colorPreviewBox,
                    backgroundColor: previewColor,
                  }}
                  title={`Màu xem trước: ${previewColor}`}
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                NHẬP CÔNG THỨC PHA (Định dạng: MãGốc,Gram):
              </label>
              <textarea
                rows={5}
                style={styles.textAreaInput}
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
              />
            </div>

            <div style={styles.actionButtonsRow}>
              <button style={{ ...styles.actionBtn, backgroundColor: '#28a745' }}>
                LƯU
              </button>
              <button
                style={{ ...styles.actionBtn, backgroundColor: '#2b6cb0' }}
                onClick={() => setCurrentForm('form1')}
              >
                QUAY LẠI
              </button>
              <button
                style={{ ...styles.actionBtn, backgroundColor: '#e5a500' }}
                onClick={() => {
                  setHexInput('');
                  setColorHexResult('');
                  setPreviewColor('#FFFFFF');
                }}
              >
                LÀM MỚI
              </button>
              <button style={{ ...styles.actionBtn, backgroundColor: '#dc3545' }}>
                THOÁT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- CSS Inline ---
const styles = {
  pageBackground: {
    backgroundColor: '#f2f4f8',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    fontFamily: "'Segoe UI', Roboto, sans-serif",
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  windowCard: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: '850px',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    border: '1px solid #e1e4e8',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #eeeeee',
  },
  brandLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '22px',
    fontWeight: '900',
    color: '#0f3c4c',
  },
  logoIcon: {
    border: '3px solid #0f3c4c',
    padding: '0 6px',
    borderRadius: '4px',
  },
  logoText: { letterSpacing: '1px' },
  topNavButtons: { display: 'flex', gap: '8px' },
  navBtn: {
    padding: '8px 14px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '13px',
  },
  formContainer: { padding: '24px 36px', maxWidth: '700px', margin: '0 auto' },
  formTitle: {
    textAlign: 'center',
    color: '#1a202c',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '24px',
  },
  fieldGroup: { marginBottom: '16px' },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: '6px',
  },
  selectInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    backgroundColor: '#fff',
  },
  disabledInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#edf2f7',
    boxSizing: 'border-box',
  },
  rowLayout: { display: 'flex', gap: '12px', alignItems: 'center' },
  textInput: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    boxSizing: 'border-box',
  },
  btnFind: {
    padding: '10px 24px',
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  colorPreviewBox: {
    width: '50px',
    height: '42px',
    borderRadius: '6px',
    border: '2px solid #cbd5e0',
  },
  textAreaInput: {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    fontFamily: 'monospace',
    boxSizing: 'border-box',
  },
  actionButtonsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginTop: '24px',
  },
  actionBtn: {
    padding: '12px',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  colorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '12px',
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '10px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
  },
  colorCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  colorBox: { height: '60px', width: '100%' },
  colorInfo: { padding: '8px', display: 'flex', flexDirection: 'column' },
  detailHeader: { display: 'flex', gap: '20px', alignItems: 'center' },
  colorPreviewBig: { width: '80px', height: '80px', borderRadius: '8px', border: '1px solid #ccc' },
  formulaBox: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e2e8f0',
    padding: '15px',
    borderRadius: '6px',
    whiteSpace: 'pre-wrap',
    fontFamily: 'monospace',
  },
};

export default App;