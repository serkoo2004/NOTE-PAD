(function($) {
    const notList = document.getElementById('not-list');
  
    notList.addEventListener('click', (event) => {
        if (event.target.classList.contains('paylas-not')) {
            const notId = event.target.dataset.notId;
            paylasNot(notId, event.target); 
        } 
    });
  
    function paylasNot(notId, buttonElement) {
        const paylasForm = document.getElementById(`paylasimModal-${notId}`); 
  
        if (paylasForm) { 
            // Modalı kapat
            $(paylasForm).modal('hide'); 
  
            // Modalı aç
            $(`#paylasimModal-${notId}`).modal('show');  
            const paylasilanKullaniciSelect = $(`#paylasimModal-${notId}`).find('#paylasilanKullaniciId'); 
            console.log('paylasNot fonksiyonu çalışıyor. notId:', notId);
        } else {
            console.error('Modal bulunamadı.'); 
        } 
    }
  
    // Modal içindeki form submit olayı
    $(document).on('submit', 'form[id^="paylas-form-"]', function(event) {
        event.preventDefault(); 
  
        // Form verilerini alın (serialize)
        const data = $(this).serialize(); 
  
        // AJAX isteği göndererek notu paylaşın
        $.ajax({
            url: $(this).attr('action'), 
            method: 'POST',
            data: data,
            success: function(response) {
                console.log('Not başarıyla paylaşıldı:', response);
                // Paylaşım başarılı olursa modalı kapatın
                $('#paylasimModal-' + response.notId).modal('hide'); // Modalı Kapat
            },
            error: function(error) {
                console.error('Not paylaşımı başarısız:', error);
            }
        });
    });
  
    // Güncelleme formunu dinleyen kod ekle
    $(document).on('click', '.guncelle-not', function(event) {
        const notId = $(this).data('not-id'); // notId'yi al
        // Güncelleme butonunu gizle
        $(this).hide();
        // Güncelleme formunu göster
        $(`#guncelle-form-${notId}`).show();
    });
  
    // Güncelleme formunu dinleyen kod ekle
    $(document).on('submit', 'form[id^="guncelle-form-"]', function(event) {
        event.preventDefault(); 
        const data = $(this).serialize(); // Form verilerini al
        const notId = $(this).find('input[name="notId"]').val(); // notId'yi al
  
        // AJAX isteği gönder
        $.ajax({
            url: $(this).attr('action'),
            method: 'POST',
            data: data,
            success: function(response) {
                console.log('Not başarıyla güncellendi:', response);
                // Güncelleme başarılı olursa formu gizle
                $(`#guncelle-form-${notId}`).hide();
                // Güncelleme butonunu göster
                $(`#not-list li[data-not-id="${notId}"] .guncelle-not`).show();
                // Sayfayı güncelle
                $(`#not-list li[data-not-id="${notId}"] h3`).text(response.baslik); 
                $(`#not-list li[data-not-id="${notId}"] p`).text(response.icerik); 
            },
            error: function(error) {
                console.error('Not güncelleme başarısız:', error);
            }
        });
    });
  })(jQuery);