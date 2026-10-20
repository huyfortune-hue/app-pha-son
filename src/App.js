import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

// ---------------------------------------------------------------------------
// CẤU HÌNH CHUNG
// ---------------------------------------------------------------------------
// URL Web App của Google Apps Script (bản triển khai /exec)
const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwMXliod0Uyh4mKX1YdCLrj2wyxWs86wXLw3yGD7yoZQhTqGmYOAtnhwTWgyPB9_WSh/exec';

// Độ rộng mỗi dòng trong bảng công thức (số ký tự)
const LINE_WIDTH = 26;

// Tạo dòng dạng:  BD 02- - - - - - - - 81,60
const formatFormulaLine = (code, value) => {
  const room = Math.max(LINE_WIDTH - code.length - value.length, 2);
  // Dựng từ phải sang trái để luôn kết thúc bằng "- " ngay trước số gam
  let fill = '';
  for (let j = 0; j < room; j++) {
    fill = (j % 2 === 0 ? ' ' : '-') + fill;
  }
  return code + fill + value;
};

// Chia lại công thức sao cho TỔNG khối lượng = số gam cần pha,
// rồi trình bày thành bảng TINT MÀU / GRAM.
// Nhận các kiểu nhập: "BD02,100" | "BD 02- - - 81,60" | "BD01......200" | "MC-4400, 2.7"
const scaleFormula = (rawFormula, targetVol) => {
  if (!rawFormula) return rawFormula;

  const items = [];
  const others = [];

  rawFormula.split(/\r?\n/).forEach((line) => {
    if (!line.trim() || /^\s*tint/i.test(line)) return; // bỏ dòng trống và dòng tiêu đề cũ

    const m = line.match(/^(.*?)[\s.,:;=-]+(\d+(?:[.,]\d+)?)\s*$/);
    const code = m ? m[1].trim() : '';
    if (!m || !/[A-Za-z0-9]/.test(code)) {
      others.push(line);
      return;
    }

    items.push({
      code: code.replace(/^([A-Za-z]+)(\d)/, '$1 $2'), // BD02 -> BD 02
      weight: parseFloat(m[2].replace(',', '.')),
    });
  });

  const total = items.reduce((sum, it) => sum + it.weight, 0);
  if (items.length === 0 || total <= 0) return rawFormula;

  const ratio = targetVol / total;
  const header = 'TINT MÀU'.padEnd(LINE_WIDTH - 4) + 'GRAM';
  const body = items.map((it) =>
    formatFormulaLine(it.code, (it.weight * ratio).toFixed(2).replace('.', ','))
  );

  return [header, ...body, ...others].join('\n');
};

// Tổng khối lượng chuẩn của công thức lưu trên Google Sheet
const STORED_TOTAL_GRAM = 1000;

// Chuyển các dòng "MÃ,SỐ GAM" (người dùng nhập ở Form 3) thành công thức lưu trên Sheet:
// tổng = 1000 gam, dạng "BD 02- - - - - - - - 971,87"
const buildStoredFormula = (lines) => {
  const items = lines.map((l) => {
    const [code, weight] = l.split(',');
    return {
      code: code.trim().replace(/^([A-Za-z]+)(\d)/, '$1 $2'), // BD02 -> BD 02
      weight: parseFloat(weight),
    };
  });

  const total = items.reduce((sum, it) => sum + it.weight, 0);
  if (!(total > 0)) return null;

  // Làm tròn 2 chữ số thập phân, dồn phần chênh lệch vào dòng lớn nhất để tổng đúng 1000,00
  const cents = items.map((it) => Math.round((it.weight / total) * STORED_TOTAL_GRAM * 100));
  const diff = STORED_TOTAL_GRAM * 100 - cents.reduce((a, b) => a + b, 0);
  cents[cents.indexOf(Math.max(...cents))] += diff;

  return items
    .map((it, i) => formatFormulaLine(it.code, (cents[i] / 100).toFixed(2).replace('.', ',')))
    .join('\n');
};

