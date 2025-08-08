// ==== Import Firebase dari CDN ====
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import { 
    getFirestore, collection, addDoc, getDocs, query, orderBy, Timestamp 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// ==== Konfigurasi Firebase ===
const firebaseConfig = {
    apiKey: "AIzaSyCw-m4u-Vnj-01ykZNaDTbe25xcSF0jlAE",
    authDomain: "daftarhadirmeta.firebaseapp.com",
    projectId: "daftarhadirmeta",
    storageBucket: "daftarhadirmeta.firebasestorage.app",
    messagingSenderId: "990984880996",
    appId: "1:990984880996:web:eb89cb22c310f500afb071",
    measurementId: "G-63JYX45FSM"
};

// ==== Inisialisasi Firebase & Firestore ====
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// ==== Variabel lokasi ====
let latitude = null, longitude = null;

// ==== Fungsi minta lokasi ====
function requestLocation() {
    if (!("geolocation" in navigator)) {
        showAlert("⚠️ Perangkat tidak mendukung GPS.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            document.getElementById("lokasi-status").innerText = " Lokasi: " + latitude + ", " + longitude;
            document.getElementById("lokasi-status").classList.remove("error");
            document.getElementById("lokasi-status").classList.add("success");
        },
        (error) => {
            let message = "";
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message = "❌ Akses lokasi ditolak. Silakan izinkan di pengaturan browser.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = "⚠️ Lokasi tidak tersedia. Periksa koneksi GPS atau internet.";
                    break;
                case error.TIMEOUT:
                    message = "⏳ Permintaan lokasi terlalu lama. Coba lagi.";
                    break;
                default:
                    message = "⚠️ Terjadi kesalahan mendapatkan lokasi.";
            }
            showAlert(message);
            document.getElementById("lokasi-status").innerText = "⚠️ Lokasi tidak tersedia";
            document.getElementById("lokasi-status").classList.remove("success");
            document.getElementById("lokasi-status").classList.add("error");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// ==== Load data dari Firestore ====
async function loadData() {
    let tableContent = `<thead class="table-dark text-center">
        <tr>
            <th>Waktu</th>
            <th>Nama</th>
            <th>Status</th>
            <th>Lokasi</th>
        </tr>
    </thead><tbody>`;

    let today = new Date().toISOString().split("T")[0];
    const q = query(collection(db, "absensi"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        let row = doc.data();
        let timestamp = row.timestamp.toDate();
        let rowDate = timestamp.toISOString().split("T")[0];

        let formattedDate = timestamp.toLocaleDateString("id-ID", {
            day: "numeric", month: "long", year: "numeric"
        });
        let formattedTime = timestamp.toLocaleTimeString("id-ID", {
            hour: "2-digit", minute: "2-digit", hour12: false
        });
        let localTime = `${formattedDate} : ${formattedTime}`;

        if (rowDate === today) {
            let googleMapsLink = `https://www.google.com/maps?q=${row.latitude},${row.longitude}`;
            tableContent += `<tr>
                <td style="text-align: center;">${localTime}</td>
                <td style="text-align: center;">${row.nama}</td>
                <td style="text-align: center;">${row.status}</td>
                <td style="text-align: center;">
                    <a href="${googleMapsLink}" target="_blank" class="text-primary fw-bold" style="text-decoration: none;">📍 Google Maps</a>
                </td>
            </tr>`;
        }
    });

    tableContent += `</tbody>`;
    document.getElementById("dataTable").innerHTML = tableContent;
}


// ==== Kirim data ke Firestore ====
async function submitForm() {
    const nama = document.getElementById("nama").value.trim();
    const status = document.getElementById("status").value;
    const regexNama = /^[A-Za-z0-9\s.-]+$/;

    if (!nama.match(regexNama)) {
        showAlert("❌ Nama hanya boleh mengandung huruf, angka, dan spasi!");
        return;
    }
    if (!nama || !status) {
        showAlert("⚠️ Harap isi semua data!");
        return;
    }
    if (latitude === null || longitude === null) {
        showAlert("⚠️ Harap izinkan lokasi terlebih dahulu!");
        return;
    }

    try {
        await addDoc(collection(db, "absensi"), {
            timestamp: Timestamp.now(),
            nama: nama,
            status: status,
            latitude: latitude,
            longitude: longitude
        });
        showAlert("✅ Data berhasil dikirim ke Firestore!");
        document.getElementById("nama").value = "";
        document.getElementById("status").value = "";
        loadData();
    } catch (error) {
        console.error("Error:", error);
        showAlert("❌ Gagal mengirim data. Silakan coba lagi!");
    }
}

// ==== Fungsi alert ====
function showAlert(message) {
    document.getElementById("alertMessage").innerText = message;
    let alertModal = new bootstrap.Modal(document.getElementById("customAlert"));
    alertModal.show();
}

// ==== Event Listener ====
document.getElementById("btnLokasi").addEventListener("click", requestLocation);
document.getElementById("btnSubmit").addEventListener("click", submitForm);
window.onload = loadData;




