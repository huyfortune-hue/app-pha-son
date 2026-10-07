import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

function App() {
  const [colorData, setColorData] = useState([]);
  const [filteredColors, setFilteredColors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('ALL'); // 'ALL', 'PANTONE', 'RAL'
  const [loading, setLoading] = useState(true);
  const [copiedHex, setCopiedHex] = useState('');

  useEffect(() => {
    // Hàm nạp tệp CSV
    const loadCsv = (filePath, systemType) => {
      return new Promise((resolve, reject) => {
        Papa.parse(filePath, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Thêm trường phân loại hệ màu cho từng dòng dữ liệu
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

    // Nạp đồng thời cả 2 tệp CSV
    Promise.all([
      loadCsv('/PANTONE_HEX_CACHE_4.csv', 'PANTONE'),
      loadCsv('/RAL_HEX_CACHE_2.csv', 'RAL'),
    ])
      ? Promise.all([
          loadCsv('/PANTONE_HEX_CACHE_4.csv', 'PANTONE'),
          loadCsv('/RAL_HEX_CACHE_2.csv', 'RAL'),
        ])
          .then(([pantoneResults, ralResults]) => {
            const combined = [...pantoneResults, ...ralResults];
            setColorData(combined);
            setFilteredColors(combined);
            setLoading(false);
          })
          .catch((err) => {
            console.error('Lỗi khi đọc tệp CSV:', err);
            setLoading(false);
          })
      : null;
  }, []);

  // Xử lý Lọc & Tìm kiếm
  useEffect(() => {
    let result = colorData;

    // Lọc theo hệ màu
    if (selectedSystem !== 'ALL') {
      result = result.filter((item) => item.system === selectedSystem);
    }

    // Lọc theo từ khóa tìm kiếm (so sánh tất cả các giá trị trong dòng)
    if (searchTerm.trim() !== '') {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(lowerSearch)
        )
      );
    }

    setFilteredColors(result);
  }, [searchTerm, selectedSystem, colorData]);

  // Sao chép mã HEX vào clipboard
  const handleCopyHex = (hexCode) => {
    if (!hexCode) return;
    navigator.clipboard.writeText(hexCode);
    setCopiedHex(hexCode);
    setTimeout(() => setCopiedHex(''), 2000);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2>Đang nạp dữ liệu bảng màu PANTONE & RAL...</h2>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Tra Cứu Mã Màu PANTONE & RAL</h1>
        {copiedHex && (
          <div style={styles.toast}>Đã sao chép mã {copiedHex}!</div>
        )}
      </header>

      {/* Thanh công cụ tìm kiếm & bộ lọc */}
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Nhập mã màu, tên màu hoặc mã HEX (ví dụ: 100, Orange, #FF5733)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />

        <div style={styles.filterGroup}>
          <button
            style={{
              ...styles.filterBtn,
              ...(selectedSystem === 'ALL' ? styles.activeBtn : {}),
            }}
            onClick={() => setSelectedSystem('ALL')}
          >
            Tất cả ({colorData.length})
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(selectedSystem === 'PANTONE' ? styles.activeBtn : {}),
            }}
            onClick={() => setSelectedSystem('PANTONE')}
          >
            Pantone
          </button>
          <button
            style={{
              ...styles.filterBtn,
              ...(selectedSystem === 'RAL' ? styles.activeBtn : {}),
            }}
            onClick={() => setSelectedSystem('RAL')}
          >
            RAL
          </button>
        </div>
      </div>

      {/* Thống kê kết quả */}
      <p style={styles.resultCount}>
        Hiển thị <strong>{filteredColors.length}</strong> màu phù hợp
      </p>

      {/* Lưới hiển thị ô màu */}
      <div style={styles.grid}>
        {filteredColors.slice(0, 200).map((item, index) => {
          // Tự động tìm cột chứa mã HEX và tên/mã màu trong file CSV
          const hex = item.HEX || item.Hex || item.hex || item.code_hex || '#FFFFFF';
          const code = item.CODE || item.Code || item.code || item.COLOR || item.Color || Object.values(item)[0];
          const name = item.NAME || item.Name || item.name || '';

          return (
            <div
              key={index}
              style={styles.card}
              onClick={() => handleCopyHex(hex)}
              title="Nhấp để sao chép mã HEX"
            >
              <div
                style={{
                  ...styles.colorBox,
                  backgroundColor: hex.startsWith('#') ? hex : `#${hex}`,
                }}
              />
              <div style={styles.cardInfo}>
                <span style={styles.systemBadge}>{item.system}</span>
                <div style={styles.colorCode}>{code}</div>
                {name && <div style={styles.colorName}>{name}</div>}
                <div style={styles.hexCode}>{hex}</div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredColors.length > 200 && (
        <p style={styles.moreNotice}>
          * Chỉ đang hiển thị 200 kết quả đầu tiên. Hãy nhập từ khóa chi tiết hơn để thu hẹp tìm kiếm.
        </p>
      )}
    </div>
  );
}

// Style dạng Inline CSS
const styles = {
  container: {
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: 'sans-serif',
  },
  header: {
    position: 'relative',
    marginBottom: '24px',
    textAlign: 'center',
  },
  title: {
    margin: 0,
    color: '#1a1a1a',
  },
  toast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#28a745',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1000,
  },
  toolbar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  searchInput: {
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ced4da',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  filterGroup: {
    display: 'flex',
    gap: '8px',
  },
  filterBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #6c757d',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontWeight: '500',
  },
  activeBtn: {
    backgroundColor: '#0d6efd',
    color: '#fff',
    borderColor: '#0d6efd',
  },
  resultCount: {
    color: '#6c757d',
    marginBottom: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
  },
  colorBox: {
    height: '100px',
    width: '100%',
  },
  cardInfo: {
    padding: '10px',
    textAlign: 'center',
  },
  systemBadge: {
    fontSize: '10px',
    fontWeight: 'bold',
    backgroundColor: '#e9ecef',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#495057',
  },
  colorCode: {
    fontWeight: 'bold',
    fontSize: '14px',
    marginTop: '4px',
    color: '#212529',
  },
  colorName: {
    fontSize: '12px',
    color: '#6c757d',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  hexCode: {
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#0d6efd',
    marginTop: '4px',
  },
  moreNotice: {
    textAlign: 'center',
    color: '#6c757d',
    marginTop: '20px',
    fontStyle: 'italic',
  },
};

export default App;