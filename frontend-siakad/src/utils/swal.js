import Swal from 'sweetalert2';

// 1. Notifikasi Sukses/Gagal (Toast di Pojok Kanan Atas)
export const showToast = (message, icon = 'success') => {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: icon,
        title: message
    });
};

// 2. Modal Konfirmasi (Untuk Hapus / Logout)
export const confirmDialog = async (title, text, confirmText = 'Ya, Lanjutkan') => {
    const result = await Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4f46e5', // Warna Indigo-600 (Sesuai tema kita)
        cancelButtonColor: '#d33',
        confirmButtonText: confirmText,
        cancelButtonText: 'Batal',
        reverseButtons: true
    });

    return result.isConfirmed;
};

// 3. Alert Biasa (Pop up tengah)
export const showAlert = (title, text, icon = 'info') => {
    Swal.fire({
        title: title,
        text: text,
        icon: icon,
        confirmButtonColor: '#4f46e5'
    });
};