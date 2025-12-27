/**
 * LIFF Navigation Helper
 * ตรวจจับว่าผู้ใช้เข้ามาจาก LIFF และแสดง floating button กลับไปหน้า LIFF
 */

(function () {
    'use strict';

    // ตรวจสอบว่าเข้ามาจาก LIFF หรือไม่
    const isFromLiff = checkLiffContext();

    if (isFromLiff) {
        // เพิ่ม LIFF navigation
        addLiffNavigation();
        // เก็บ context ไว้
        sessionStorage.setItem('liff_context', 'true');
    }

    /**
     * ตรวจสอบ context ว่ามาจาก LIFF หรือไม่
     */
    function checkLiffContext() {
        // 1. ตรวจสอบ URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('from') === 'liff') {
            return true;
        }

        // 2. ตรวจสอบ referrer
        const referrer = document.referrer;
        if (referrer && referrer.includes('liff.html')) {
            return true;
        }

        // 3. ตรวจสอบ sessionStorage
        if (sessionStorage.getItem('liff_context') === 'true') {
            return true;
        }

        // 4. ตรวจสอบ LIFF SDK
        if (typeof liff !== 'undefined' && liff.isInClient && liff.isInClient()) {
            return true;
        }

        // 5. ตรวจสอบ User-Agent (LINE app)
        const userAgent = navigator.userAgent || '';
        if (userAgent.includes('Line/') || userAgent.includes('LIFF')) {
            return true;
        }

        return false;
    }

    /**
     * เพิ่ม LIFF navigation elements
     */
    function addLiffNavigation() {
        // สร้าง Floating Button กลับไป LIFF
        const floatingBtn = document.createElement('a');
        floatingBtn.href = 'liff.html';
        floatingBtn.id = 'liff-back-btn';
        floatingBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            <span>กลับ LINE</span>
        `;
        floatingBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: linear-gradient(135deg, #7a624a 0%, #5a4a3a 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 50px;
            display: flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
            font-weight: 600;
            font-family: 'IBM Plex Sans Thai', sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(122, 98, 74, 0.4);
            z-index: 9999;
            transition: all 0.3s ease;
        `;

        floatingBtn.addEventListener('mouseenter', () => {
            floatingBtn.style.transform = 'translateY(-3px)';
            floatingBtn.style.boxShadow = '0 6px 20px rgba(122, 98, 74, 0.5)';
        });

        floatingBtn.addEventListener('mouseleave', () => {
            floatingBtn.style.transform = 'translateY(0)';
            floatingBtn.style.boxShadow = '0 4px 15px rgba(122, 98, 74, 0.4)';
        });

        document.body.appendChild(floatingBtn);

        // อัพเดท link ใน navbar ให้ไป liff.html แทน index.html
        updateNavbarLinks();

        // เพิ่ม ?from=liff ให้กับ internal links
        addLiffContextToLinks();
    }

    /**
     * อัพเดท navbar links สำหรับ LIFF users
     */
    function updateNavbarLinks() {
        // เปลี่ยน "หน้าหลัก" ให้ไป liff.html
        const homeLinks = document.querySelectorAll('a[href="/"], a[href="index.html"], a[href="/index.html"]');
        homeLinks.forEach(link => {
            if (!link.closest('#liff-back-btn')) {
                link.href = 'liff.html';
            }
        });

        // เพิ่ม LIFF brand link
        const brandLinks = document.querySelectorAll('.navbar-brand');
        brandLinks.forEach(link => {
            link.href = 'liff.html';
        });
    }

    /**
     * เพิ่ม context parameter ให้กับ internal links
     */
    function addLiffContextToLinks() {
        const internalLinks = document.querySelectorAll('a[href*=".html"]:not([href*="liff.html"]):not([href^="http"])');

        internalLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.includes('from=liff')) {
                const separator = href.includes('?') ? '&' : '?';
                link.href = href + separator + 'from=liff';
            }
        });
    }

    // Export for external use
    window.LiffNav = {
        isFromLiff: isFromLiff,
        goBackToLiff: function () {
            window.location.href = 'liff.html';
        }
    };
})();
