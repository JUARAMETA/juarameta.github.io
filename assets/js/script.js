// ==== Konfigurasi Firebase ====
// Ganti isi firebaseConfig ini sesuai project Firebase kamu
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, Timestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "PROJECT_ID.firebaseapp.com",
    projectId: "PROJECT_ID",
    storageBucket: "PROJECT_ID.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let latitude = null, longitude = null;

// ==== Fungsi minta lokasi ====
function requestLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
                document.getElementById("lokasi-status").innerText = `📍 Lokasi: ${latitude}, ${longitude}`;
                document.getElementById("lokasi-status").classList.add("success");
            },
            (error) => {
                showAlert("⚠️ Gagal mendapatkan lokasi: " + error.message);
                document.getElementById("lokasi-status").innerText = "⚠️ Lokasi tidak tersedia";
                document.getElementById("lokasi-status").classList.add("error");
            }
        );
    } else {
        showAlert("⚠️ Perangkat tidak mendukung GPS.");
    }
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
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        let formattedTime = timestamp.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
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

// ==== Fungsi tambahan ====
function openMap(lat, lon) {
    window.open(`https://www.google.com/maps?q=${lat},${lon}`, "_blank");
}

function showAlert(message) {
    document.getElementById("alertMessage").innerText = message;
    let alertModal = new bootstrap.Modal(document.getElementById("customAlert"));
    alertModal.show();
}

function closeAlert() {
    let alertModalEl = document.getElementById("customAlert");
    let alertModal = bootstrap.Modal.getInstance(alertModalEl);
    alertModal.hide();
}

window.onload = function() {
    loadData();
};
