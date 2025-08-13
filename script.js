// Zmienna do przechowywania miejsc
let places = [];

// 🔥 Adres Twojej bazy Firebase – ZMIEN NA SWÓJ!
const firebaseBaseUrl = "https://moj-dziennik-podrozy-default-rtdb.europe-west1.firebasedatabase.app";
const firebasePlacesUrl = `${firebaseBaseUrl}/places.json`;

// Uruchom, gdy strona się załaduje
document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ Skrypt się uruchomił");

  // 1. Utwórz mapę i ustaw widok na Wielką Brytanię
  const map = L.map("map").setView([54.5, -3.0], 6);

  // 2. Dodaj warstwę mapy
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // 3. Załaduj dane z Firebase
  fetch(firebasePlacesUrl)
    .then(response => {
      if (response.ok && response.status !== 404) {
        return response.json();
      } else {
        console.warn("Brak danych w Firebase – zaczynam od pustej listy");
        return null;
      }
    })
    .then(data => {
      places = [];
      if (data) {
        places = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
      }
      console.log("📥 Pobrano dane z Firebase:", places);
      addMarkersToMap(places, map);
    })
    .catch(error => {
      console.error("❌ Błąd ładowania z Firebase:", error);
      alert("Nie udało się połączyć z bazą danych.");
    });

  // Funkcja dodająca pinezki
  function addMarkersToMap(data, map) {
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) map.removeLayer(layer);
    });

    data.forEach(place => {
      const marker = L.marker([place.lat, place.lng]).addTo(map);

      marker.bindTooltip(place.name, {
        permanent: false,
        direction: "top",
        offset: [0, -10]
      });

      marker.bindPopup(`
        <div class="popup-content">
          <strong><a href="place.html?id=${place.id}" style="color: inherit; text-decoration: none;">${place.name}</a></strong><br>
          ${place.description}<br>
          <img src="${place.image.trim()}" alt="Zdjęcie" width="100"><br>
          <small>Kategoria: ${place.category}</small><br><br>
          <button onclick="editPlace('${place.id}')" style="background: #FFC107; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 14px;">✏️ Edytuj</button>
          <button onclick="deletePlace('${place.id}')" style="background: #F44336; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 14px; margin-left: 5px;">🗑️ Usuń</button>
        </div>
      `);
    });
  }

  // Obsługa kliknięcia w mapę
  map.on("click", function(event) {
    const lat = event.latlng.lat;
    const lng = event.latlng.lng;

    if (confirm(`Czy chcesz dodać nowe miejsce w: ${lat.toFixed(4)}, ${lng.toFixed(4)}?`)) {
      openAddModal(lat, lng);
    }
  });

  // Otwórz formularz dodawania
  window.openAddModal = function(lat, lng) {
    document.getElementById("placeLat").value = lat;
    document.getElementById("placeLng").value = lng;
    document.getElementById("placeForm").reset();
    // ✅ Wyczyść pola dat
    document.getElementById("placeDateFrom").value = "";
    document.getElementById("placeDateTo").value = "";
    document.getElementById("modalTitle").textContent = "Dodaj nowe miejsce";
    document.getElementById("saveBtn").textContent = "Zapisz";
    document.getElementById("placeId").value = "";
    document.getElementById("modal").style.display = "flex";
  };

  // Edytuj miejsce
  window.editPlace = function(id) {
    const place = places.find(p => p.id === id);
    if (!place) return;

    document.getElementById("placeName").value = place.name;
    document.getElementById("placeDescription").value = place.description;
    document.getElementById("placeImage").value = place.image;
    document.getElementById("placeCategory").value = place.category;
    document.getElementById("placeDateFrom").value = place.dateFrom || "";
    document.getElementById("placeDateTo").value = place.dateTo || "";
    document.getElementById("placeLat").value = place.lat;
    document.getElementById("placeLng").value = place.lng;
    document.getElementById("placeId").value = id;

    document.getElementById("modalTitle").textContent = "Edytuj miejsce";
    document.getElementById("saveBtn").textContent = "Zaktualizuj";
    document.getElementById("modal").style.display = "flex";
  };

  // Usuń miejsce
  window.deletePlace = function(id) {
    if (confirm("Czy na pewno chcesz usunąć to miejsce?")) {
      const deleteUrl = `${firebaseBaseUrl}/places/${id}.json`;
      fetch(deleteUrl, { method: "DELETE" })
        .then(response => {
          if (response.ok) {
            places = places.filter(p => p.id !== id);
            addMarkersToMap(places, map);
            alert("✅ Miejsce usunięte! Zmiana zapisana w chmurze.");
          } else {
            throw new Error("Błąd serwera: " + response.status);
          }
        })
        .catch(err => {
          console.error("❌ Błąd podczas usuwania:", err);
          alert("Nie udało się usunąć miejsca.");
        });
    }
  };

  // Zamknij formularz
  window.closeModal = function() {
    document.getElementById("modal").style.display = "none";
  };

  // Zapisz (dodaj/edytuj)
  document.getElementById("placeForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const id = document.getElementById("placeId").value;
    const isEdit = id !== "";

    const placeData = {
      name: document.getElementById("placeName").value,
      lat: parseFloat(document.getElementById("placeLat").value),
      lng: parseFloat(document.getElementById("placeLng").value),
      description: document.getElementById("placeDescription").value,
      image: document.getElementById("placeImage").value,
      category: document.getElementById("placeCategory").value,
      dateFrom: document.getElementById("placeDateFrom").value,
      dateTo: document.getElementById("placeDateTo").value || ""
    };

    // ✅ Poprawny adres: tylko jedno miejsce
    const method = isEdit ? "PUT" : "POST";
    const url = isEdit 
      ? `${firebaseBaseUrl}/places/${id}.json` 
      : `${firebaseBaseUrl}/places.json`;

    fetch(url, {
      method: method,
      body: JSON.stringify(placeData),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => response.json())
    .then(dataFromFirebase => {
      const finalId = isEdit ? id : dataFromFirebase.name;

      if (!isEdit) {
        placeData.id = finalId;
        places.push(placeData);
      } else {
        const index = places.findIndex(p => p.id === id);
        if (index !== -1) places[index] = { ...placeData, id: finalId };
      }

      addMarkersToMap(places, map);
      closeModal();
      alert(isEdit ? "✅ Miejsce zaktualizowane!" : "✅ Miejsce dodane i zapisane w chmurze!");
    })
    .catch(err => {
      console.error("❌ Błąd zapisu do Firebase:", err);
      alert("Nie udało się zapisać danych.");
    });
  });
});
