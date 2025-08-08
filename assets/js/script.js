// Import Firebase SDK (module mode)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Config Firebase kamu
const firebaseConfig = {
  apiKey: "AIzaSyCw-m4u-Vnj-01ykZNaDTbe25xcSF0jlAE",
  authDomain: "daftarhadirmeta.firebaseapp.com",
  projectId: "daftarhadirmeta",
  storageBucket: "daftarhadirmeta.firebasestorage.app",
  messagingSenderId: "990984880996",
  appId: "1:990984880996:web:eb89cb22c310f500afb071",
  measurementId: "G-63JYX45FSM"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let latitude = null, longitude = null;

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

    const querySnapshot = await getDocs(collection(db, "absensi"));
    let docs = [];
    querySnapshot.forEach((doc) => docs.push(doc.data()));
    docs.sort((a,b) => b.timestamp.seconds - a.timestamp.seconds); // urutkan terbaru

    docs.forEach(row => {
        let timestamp = row.timestamp.toDate();
        let rowDate = timestamp.toISOString().split("T")[0];

        let formattedDate = timestamp.toLocaleDateString("id-ID", {
            day: "numeric", month: "long", year: "numeric"
        });

        let formattedTime = timestamp.toLocaleTimeString("id-ID", {
            hour: "2-digit", minute: "2-digit", hour12: false
        });

        if (rowDate === today) {
            let googleMapsLink = `https://www.google.com/maps?q=${row.latitude},${row.longitude}`;
            tableContent += `<tr>
                <td style="text-align: center;">${formattedDate} : ${formattedTime}</td>
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
        showAlert("✅ Data berhasil dikirim!");
        document.getElementById("nama").value = "";
        document.getElementById("status").value = "";
        loadData();
    } catch (error) {
        console.error(error);
        showAlert("❌ Gagal mengirim data.");
    }
}

function showAlert(message) {
    document.getElementById("alertMessage").innerText = message;
    let alertModal = new bootstrap.Modal(document.getElementById("customAlert"));
    alertModal.show();
}

window.onload = function() {
    loadData();
};