// ---------------------------------------------------------------------------
// ĐỔI MẬT KHẨU TÀI KHOẢN
// Muốn đổi mật khẩu của tài khoản nào thì thêm một dòng vào đây.
// - Tên tài khoản phải viết đúng như tên tab trong Google Sheet
//   (admin, User Login 1, ..., User Login 20).
// - Tài khoản không có trong danh sách này sẽ dùng mật khẩu mặc định.
// Ví dụ:
//   'admin': 'MatKhauMoiCuaAdmin',
//   'User Login 1': 'MatKhauMoi1',
// ---------------------------------------------------------------------------
const PASSWORD_OVERRIDES = {
  // 'admin': 'MatKhauMoiCuaAdmin',
  // 'User Login 1': 'MatKhauMoi1',
};

function App() {
  const [currentForm, setCurrentForm] = useState('form1');

  // ---------------------------------------------------------------------------
  // 1. DANH SÁCH 21 TÀI KHOẢN ĐĂNG NHẬP (ADMIN + USER LOGIN 1 ĐẾN 20)
  // ---------------------------------------------------------------------------
  const accountsDatabase = {
    admin: 'admin123@',
    ...Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`User Login ${i + 1}`, `userpass${i + 1}#`])
    ),
    ...PASSWORD_OVERRIDES
  };

  // ---------------------------------------------------------------------------
  // 2. DATA CACHE MÃ HEX (CSV LOCAL, DÙNG CHO FORM 3)
  // ---------------------------------------------------------------------------
  const [ralHexCache, setRalHexCache] = useState([]);
  const [pantoneHexCache, setPantoneHexCache] = useState([]);

  useEffect(() => {
    const loadCsv = (filePath) => {
      return new Promise((resolve) => {
        Papa.parse(filePath, {
          download: true,
          header: true,
          skipEmptyLines: 'greedy',
          transformHeader: (h) => h.trim(),
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
    ]).then(([ralHex, panHex]) => {
      setRalHexCache(ralHex);
      setPantoneHexCache(panHex);
    });
  }, []);

  const cleanSearchString = (str) => {
    return String(str || '')
      .toLowerCase()
      .replace(/[\[\]'"\s\-_]/g, '');
  };

  // "RAL-1003" / "ral 1003" / "1003" -> "1003"
  const stripPrefix = (s) => cleanSearchString(s).replace(/^(ral|pantone)/, '');

  const extractDigits = (str) => {
    const num = String(str || '').match(/\d+/);
    return num ? num[0] : '';
  };

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

  const findInLocalCache = (query, cacheList) => {
    if (!query || !cacheList || cacheList.length === 0) return null;

    const rawKw = query.trim();
    const cleanKw = cleanSearchString(rawKw);
    const digitsKw = extractDigits(rawKw);

    let found = cacheList.find((row) =>
      Object.values(row).some((val) => cleanSearchString(val) === cleanKw)
    );
    if (found) return found;

    if (digitsKw) {
      found = cacheList.find((row) =>
        Object.values(row).some((val) => {
          const valDigits = extractDigits(val);
          return valDigits && valDigits === digitsKw;
        })
      );
      if (found) return found;
    }

    found = cacheList.find((row) =>
      Object.values(row).some((val) => {
        const cVal = cleanSearchString(val);
        return cVal && (cVal.includes(cleanKw) || cleanKw.includes(cVal));
      })
    );
    return found || null;
  };

  const fetchOnlineHex = async (query, systemType) => {
    try {
      const cleanQ = query.trim().toUpperCase();
      let searchKey = cleanQ;

      if (systemType === 'PANTONE') {
        searchKey = cleanQ.startsWith('PANTONE') ? cleanQ : `PANTONE ${cleanQ}`;
      } else if (systemType === 'RAL') {
        searchKey = cleanQ.startsWith('RAL') ? cleanQ : `RAL ${cleanQ}`;
      }

      const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://encycolorpedia.com/p/search?q=${searchKey}`)}`);

      if (res.ok) {
        const text = await res.text();
        const hexMatches = text.match(/#([0-9A-Fa-f]{6})/g);
        if (hexMatches && hexMatches.length > 0) {
          return hexMatches[0].toUpperCase();
        }
      }
    } catch (e) {
      console.log('Không thể tra cứu màu trực tuyến:', e);
    }
    return null;
  };

  // ---------------------------------------------------------------------------
  // 3. FORM 1: ĐĂNG NHẬP
  // ---------------------------------------------------------------------------
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const trimmedUser = username.trim();
    if (accountsDatabase[trimmedUser] && accountsDatabase[trimmedUser] === password) {
      setCurrentForm('form2');
    } else {
      alert('Tên đăng nhập hoặc mật khẩu không chính xác!');
    }
  };

  // ---------------------------------------------------------------------------
  // 4. FORM 2: TRA CỨU MÀU (ĐỌC TỪ GOOGLE SHEET CỦA TÀI KHOẢN ĐANG ĐĂNG NHẬP)
  // ---------------------------------------------------------------------------
  const [colorSystem, setColorSystem] = useState('RAL COLOR');
  const [colorCode, setColorCode] = useState('');
  const [volumeGram, setVolumeGram] = useState('1000');
  const [customerNameForm2, setCustomerNameForm2] = useState('');

  const [displayHex, setDisplayHex] = useState('#FFFFFF');
  const [searchResultFormula, setSearchResultFormula] = useState('');
  const [isSearchingForm2, setIsSearchingForm2] = useState(false);

  const handleResetForm2 = () => {
    setColorSystem('RAL COLOR');
    setColorCode('');
    setVolumeGram('1000');
    setCustomerNameForm2('');
    setDisplayHex('#FFFFFF');
    setSearchResultFormula('');
  };

  const handleSearchForm2 = async () => {
    const isCustomer = colorSystem === 'KHÁCH HÀNG';
    const isPantone = colorSystem === 'PANTONE COLOR';

    if (isCustomer && !customerNameForm2.trim()) {
      alert('Vui lòng nhập tên khách hàng!');
      return;
    }
    if (!isCustomer && !colorCode.trim()) {
      alert('Vui lòng nhập mã màu!');
      return;
    }
    const targetVol = parseFloat(volumeGram);
    if (!targetVol || targetVol <= 0) {
      alert('Vui lòng nhập số gram hợp lệ!');
      return;
    }

    setIsSearchingForm2(true);
    setSearchResultFormula('Đang tải dữ liệu từ Google Sheet...');

    try {
      const res = await fetch(`${SCRIPT_URL}?userLogin=${encodeURIComponent(username.trim())}`);
      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(
          'Apps Script không trả về dữ liệu JSON. Hãy kiểm tra đã triển khai PHIÊN BẢN MỚI có hàm doGet và quyền truy cập là "Bất kỳ ai".'
        );
      }
      if (!data.ok) throw new Error(data.error || 'Không đọc được dữ liệu');
      const rows = data.rows;

      let matches = [];

      if (isCustomer) {
        // MÀU KHÁCH HÀNG: đọc cột A, B, C, D, E (mã màu có thể để trống)
        const nameKw = cleanSearchString(customerNameForm2);
        const codeKw = stripPrefix(colorCode);
        matches = rows.filter((r) => {
          const nameOk = cleanSearchString(r.customerName).includes(nameKw);
          const codeOk =
            !codeKw ||
            stripPrefix(r.ralCode).includes(codeKw) ||
            stripPrefix(r.pantoneCode).includes(codeKw);
          return nameOk && codeOk;
        });
      } else {
        // MÀU RAL: cột B, D, E | MÀU PANTONE: cột C, D, E
        // Chỉ lấy các dòng không thuộc khách hàng nào
        const codeKey = isPantone ? 'pantoneCode' : 'ralCode';
        const kw = stripPrefix(colorCode);
        const pool = rows.filter((r) => !r.customerName.trim() && r[codeKey].trim());
        const exact = pool.filter((r) => stripPrefix(r[codeKey]) === kw);
        matches = exact.length > 0 ? exact : pool.filter((r) => stripPrefix(r[codeKey]).startsWith(kw));
      }

      if (matches.length === 0) {
        setSearchResultFormula(
          `Không tìm thấy công thức phù hợp!\n(Đã đọc ${rows.length} dòng từ tab "${username.trim()}")`
        );
        setDisplayHex('#FFFFFF');
        return;
      }

      const blocks = matches.map((r, i) => {
        const head = isCustomer
          ? [r.customerName, r.ralCode, r.pantoneCode, r.colorHex].filter(Boolean).join(' | ')
          : [isPantone ? r.pantoneCode : r.ralCode, r.colorHex].filter(Boolean).join(' | ');
        const prefix = matches.length > 1 ? `[${i + 1}] ` : '';
        return `${prefix}${head}\n${scaleFormula(r.formula.trim(), targetVol)}`;
      });
      setSearchResultFormula(blocks.join('\n\n--------------------\n\n'));

      // Màu xem trước lấy từ cột D của kết quả đầu tiên có mã HEX
      const hexItem = matches
        .map((r) => (r.colorHex.match(/#[0-9A-Fa-f]{6}/) || [])[0])
        .find(Boolean);
      setDisplayHex(hexItem ? hexItem.toUpperCase() : '#CCCCCC');
    } catch (err) {
      console.error(err);
      setSearchResultFormula('Lỗi khi đọc dữ liệu: ' + err.message);
    } finally {
      setIsSearchingForm2(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. FORM 3: CẬP NHẬT CÔNG THỨC
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
    let cache = optionForm3 === 'PANTONE COLOR' ? pantoneHexCache : ralHexCache;
    let prefix = optionForm3 === 'PANTONE COLOR' ? 'PANTONE' : 'RAL';

    let foundRow = findInLocalCache(rawKw, cache);

    if (foundRow) {
      const hexVal = extractHexFromRow(foundRow);
      let codeVal = extractCodeFromRow(foundRow, rawKw);
      codeVal = codeVal.replace(/^(RAL|PANTONE)[\s\-_]*/i, '').trim();

      setColorHexResultForm3(`${prefix}-${codeVal.toUpperCase()},${hexVal}`);
      setPreviewHexForm3(hexVal);
      return;
    }

    setIsSearchingOnline(true);
    const onlineHex = await fetchOnlineHex(rawKw, prefix);
    setIsSearchingOnline(false);

    if (onlineHex) {
      let cleanCode = rawKw.replace(/^(RAL|PANTONE)[\s\-_]*/i, '').trim().toUpperCase();
      setColorHexResultForm3(`${prefix}-${cleanCode},${onlineHex}`);
      setPreviewHexForm3(onlineHex);
    } else {
      alert(`Không tìm thấy mã HEX cho "${rawKw}" trong file CSV local lẫn trực tuyến!`);
      setPreviewHexForm3('#FFFFFF');
    }
  };

  // NÚT LƯU CÔNG THỨC (GHI VÀO GOOGLE SHEET THÔNG QUA HIDDEN FORM SUBMIT)
  const handleSaveForm3 = () => {
    const isCustomer = optionForm3 === 'KHÁCH HÀNG';

    if (!formulaInputForm3.trim()) {
      alert('Vui lòng nhập công thức pha màu!');
      return;
    }

    // Kiểm tra từng dòng công thức: MÃ,SỐ GAM (ví dụ: BD02,100)
    const formulaLines = formulaInputForm3
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const badLine = formulaLines.find((l) => !/^[^,]+,\s*\d+(\.\d+)?$/.test(l));
    if (badLine) {
      alert(`Dòng công thức sai định dạng: "${badLine}"\nĐúng định dạng: MÃ,SỐ GAM (ví dụ: BD02,100)`);
      return;
    }

    // Chuẩn hóa về tổng 1000 gam và trình bày dạng "BD 02- - - - - - - - 971,87"
    const cleanFormula = buildStoredFormula(formulaLines);
    if (!cleanFormula) {
      alert('Tổng số gam của công thức phải lớn hơn 0!');
      return;
    }

    if (isCustomer && !customerNameForm3.trim()) {
      alert('Vui lòng nhập tên khách hàng!');
      return;
    }
    if (!isCustomer && !colorHexResultForm3.trim()) {
      alert('Vui lòng nhập hoặc tìm mã màu (VD: RAL-7035,#CBD0CC)!');
      return;
    }

    try {
      let ralCodeVal = '';
      let pantoneCodeVal = '';
      let hexOnly = '';

      if (colorHexResultForm3.includes(',')) {
        const parts = colorHexResultForm3.split(',');
        const fullCode = parts[0].trim();
        hexOnly = (parts[1] || '').trim();

        if (optionForm3.toUpperCase().includes('RAL') || fullCode.toUpperCase().startsWith('RAL')) {
          ralCodeVal = fullCode;
        } else if (optionForm3.toUpperCase().includes('PANTONE') || fullCode.toUpperCase().startsWith('PANTONE')) {
          pantoneCodeVal = fullCode;
        } else {
          ralCodeVal = fullCode;
        }
      } else {
        hexOnly = colorHexResultForm3.trim();
      }

      // Tạo Form ẩn để submit trực tiếp qua trình duyệt (bỏ qua mọi lỗi CORS)
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = SCRIPT_URL;
      form.target = 'hidden_iframe';

      const payload = {
        userLogin: username.trim(),
        // Chỉ lưu tên khách hàng khi chọn MÀU KHÁCH HÀNG
        customerName: isCustomer ? customerNameForm3.trim() : '',
        ralCode: ralCodeVal,
        pantoneCode: pantoneCodeVal,
        colorHex: hexOnly,
        formula: cleanFormula,
        system: optionForm3,
      };

      for (const key in payload) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = payload[key];
        form.appendChild(input);
      }

      let iframe = document.getElementById('hidden_iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.name = 'hidden_iframe';
        iframe.id = 'hidden_iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      alert('Đã gửi dữ liệu vào Google Sheet! Hãy kiểm tra lại tab của tài khoản để chắc chắn đã có dòng mới.');
      handleResetForm3();
    } catch (error) {
      console.error('Lỗi lưu Google Sheet:', error);
      alert('Có lỗi xảy ra khi lưu vào Google Sheet!');
    }
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
                <label style={styles.label}>TÊN ĐĂNG NHẬP (admin hoặc User Login 1 - 20):</label>
                <input
                  type="text"
                  style={styles.textInput}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: admin hoặc User Login 1"
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
              <span style={{ fontSize: '11px', color: '#2b6cb0', fontWeight: 'bold' }}>Tài khoản: {username}</span>
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
              <label style={styles.label}>
                MÃ MÀU{colorSystem === 'KHÁCH HÀNG' ? ' (có thể để trống):' : ':'}
              </label>
              <input
                type="text"
                style={styles.textInput}
                placeholder="Ví dụ: 1003, 7035, 227..."
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>TRỌNG LƯỢNG (GAM):</label>
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
                rows={10}
                readOnly
                style={{ ...styles.textAreaInput, backgroundColor: '#f8f9fa', whiteSpace: 'pre', overflowX: 'auto' }}
                value={searchResultFormula}
                placeholder="Kết quả công thức pha màu sẽ hiển thị tại đây..."
              />
            </div>

            <div style={styles.actionButtonsRow}>
              <button
                style={{ ...styles.actionBtn, backgroundColor: isSearchingForm2 ? '#6c757d' : '#28a745' }}
                onClick={handleSearchForm2}
                disabled={isSearchingForm2}
              >
                {isSearchingForm2 ? 'ĐANG TÌM...' : 'TÌM KIẾM'}
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
              <span style={{ fontSize: '11px', color: '#2b6cb0', fontWeight: 'bold' }}>Đang ghi vào Tab: {username}</span>
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
              <label style={styles.label}>TÊN KHÁCH HÀNG (Cột A):</label>
              <input
                type="text"
                style={optionForm3 === 'KHÁCH HÀNG' ? styles.textInput : styles.disabledInput}
                disabled={optionForm3 !== 'KHÁCH HÀNG'}
                value={customerNameForm3}
                onChange={(e) => setCustomerNameForm3(e.target.value)}
                placeholder={optionForm3 === 'KHÁCH HÀNG' ? 'Nhập tên khách hàng...' : 'Chỉ nhập khi chọn MÀU KHÁCH HÀNG'}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>TÌM MÃ HEX:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  style={{ ...styles.textInput, flex: 1 }}
                  placeholder="Gõ mã màu (VD: 7035, 227)..."
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
                placeholder="Ví dụ: RAL-7035,#CBD0CC"
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
                placeholder={"Ví dụ:\nBD02,100\nBD03,300\nBD04,700"}
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
