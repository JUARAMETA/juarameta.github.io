const scriptURL = "https://script.google.com/macros/s/AKfycbyib14Bqwor_C8obsmnTshVB2lOE6ttM6MlL5SteMXNiX-l5Zt30FTpzNqZWt8LZK2B9Q/exec"; 
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


function loadData() {
    fetch(scriptURL)
        .then(response => response.json())
        .then(data => {
            let tableContent = `<thead class="table-dark text-center">
                <tr>
                    <th>Waktu</th>
                    <th>Nama</th>
                    <th>Status</th>
                    <th>Lokasi</th>
                </tr>
            </thead><tbody>`;

            let today = new Date().toISOString().split("T")[0];

            // Membalik urutan data agar yang terbaru di atas
            data.slice(1).reverse().forEach(row => {
                let timestamp = new Date(row[0]);
                let rowDate = timestamp.toISOString().split("T")[0];

                // Format waktu menjadi "1 Februari 2025 17:00"
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
                    let googleMapsLink = `https://www.google.com/maps?q=${row[3]},${row[4]}`;
                    tableContent += `<tr>
                        <td style="text-align: center;">${localTime}</td>
                        <td style="text-align: center;">${row[1]}</td>
                        <td style="text-align: center;">${row[2]}</td>
                        <td style="text-align: center;">
                            <a href="${googleMapsLink}" target="_blank" class="text-primary fw-bold" style="text-decoration: none;">📍 Google Maps</a>
                        </td>
                    </tr>`;
                }
            });

            tableContent += `</tbody>`;
            document.getElementById("dataTable").innerHTML = tableContent;
        })
        .catch(error => console.error("Error:", error));
}



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

function submitForm() {
    const nama = document.getElementById("nama").value.trim();
    const status = document.getElementById("status").value;
    const regexNama = /^[A-Za-z0-9\s-]+$/;

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

    fetch(scriptURL)
        .then(response => response.json())
        .then(data => {
            let today = new Date().toISOString().split("T")[0];
            let alreadyCheckedIn = data.slice(1).some(row => {
                let timestamp = new Date(row[0]).toISOString().split("T")[0];
                return row[1] === nama && timestamp === today;
            });

            if (alreadyCheckedIn) {
                showAlert("⚠️ Anda sudah absen hari ini!");
                return;
            }

            fetch(scriptURL, {
                method: "POST",
                body: new URLSearchParams({ nama, status, latitude, longitude }),
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            })
            .then(response => response.text())
            .then(() => {
                showAlert("✅ Data berhasil dikirim ke JuaraMeta!");
                document.getElementById("nama").value = "";
                document.getElementById("status").value = "";
                loadData();
            })
            .catch(error => {
                console.error("Error:", error);
                showAlert("❌ Gagal mengirim data. Silakan coba lagi!");
            });
        })
        .catch(error => {
            console.error("Error:", error);
            showAlert("❌ Gagal mengambil data. Silakan coba lagi!");
        });
}



window.onload = function() {
    loadData();
};
