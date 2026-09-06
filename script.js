/**
 * script.js - ไฟล์สคริปต์ส่วนกลางสำหรับเว็บไซต์ SonicClean
 */

// URL สำหรับส่งคำสั่งซื้อ (Apps Script Web App)
const scriptURL = 'https://script.google.com/macros/s/AKfycbyFNNXfRo8g52hsBsOrFRfz4XsEoo2d-kMNpbikO-C4Z-P89kjAb315S-AhhPtTBfQ1XA/exec';

// URL สำหรับดึงข้อมูลออเดอร์มาแสดงผลในหน้า Admin (Google Sheet Published CSV)
const csvURL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqGhuNT1yiQnu_Xx7ay-ySVTwWssLqBlZXK8G-lxlBleITWaXASQooIw9bZP0pSN7avMvo88U94EZr/pub?gid=0&single=true&output=csv';

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------
  // 1. จัดการการสั่งซื้อ (หน้า buy.html)
  // -------------------------------------------------------------
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    const submitBtn = document.getElementById('submitBtn');

    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // เปลี่ยนสถานะปุ่มเป็นกำลังส่งข้อมูล
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
      submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        กำลังบันทึกคำสั่งซื้อ...
      `;

      const payload = {
        fullName: document.getElementById('fullName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        price: '590'
      };

      // ส่งข้อมูล POST แบบ JSON String โดยไม่ตั้ง Header เพื่อไม่ให้ติดปัญหา CORS Preflight
      fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
      .then(() => {
        alert('สั่งซื้อสินค้าสำเร็จ! ทางเราจะเร่งจัดส่งสินค้าให้คุณโดยเร็ว');
        orderForm.reset();
        window.location.href = 'index.html';
      })
      .catch(error => {
        console.error('Submission failed:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        submitBtn.innerHTML = '<span>ยืนยันการสั่งซื้อ</span>';
      });
    });
  }

  // -------------------------------------------------------------
  // 2. จัดการหน้า Dashboard แอดมิน (หน้า admin.html)
  // -------------------------------------------------------------
  const ordersTableBody = document.getElementById('ordersTableBody');
  const refreshBtn = document.getElementById('refreshBtn');

  if (ordersTableBody) {
    // ฟังก์ชันช่วยตัดแบ่งคอลัมน์จากแถว CSV ให้ถูกต้อง
    const parseCSVLine = (text) => {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    // ฟังก์ชันดึงและแปลง CSV มาแสดงในตาราง
    const fetchOrdersFromCSV = () => {
      ordersTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="py-12 text-center text-slate-400">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-sky-600 mb-2"></div>
            <p>กำลังโหลดข้อมูลคำสั่งซื้อ...</p>
          </td>
        </tr>
      `;

      fetch(csvURL)
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.text();
        })
        .then(csvText => {
          const lines = csvText.trim().split(/\r?\n/).filter(line => line.trim() !== '');

          // กรณีมีเฉพาะแถว Header หรือยังไม่มีข้อมูล
          if (lines.length <= 1) {
            ordersTableBody.innerHTML = `
              <tr>
                <td colspan="5" class="py-10 text-center text-slate-400">ยังไม่มีรายการสั่งซื้อในระบบ</td>
              </tr>
            `;
            return;
          }

          // ตัดแถวแรก (Header) ออก แล้วแปลงข้อมูลทีละแถว
          const dataRows = lines.slice(1).map(line => parseCSVLine(line));

          // เรียงรายการล่าสุดขึ้นก่อน
          ordersTableBody.innerHTML = dataRows.slice().reverse().map(row => `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">${row[0] || '-'}</td>
              <td class="py-3.5 px-4 font-medium text-slate-900">${row[1] || '-'}</td>
              <td class="py-3.5 px-4 text-slate-600">${row[2] || '-'}</td>
              <td class="py-3.5 px-4 text-slate-600 max-w-xs truncate" title="${row[3] || ''}">${row[3] || '-'}</td>
              <td class="py-3.5 px-4 text-right font-semibold text-sky-600">฿${row[4] || '590'}</td>
            </tr>
          `).join('');
        })
        .catch(err => {
          console.error('Error fetching CSV:', err);
          ordersTableBody.innerHTML = `
            <tr>
              <td colspan="5" class="py-8 text-center text-rose-500">
                ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้ กรุณาตรวจสอบว่า Sheet ได้ Publish to web แบบ CSV แล้ว
              </td>
            </tr>
          `;
        });
    };

    // โหลดข้อมูลอัตโนมัติเมื่อเข้าหน้า admin.html
    fetchOrdersFromCSV();

    // ผูกปุ่มรีเฟรช
    if (refreshBtn) {
      refreshBtn.addEventListener('click', fetchOrdersFromCSV);
    }
  }
});