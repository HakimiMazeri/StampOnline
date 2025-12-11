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
      // Remove active from all color buttons
      colorButtons.forEach(function(b) {
        b.setAttribute('data-active', '0');
        b.classList.remove('btn-primary');
        b.classList.add('btn-outline');
      });
      
      // Set active on clicked button
      this.setAttribute('data-active', '1');
      this.classList.remove('btn-outline');
      this.classList.add('btn-primary');
      
      renderPreview();
    });
  });

  function toggleFields(template) {
    console.log("toggleFields running with", template);
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
      console.log("Template changed:", this.value);
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
      color: (form.querySelector('button[data-color][data-active="1"]')?.dataset.color) || 'black'
    };
  }

  function roundStamp(d, tc, ff) {
    const text = (d.companyName || '').toUpperCase();
    const cx = 140,
          cy = 140,
          R = 80,
          step = 10;

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
    const ff = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    const originId = shortHash((d.companyName || '') + '|' + (d.ssmNo || ''));
    const svg = buildSVG(d);
    previewHost.innerHTML = [
      '<div id="stamp-preview-wrapper" style="position:relative;display:inline-block;padding:16px;background:#F7F9FA;border-radius:8px;overflow:hidden;">',
      svg,
      '<div aria-hidden="true" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;font-size:56px;font-weight:900;letter-spacing:6px;text-transform:uppercase;transform:rotate(-22deg);color:rgba(0,0,0,0.22);text-shadow:0 0 2px rgba(255,255,255,0.6), 0 0 8px rgba(255,255,255,0.35);user-select:none;">PREVIEW</div>',
      '<div aria-hidden="true" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;font-size:42px;font-weight:800;letter-spacing:4px;text-transform:uppercase;transform:rotate(18deg);color:rgba(0,0,0,0.12);user-select:none;">WATERMARK</div>',
      '</div>'
    ].join('');
  }

  // Initial render
  renderPreview();

  // Download function
  function downloadStamp(isHD, isPaid = false) {
    const billingEmail = form.querySelector('[name="billingEmail"]').value;
    
    if (!billingEmail) {
      alert('Please enter your billing email to download.');
      form.querySelector('[name="billingEmail"]').focus();
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(billingEmail)) {
      alert('Please enter a valid email address.');
      return;
    }
    
    // Get form data
    const d = readForm();
    
    // Create filename
    const fileName = 'Company_Chop_' + 
                    (d.companyName ? d.companyName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) : 'Stamp') + 
                    '_' + Date.now() + 
                    (isHD ? '_HD' : '') + 
                    '.png';
    
    try {
      // Get the clean SVG HTML
      const tc = getTextColor(d.color || 'black');
      const ff = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      const cleanSVG = buildSVG(d);
      
      // Create a container for the SVG
      const svgContainer = document.createElement('div');
      svgContainer.style.position = 'fixed';
      svgContainer.style.left = '-9999px';
      svgContainer.style.top = '-9999px';
      svgContainer.style.width = '500px';
      svgContainer.style.height = '500px';
      svgContainer.style.background = 'white';
      svgContainer.innerHTML = cleanSVG;
      document.body.appendChild(svgContainer);
      
      const svgElement = svgContainer.querySelector('svg');
      
      // Set SVG dimensions explicitly
      const svgWidth = parseInt(svgElement.getAttribute('width')) || 280;
      const svgHeight = parseInt(svgElement.getAttribute('height')) || 280;
      
      // Scale factor
      const scale = isHD ? 3 : 2;
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth * scale;
      canvas.height = svgHeight * scale;
      const ctx = canvas.getContext('2d');
      
      // Create image from SVG data URL
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
      const url = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = function() {
        // Draw the SVG image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Add watermark for free version
        if (!isHD) {
          // Add semi-transparent background for watermark
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Redraw the stamp on top
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Add "FREE VERSION" text watermark
          ctx.font = 'bold ' + (canvas.width * 0.08) + 'px Arial';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.save();
          ctx.translate(canvas.width/2, canvas.height/2);
          ctx.rotate(-Math.PI/6);
          ctx.fillText('FREE VERSION', 0, 0);
          ctx.restore();
        } else if (isHD && !isPaid) {
          // HD version without payment
          ctx.font = 'bold ' + (canvas.width * 0.06) + 'px Arial';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.save();
          ctx.translate(canvas.width/2, canvas.height/2);
          ctx.rotate(-Math.PI/6);
          ctx.fillText('HD - PURCHASE REQUIRED', 0, 0);
          ctx.restore();
        } else {
          // HD paid version - clean
          ctx.font = '10px Arial';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText('WebCop.my | BCL', canvas.width - 5, canvas.height - 5);
        }
        
        // Convert canvas to data URL and download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
        document.body.removeChild(svgContainer);
        
        // Show success message
        const message = isHD ? 
          (isPaid ? '✅ HD Version downloaded!\nHigh quality, no watermark.' : 'HD version requires payment. Please click "Download HD (RM3)" to purchase.') : 
          '✅ Free Version downloaded!\nStandard quality with watermark.';
        alert(message);
      };
      
      img.onerror = function() {
        alert('Error loading image. Please try again.');
        document.body.removeChild(svgContainer);
      };
      
      img.src = url;
      
    } catch (error) {
      console.error('Download error:', error);
      alert('Error generating image. Please try a different browser or refresh the page.');
    }
  }

  // Download Free button
  document.getElementById('btn-download-free').addEventListener('click', function() {
    try {
      downloadStamp(false);
    } catch (error) {
      console.error('Free download error:', error);
      alert('Download error. Please try again or check console for details.');
    }
  });

  // BCL Payment Variables
  let currentOrderId = null;
  let currentPaymentData = null;

  // Download HD button - shows payment modal
  document.getElementById('btn-download-hd').addEventListener('click', function() {
    const billingEmail = form.querySelector('[name="billingEmail"]').value;
    
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
    
    // Get form data
    const d = readForm();
    currentPaymentData = {
      email: billingEmail,
      companyName: d.companyName || 'Company Stamp',
      amount: 3.00
    };
    
    // Show BCL payment modal
    showBCLPaymentModal();
  });

  function showBCLPaymentModal() {
    const modal = document.getElementById('bcl-payment-modal');
    modal.style.display = 'flex';
    
    // Reset modal state
    document.getElementById('payment-processing').style.display = 'none';
    document.getElementById('payment-success').style.display = 'none';
    document.getElementById('payment-error').style.display = 'none';
    document.getElementById('payment-action').style.display = 'block';
  }

  // Payment method selection
  document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.payment-method-btn').forEach(b => {
        b.classList.remove('active');
      });
      this.classList.add('active');
    });
  });

  // Proceed to payment
  document.getElementById('proceed-payment').addEventListener('click', async function() {
    const selectedMethod = document.querySelector('.payment-method-btn.active')?.dataset.method || 'ALL';
    
    // Show processing
    document.getElementById('payment-action').style.display = 'none';
    document.getElementById('payment-processing').style.display = 'block';
    
    try {
      // Call your backend to create BCL payment
      const response = await fetch('http://localhost:3000/create-bcl-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentPaymentData,
          payment_method: selectedMethod
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        currentOrderId = data.orderId;
        
        // Create hidden form for BCL payment
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.paymentUrl;
        form.style.display = 'none';
        
        // Add all parameters
        Object.entries(data.params).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
        
      } else {
        throw new Error(data.error || 'Payment initiation failed');
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      document.getElementById('payment-processing').style.display = 'none';
      document.getElementById('payment-error').style.display = 'block';
      document.getElementById('payment-error').textContent = 'Payment error: ' + error.message;
      document.getElementById('payment-action').style.display = 'block';
    }
  });

  // Close modal
  document.getElementById('close-bcl-modal').addEventListener('click', function() {
    document.getElementById('bcl-payment-modal').style.display = 'none';
  });

  // Close modal when clicking outside
  document.getElementById('bcl-payment-modal').addEventListener('click', function(e) {
    if (e.target.id === 'bcl-payment-modal') {
      this.style.display = 'none';
    }
  });

  // Download after payment
  document.getElementById('download-hd-paid').addEventListener('click', function() {
    downloadStamp(true, true); // HD paid version
    document.getElementById('bcl-payment-modal').style.display = 'none';
  });
});