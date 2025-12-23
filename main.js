document.addEventListener('DOMContentLoaded', function () {
  // Mobile menu toggle
  const burger = document.getElementById('hamburger');
  const mobile = document.getElementById('mobile-menu');
  if (burger && mobile) {
    burger.addEventListener('click', function () {
      mobile.style.display = (mobile.style.display === 'none' || mobile.style.display === '') ? 'flex' : 'none';
    });
  }

  const form = document.getElementById('stamp-form');
  const previewHost = document.getElementById('stamp-preview');

  if (!form || !previewHost) return;

  // Color button functionality
  const colorButtons = form.querySelectorAll('button[data-color]');
  colorButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      colorButtons.forEach(function(b) {
        b.setAttribute('data-active', '0');
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline');
      });
      
      this.setAttribute('data-active', '1');
      this.classList.remove('btn-outline');
      this.classList.add('btn-primary');
      
      renderPreview();
    });
  });

  function toggleFields(template) {
    const groups = form.querySelectorAll('.template-fields');
    groups.forEach(function (g) {
      const targets = g.dataset.for.split(',').map(s => s.trim());
      if (targets.includes(template)) {
        g.classList.add('active');
      } else {
        g.classList.remove('active');
      }
    });
  }

  const templateSelect = form.querySelector('[name="template"]');
  if (templateSelect) {
    toggleFields(templateSelect.value);
    templateSelect.addEventListener('change', function () {
      toggleFields(this.value);
      renderPreview();
    });
  }

  // Input change listeners for real-time preview
  const inputs = form.querySelectorAll('input');
  inputs.forEach(function(input) {
    input.addEventListener('input', function() {
      renderPreview();
    });
  });

  function shortHash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h).toString(16).toUpperCase().slice(0, 6);
  }

  function getTextColor(c) {
    if (c === 'red') return '#D33';
    if (c === 'blue') return '#1565C0';
    return '#1F2D3D';
  }

  function readForm() {
    const ssmNoNew = form.querySelector('[name="ssmNoNew"]')?.value || '';

    return {
      companyName: form.querySelector('[name="companyName"]')?.value || '',
      ssmNo: ssmNoNew,
      ssmNoNew: ssmNoNew,
      ssmNoOld: form.querySelector('[name="ssmNoOld"]')?.value || '',
      address: [
        form.querySelector('[name="address1"]')?.value || '',
        form.querySelector('[name="address2"]')?.value || '',
        form.querySelector('[name="address3"]')?.value || ''
      ],
      phone: form.querySelector('[name="phone"]')?.value || '',
      email: form.querySelector('[name="email"]')?.value || '',
      template: form.querySelector('[name="template"]')?.value || 'round',
      color: (form.querySelector('button[data-color][data-active="1"]')?.dataset.color) || 'black',
      billingEmail: form.querySelector('[name="billingEmail"]')?.value || ''
    };
  }

  function roundStamp(d, tc, ff) {
    const text = (d.companyName || '').toUpperCase();
    const cx = 140, cy = 140, R = 80, step = 10;

    let chars = '';
    const total = (text.length ? text.length - 1 : 0) * step,
          start = -total / 2;

    function pol(cx, cy, r, a) {
      const rad = (a - 90) * Math.PI / 180;
      return {
        x: cx + r * Math.cos(rad),
        y: cy + r * Math.sin(rad)
      };
    }
    
    for (let i = 0; i < text.length; i++) {
      const ang = start + i * step,
            p = pol(cx, cy, R, ang);
      chars += `<text x="${p.x}" y="${p.y}" fill="${tc}" font-size="20" font-family="${ff}" font-weight="700" text-anchor="middle" dominant-baseline="middle" transform="rotate(${ang}, ${p.x}, ${p.y})">${text[i]}</text>`;
    }

    let mid = '';
    if (d.ssmNoNew) {
      mid += `<text x="${cx}" y="${cy - 8}" font-size="13" text-anchor="middle" fill="${tc}" font-family="${ff}" font-weight="600">${d.ssmNoNew.toUpperCase()}</text>`;
    }
    if (d.ssmNoOld) {
      mid += `<text x="${cx}" y="${cy + 12}" font-size="13" text-anchor="middle" fill="${tc}" font-family="${ff}" font-weight="600">${d.ssmNoOld.toUpperCase()}</text>`;
    }

    return `
      <svg width="280" height="280" viewBox="0 0 280 280" role="img">
        <circle cx="${cx}" cy="${cy}" r="110" stroke="${tc}" stroke-width="6" fill="none" />
        ${chars}
        <circle cx="${cx}" cy="${cy}" r="50" stroke="${tc}" stroke-width="2" fill="none" />
        ${mid}
      </svg>
    `;
  }

  function boxStamp(d, tc, ff) {
    const cx = 180;
    const lines = [];

    if (d.companyName) lines.push({
      text: d.companyName.toUpperCase(),
      size: 22,
      weight: 700
    });
    if (d.ssmNo) lines.push({
      text: d.ssmNo.toUpperCase(),
      size: 14,
      weight: 600,
      extraGap: 8
    });
    (d.address || []).forEach(line => {
      if (line) lines.push({
        text: line.toUpperCase(),
        size: 13,
        weight: 500
      });
    });

    const totalHeight = lines.length * 20 + lines.reduce((acc, l) => acc + (l.extraGap || 0), 0);
    const startY = (220 - totalHeight) / 2 + 20;

    let y = startY;
    const svgLines = lines.map(l => {
      const out = `<text x="${cx}" y="${y}" font-size="${l.size}" fill="${tc}" font-family="${ff}" font-weight="${l.weight}" text-anchor="middle">${l.text}</text>`;
      y += 20 + (l.extraGap || 0);
      return out;
    }).join('');

    return `
      <svg width="320" height="200" viewBox="0 0 360 220" role="img" aria-label="Box stamp">
        <rect x="8" y="8" width="344" height="204" stroke="${tc}" stroke-width="3" fill="none" rx="4" />
        ${svgLines}
      </svg>
    `;
  }

  function infoStamp(d, tc, ff) {
    const cx = 180;
    const lines = [];

    if (d.companyName) lines.push({
      text: d.companyName.toUpperCase(),
      size: 22,
      weight: 700
    });
    if (d.ssmNo) lines.push({
      text: d.ssmNo.toUpperCase(),
      size: 14,
      weight: 600,
      extraGap: 8
    });
    (d.address || []).forEach(line => {
      if (line) lines.push({
        text: line.toUpperCase(),
        size: 13,
        weight: 500
      });
    });
    if (d.phone) lines.push({
      text: d.phone,
      size: 13,
      weight: 500,
      extraGap: 8
    });
    if (d.email) lines.push({
      text: d.email.toLowerCase(),
      size: 13,
      weight: 500
    });

    const totalHeight = lines.length * 20 + lines.reduce((acc, l) => acc + (l.extraGap || 0), 0);
    const startY = (260 - totalHeight) / 2 + 20;

    let y = startY;
    const svgLines = lines.map(l => {
      const out = `<text x="${cx}" y="${y}" font-size="${l.size}" fill="${tc}" font-family="${ff}" font-weight="${l.weight}" text-anchor="middle">${l.text}</text>`;
      y += 20 + (l.extraGap || 0);
      return out;
    }).join('');

    return `
      <svg width="320" height="260" viewBox="0 0 360 260" role="img" aria-label="Info stamp">
        <rect x="8" y="8" width="344" height="244" stroke="${tc}" stroke-width="3" fill="none" rx="4" />
        ${svgLines}
      </svg>
    `;
  }

  function buildSVG(d) {
    const tc = getTextColor(d.color || 'black');
    const ff = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    if (d.template === 'box') return boxStamp(d, tc, ff);
    if (d.template === 'info') return infoStamp(d, tc, ff);
    return roundStamp(d, tc, ff);
  }

  function renderPreview() {
    const d = readForm();
    const svg = buildSVG(d);
    previewHost.innerHTML = [
      '<div id="stamp-preview-wrapper" style="position:relative;display:inline-block;padding:16px;background:#F7F9FA;border-radius:8px;overflow:hidden;">',
      svg,
      '<div aria-hidden="true" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;font-size:56px;font-weight:900;letter-spacing:6px;text-transform:uppercase;transform:rotate(-22deg);color:rgba(0,0,0,0.22);text-shadow:0 0 2px rgba(255,255,255,0.6), 0 0 8px rgba(255,255,255,0.35);user-select:none;">PREVIEW</div>',
      '<div aria-hidden="true" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;font-size:42px;font-weight:800;letter-spacing:4px;text-transform:uppercase;transform:rotate(18deg);color:rgba(0,0,0,0.12);user-select:none;">WATERMARK</div>',
      '</div>'
    ].join('');
  }

  renderPreview();

  // Download Free Version
  function downloadStamp(isHD, isPaid = false) {
    const d = readForm();
    const billingEmail = d.billingEmail;
    
    if (!billingEmail) {
      alert('Please enter your billing email to download.');
      form.querySelector('[name="billingEmail"]').focus();
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(billingEmail)) {
      alert('Please enter a valid email address.');
      return;
    }
    
    const fileName = 'Company_Chop_' + 
                    (d.companyName ? d.companyName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) : 'Stamp') + 
                    '_' + Date.now() + 
                    (isHD ? '_HD' : '') + 
                    '.png';
    
    try {
      const cleanSVG = buildSVG(d);
      
      const svgContainer = document.createElement('div');
      svgContainer.style.position = 'fixed';
      svgContainer.style.left = '-9999px';
      svgContainer.style.top = '-9999px';
      svgContainer.innerHTML = cleanSVG;
      document.body.appendChild(svgContainer);
      
      const svgElement = svgContainer.querySelector('svg');
      const svgWidth = parseInt(svgElement.getAttribute('width')) || 280;
      const svgHeight = parseInt(svgElement.getAttribute('height')) || 280;
      const scale = isHD ? 3 : 2;
      
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth * scale;
      canvas.height = svgHeight * scale;
      const ctx = canvas.getContext('2d');
      
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = function() {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        if (!isHD) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          ctx.font = 'bold ' + (canvas.width * 0.08) + 'px Arial';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.save();
          ctx.translate(canvas.width/2, canvas.height/2);
          ctx.rotate(-Math.PI/6);
          ctx.fillText('FREE VERSION', 0, 0);
          ctx.restore();
        }
        
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        document.body.removeChild(svgContainer);
        
        alert(isHD ? 'HD version requires payment.' : '✅ Free Version downloaded!');
      };
      
      img.onerror = function() {
        alert('Error loading image. Please try again.');
        document.body.removeChild(svgContainer);
      };
      
      img.src = url;
      
    } catch (error) {
      console.error('Download error:', error);
      alert('Error generating image. Please try a different browser.');
    }
  }

  document.getElementById('btn-download-free').addEventListener('click', function() {
    downloadStamp(false);
  });

  // =============================================
  // DIRECT REDIRECT PAYMENT (NO IFRAME)
  // =============================================

  document.getElementById('btn-download-hd').addEventListener('click', function() {
    const d = readForm();
    const billingEmail = d.billingEmail;
    
    // Validate email
    if (!billingEmail) {
      alert('Please enter your billing email to proceed.');
      form.querySelector('[name="billingEmail"]').focus();
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(billingEmail)) {
      alert('Please enter a valid email address.');
      return;
    }
    
    // Validate company name
    if (!d.companyName || d.companyName.trim() === '') {
      alert('Please enter your company name.');
      form.querySelector('[name="companyName"]').focus();
      return;
    }
    
    // Generate unique order reference
    const timestamp = Date.now();
    const shortHash = Math.random().toString(36).substring(2, 10).toUpperCase();
    const orderRef = `WEBSTAMP_${timestamp}_${shortHash}`;
    
    console.log('📦 Preparing payment redirect...');
    
    // Create complete stamp data
    const stampData = {
      cn: (d.companyName || '').trim(),
      sn: (d.ssmNo || '').trim(),
      t: d.template || 'round',
      c: d.color || 'black',
      e: billingEmail.trim(),
      a1: (d.address[0] || '').trim(),
      a2: (d.address[1] || '').trim(),
      a3: (d.address[2] || '').trim(),
      p: (d.phone || '').trim(),
      so: (d.ssmNoOld || '').trim(),
      ts: timestamp,
      or: orderRef
    };
    
    // TRIPLE STORAGE STRATEGY - Data survives page redirect
    console.log('💾 Saving to localStorage...');
    
    // 1. Full data with order reference
    localStorage.setItem(`stamp_${orderRef}`, JSON.stringify(stampData));
    
    // 2. Track last order
    localStorage.setItem('last_order_ref', orderRef);
    
    // 3. Set expiry (1 hour from now)
    localStorage.setItem(`stamp_exp_${orderRef}`, (timestamp + 3600000).toString());
    
    // 4. Minimal backup (in case full data corrupts)
    const minimalData = {
      cn: stampData.cn,
      sn: stampData.sn,
      t: stampData.t,
      c: stampData.c,
      or: orderRef
    };
    localStorage.setItem(`stamp_min_${orderRef}`, JSON.stringify(minimalData));
    
    console.log('✅ Data saved to localStorage:', orderRef);
    console.log('📊 Storage keys created:', {
      full: `stamp_${orderRef}`,
      minimal: `stamp_min_${orderRef}`,
      expiry: `stamp_exp_${orderRef}`,
      last: 'last_order_ref'
    });
    
    // Build return URL with session parameter
    const baseUrl = window.location.origin;
    const returnUrl = `${baseUrl}/success.html?session=${orderRef}&order_ref=${orderRef}&status=success`;
    const cancelUrl = `${baseUrl}/index.html?payment=cancelled`;
    
    // Build BCL payment URL (DIRECT REDIRECT - NO IFRAME)
    const bclParams = new URLSearchParams({
      'order_ref': orderRef,
      'customer_email': billingEmail,
      'customer_name': (d.companyName || 'Customer').substring(0, 50),
      'product': `HD Stamp - ${(d.companyName || 'Company').substring(0, 20)}`,
      'amount': '3.00',
      'currency': 'MYR',
      'return_url': returnUrl,
      'cancel_url': cancelUrl
    });
    
    const bclPaymentUrl = `https://intern.bcl.my/embed/form/webcop-hd-version?${bclParams.toString()}`;
    
    console.log('🔗 Payment URL created');
    console.log('📋 Order Reference:', orderRef);
    console.log('🎯 Return URL:', returnUrl);
    console.log('🚀 Redirecting to BCL payment page...');
    
    // Show loading message
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      color: white;
      font-size: 1.2rem;
      text-align: center;
      flex-direction: column;
      gap: 20px;
    `;
    loadingOverlay.innerHTML = `
      <div style="font-size: 3rem;">💳</div>
      <div><strong>Redirecting to Secure Payment...</strong></div>
      <div style="font-size: 0.9rem; color: #ccc;">Your stamp data has been saved securely</div>
      <div style="font-size: 0.8rem; color: #999;">Order: ${orderRef}</div>
    `;
    document.body.appendChild(loadingOverlay);
    
    // Redirect after 1.5 seconds (gives time to see the message)
    setTimeout(() => {
      window.location.href = bclPaymentUrl;
    }, 1500);
  });
  
  // =============================================
  // TEST FUNCTION FOR DEVELOPMENT
  // =============================================
  
  window.testPaymentFlow = function() {
    console.log('🧪 Testing payment flow (simulating BCL redirect)...');
    
    const d = readForm();
    const orderRef = 'TEST_' + Date.now();
    
    const testData = {
      cn: d.companyName || 'TEST COMPANY SDN BHD',
      sn: d.ssmNo || '202401234567',
      t: d.template || 'round',
      c: d.color || 'black',
      e: d.billingEmail || 'test@example.com',
      a1: d.address[0] || 'Test Address Line 1',
      a2: d.address[1] || 'Test Address Line 2',
      a3: d.address[2] || 'Test Address Line 3',
      p: d.phone || '+603-1234 5678',
      so: d.ssmNoOld || '123456-A',
      ts: Date.now(),
      or: orderRef
    };
    
    // Save to localStorage (simulating what happens before redirect)
    localStorage.setItem(`stamp_${orderRef}`, JSON.stringify(testData));
    localStorage.setItem('last_order_ref', orderRef);
    localStorage.setItem(`stamp_exp_${orderRef}`, (Date.now() + 3600000).toString());
    localStorage.setItem(`stamp_min_${orderRef}`, JSON.stringify({
      cn: testData.cn,
      sn: testData.sn,
      t: testData.t,
      c: testData.c,
      or: orderRef
    }));
    
    console.log('✅ Test data saved to localStorage');
    console.log('🔄 Simulating BCL redirect back to success page...');
    
    // Simulate redirect to success page (like BCL would do)
    setTimeout(() => {
      window.location.href = `success.html?status=success&order_ref=${orderRef}&session=${orderRef}&customer_email=${encodeURIComponent(testData.e)}&amount=3.00&payment_method=bcl_redirect&test_mode=true`;
    }, 1000);
  };
});
