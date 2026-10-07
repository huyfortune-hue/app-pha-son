import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

function App() {
  // --- States quản lý dữ liệu CSV ---
  const [colorData, setColorData] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- States quản lý Form 3 ---
  const [option, setOption] = useState('RAL COLOR'); // 'RAL COLOR' hoặc 'PANTONE COLOR'
  const [name, setName] = useState('');
  const [hexInput, setHexInput] = useState('1003'); // Từ khóa tìm mã HEX
  const [colorHexResult, setColorHexResult] = useState('RAL-1003,#A8A8A8'); // Chuỗi kết quả Mã/HEX
  const [previewColor, setPreviewColor] = useState('#A8A8A8'); // Mã HEX hiển thị màu trực quan
  const [formula, setFormula] = useState('W001,100\nY004,12.5\nBL005,0.2\nB003,0.33');

  // 1. Tải dữ liệu CSV từ thư mục public/ khi ứng dụng khởi chạy
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
        setLoading(false);
      })
      .catch((err) => {
        console.error('Lỗi khi nạp file CSV:', err);
        setLoading(false);
      });
  }, []);

  // 2. Hàm tìm kiếm mã HEX khi bấm nút "FIND"
  const handleFindHex = () => {
    if (!hexInput.trim()) return;

    const targetSystem = option.includes('RAL') ? 'RAL' : 'PANTONE';
    const keyword = hexInput.trim().toLowerCase();

    // Tìm kiếm trong danh sách dữ liệu CSV
    const found = colorData.find((item) => {
      if (item.system !== targetSystem) return false;
      return Object.values(item).some((val) =>
        String(val).toLowerCase().includes(keyword)
      );
    });

    if (found) {
      // Tự động tìm cột HEX và CODE từ CSV
      const hex = found.HEX || found.Hex || found.hex || found.code_hex || '#FFFFFF';
      const code = found.CODE || found.Code || found.code || found.COLOR || found.Color || hexInput;
      
      const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
      const resultString = `${targetSystem}-${code},${cleanHex}`;

      setColorHexResult(resultString);
      setPreviewColor(cleanHex);
    } else {
      alert(`Không tìm thấy mã "${hexInput}" trong hệ màu ${targetSystem}`);
    }
  };

  // 3. Hàm xử lý nút "LÀM MỚI"
  const handleReset = () => {
    setHexInput('');
    setColorHexResult('');
    setPreviewColor('#FFFFFF');
    setFormula('');
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <h3>Đang nạp dữ liệu màu...</h3>
      </div>
    );
  }

  return (
    <div style={styles.pageBackground}>
      {/* Container chính mô phỏng cửa sổ ứng dụng BUXDA */}
      <div style={styles.windowCard}>
        {/* Thanh Header */}
        <div style={styles.topHeader}>
          <div style={styles.brandLogo}>
            <span style={styles.logoIcon}>B</span>
            <span style={styles.logoText}>BUXDA</span>
          </div>
          <div style={styles.topNavButtons}>
            <button style={styles.btnBack}>BACK</button>
            <button style={styles.btnUpdate}>UPDATE</button>
          </div>
        </div>

        {/* Nội dung Form 3 */}
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>CẬP NHẬT CÔNG THỨC MỚI</h2>

          {/* 1. Select OPTION */}
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

          {/* 2. NHẬP TÊN */}
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

          {/* 3. TÌM MÃ HEX */}
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
              <button style={styles.btnFind} onClick={handleFindHex}>
                FIND
              </button>
            </div>
          </div>

          {/* 4. MÃ MÀU/HEX VÀ Ô HIỂN THỊ MÀU (COLOR PREVIEW BOX) */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>MÃ MÀU/HEX:</label>
            <div style={styles.rowLayout}>
              <input
                type="text"
                style={{ ...styles.textInput, backgroundColor: '#f9f9f9' }}
                value={colorHexResult}
                readOnly
              />
              {/* Ô HIỂN THỊ MÀU TRỰC QUAN */}
              <div
                style={{
                  ...styles.colorPreviewBox,
                  backgroundColor: previewColor,
                }}
                title={`Màu xem trước: ${previewColor}`}
              />
            </div>
          </div>

          {/* 5. NHẬP CÔNG THỨC PHA */}
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

          {/* Hàng nút chức năng ở chân Form */}
          <div style={styles.actionButtonsRow}>
            <button style={{ ...styles.actionBtn, backgroundColor: '#28a745' }}>
              LƯU
            </button>
            <button style={{ ...styles.actionBtn, backgroundColor: '#2b6cb0' }}>
              QUAY LẠI
            </button>
            <button
              style={{ ...styles.actionBtn, backgroundColor: '#e5a500' }}
              onClick={handleReset}
            >
              LÀM MỚI
            </button>
            <button style={{ ...styles.actionBtn, backgroundColor: '#dc3545' }}>
              THOÁT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- CSS Inline đồng bộ chính xác với giao diện mẫu ---
const styles = {
  pageBackground: {
    backgroundColor: '#f2f4f8',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: 'sans-serif',
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
  logoText: {
    letterSpacing: '1px',
  },
  topNavButtons: {
    display: 'flex',
    gap: '10px',
  },
  btnBack: {
    padding: '8px 16px',
    backgroundColor: '#e9ecef',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontWeight: 'bold',
    color: '#495057',
    cursor: 'pointer',
  },
  btnUpdate: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    color: '#ffffff',
    cursor: 'pointer',
  },
  formContainer: {
    padding: '24px 36px',
    maxWidth: '700px',
    margin: '0 auto',
  },
  formTitle: {
    textAlign: 'center',
    color: '#1a202c',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '24px',
    letterSpacing: '0.5px',
  },
  fieldGroup: {
    marginBottom: '16px',
  },
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
    outline: 'none',
    fontSize: '14px',
    backgroundColor: '#fff',
  },
  disabledInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#edf2f7',
    color: '#a0aec0',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  rowLayout: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    outline: 'none',
    fontSize: '14px',
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
    fontSize: '14px',
  },
  colorPreviewBox: {
    width: '50px',
    height: '42px',
    borderRadius: '6px',
    border: '2px solid #cbd5e0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'background-color 0.2s ease',
  },
  textAreaInput: {
    width: '100%',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    outline: 'none',
    fontSize: '14px',
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
    fontSize: '14px',
    cursor: 'pointer',
  },
};

export default App;