// ฟังก์ชันสำหรับปุ่ม "ข้อมูลเพิ่มเติม"
document.addEventListener('DOMContentLoaded', function() {
    // เพิ่มการทำงานให้กับปุ่ม "ข้อมูลเพิ่มเติม"
    const infoButtons = document.querySelectorAll('.btn-primary');
    
    infoButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productType = this.closest('.card').querySelector('.card-title').textContent;
            
            if (productType.includes('แชมพู')) {
                window.location.href = 'services.html#shampoo';
            } else if (productType.includes('ครีมอาบน้ำ')) {
                window.location.href = 'services.html#shower';
            } else if (productType.includes('เซรั่ม')) {
                window.location.href = 'services.html#serum';
            } else if (productType.includes('บริการ')) {
                window.location.href = 'services.html#service';
            }
        });
    });

    // เพิ่มการทำงานให้กับฟอร์มติดต่อ
    const contactForm = document.querySelector('form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('name-1').value;
            const lineId = document.getElementById('email-1').value;
            const message = document.getElementById('message-1').value;
            
            if (!name || !lineId || !message) {
                alert('กรุณากรอกข้อมูลให้ครบถ้วน');
                return;
            }
            
            // ในอนาคตสามารถเชื่อมต่อกับ backend API ได้
            alert('ขอบคุณสำหรับข้อความ เราจะติดต่อกลับโดยเร็วที่สุด');
            contactForm.reset();
        });
    }

    // เพิ่มเอฟเฟกต์ Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
});

// เพิ่มฟังก์ชันสำหรับ Lightbox Gallery
function enhanceLightbox() {
    const galleryItems = document.querySelectorAll('.photos .item a');
    
    galleryItems.forEach(item => {
        const imgSrc = item.querySelector('img').src;
        item.href = imgSrc; // แก้ไข URL ของ lightbox ให้ตรงกับรูปภาพจริง
    });
}

// เรียกใช้ฟังก์ชันเมื่อหน้าเว็บโหลดเสร็จ
window.onload = function() {
    enhanceLightbox();
};